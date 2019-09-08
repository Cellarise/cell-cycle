import R from 'ramda';
import Bacon from 'baconjs';
import L from 'leaflet';
import esri from 'esri-leaflet';
import orderedDeferredSet from '../utils/deferred';
import * as remoteAPIStreamFactory from './remoteAPIStreamFactory';
import {removeApiServer, logger, $, goog} from '../globals';

//const WGS84 = 4326;
const australiaExtent = [[-44, 112], [-10, 155]];
const IGNORE_ATTRIBUTES = ['OBJECTID', 'SHAPE', 'Symcode'];

//Enable late binding to google services
let autocompleteService;
let placesService;
let geocodeService;

/*
 * Use same return structure as remoteAPIUtils createRemoteAPIStreams, with custom response streams.
 */
export function createRemoteAPIStreams(driverConfig, model) {
  const requestStreams = {};
  const responseStreams = {};
  const request = new Bacon.Bus();
  R.map(
    (store) => {
      const storeId = store.name;
      requestStreams[storeId] = {};
      responseStreams[storeId] = {};
      R.mapObjIndexed(
        (actionConfig, actionId) => {
          if (actionConfig.hasOwnProperty('handlerRequest')
            && (!driverConfig.useIfDeclaredOnly || actionConfig.driver
            && actionConfig.driver === driverConfig.name)) {
            requestStreams[storeId][actionId] = new Bacon.Bus();
            responseStreams[storeId][actionId] = createResponseStream(requestStreams[storeId][actionId], actionConfig);
          }
        },
        store.actions
      );
    },
    model.get("configCompiled").stores
  );
  return {
    'push': (action) => (request.push(action)),
    'request': request,
    'requestStreams': requestStreams,
    'responseStreams': responseStreams
  };
}

function createResponseStream(requestStream, actionConfig) {
  let nextRequestStream = requestStream;
  const debounce = actionConfig.handlerRequest.debounce;
  if (debounce) {
    nextRequestStream = nextRequestStream.debounce(debounce);
  }
  return nextRequestStream.flatMapLatest((action) => {
    const property = action.config.handlerRequest.property;
    switch (property) {
      case 'autocomplete':
        return autocomplete(action);
      case 'placeDetails':
        return placeDetails(action);
      case 'geocode':
        return geocode(action);
      case 'reverseGeocode':
        return reverseGeocode(action);
      case 'identifyFeatures':
        return identifyFeatures(action);
      default:
        logger.error("Unexpected property " + property + " on waypointSearchAPI handlerRequest");
    }
  });
}

function googleMapsAutocomplete(term) {
  const request = {
    'input': term,
    'componentRestrictions': {'country': 'AU'}
  };
  const deferred = $.Deferred();
  if (R.isNil(autocompleteService) && !R.isNil(goog)) {
    autocompleteService = new goog.maps.places.AutocompleteService();
  }
  if (R.isNil(autocompleteService)) {
    deferred.resolve([]);
    return deferred;
  }
  autocompleteService.getPlacePredictions(request, function (predictions, status) {
    if (status === goog.maps.places.PlacesServiceStatus.OK) {
      // Sometimes Google returns results with exactly the same name, so just take the first of these
      let nextPredictions = R.uniqBy(p => p.description, predictions);
      nextPredictions = R.map(prediction => {
        return {
          'name': prediction.description.replace(/, Australia$/, ''),
          'placeId': prediction.place_id
        };
      }, nextPredictions);
      deferred.resolve(nextPredictions);
    } else if (status === goog.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
      deferred.resolve([]);
    } else {
      logger.error("Error when requesting Google Maps Autocomplete Service: " + status);
      deferred.reject([]);
    }
  });
  return deferred;
}

function googleMapsPlacesSearch(term) {
  const request = {
    'query': term
  };
  const deferred = $.Deferred();
  if (R.isNil(placesService) && !R.isNil(goog)) {
    placesService = new goog.maps.places.PlacesService($('<div>')[0]);
  }
  if (R.isNil(placesService)) {
    deferred.resolve([]);
    return deferred;
  }
  placesService.textSearch(request, function (places, status) {
    if (status === goog.maps.places.PlacesServiceStatus.OK) {
      const australiaBounds = L.latLngBounds(australiaExtent);
      let nextPlaces = R.filter(place => {
        return australiaBounds.contains([place.geometry.location.lat(), place.geometry.location.lng()]);
      }, places);
      nextPlaces = R.map(place => {
        return {
          'name': place.name,
          'lat': place.geometry.location.lat(),
          'lng': place.geometry.location.lng()
        };
      }, nextPlaces);
      deferred.resolve(nextPlaces);
    } else if (status === goog.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
      deferred.resolve([]);
    } else {
      logger.error("Error when requesting Google Maps Place Search Service: " + status);
      deferred.reject([]);
    }
  });
  return deferred;
}

function routePlannerAddressCandidates(term, limit, model) {
  const deferred = $.Deferred();
  const apiServer = removeApiServer;
  const urlPart = '/api/RoutePlannerServices/autocomplete';
  const security = model.getIn(['drivers', 'remoteAPI', 'security']).toJS();
  //const security = configCompiled.drivers.remoteAPI.security;
  const headers = {};
  headers[security.accessTokenHeader] = model.getIn(['stores', 'authenticationUI', 'props', 'access_token', 'id']);
  headers[security.sessionTokenHeader] = model.getIn(['stores', 'authenticationUI', 'props',
    'sessionTokens', 'X-Session-Token']);
  $.ajax({
    'headers': headers,
    'url': apiServer + urlPart,
    'contentType': 'application/json',
    'data': {'term': term},
    'dataType': 'json'
  }).done(response => {
    if (R.isNil(response.candidates)) {
      //logger.error("Error when requesting Route Planner Find Address Candidates Service: no candidates");
      deferred.reject([]);
    } else {
      deferred.resolve(R.map(candidate => {
        return {
          'name': candidate.address,
          'lat': candidate.location.y,
          'lng': candidate.location.x
        };
      }, response.candidates.slice(0, limit)));
    }
  }).fail((jqXHR, textStatus) => {
    logger.error("Error when requesting Route Planner Find Address Candidates Service: " + textStatus);
    deferred.reject([]);
  });
  return deferred;
}

function autocomplete(action) {
  const take = action.config.handlerRequest.take || 10;
  const model = action.model;
  const store = model.getIn(['stores', action.storeId]);
  const term = store.toJS().search.term.trim();

  const deferredSet = orderedDeferredSet(result => result.length);
  return Bacon.fromCallback(function (callback) {
    // Note that only one of these deferreds will invoke the callback (Bacon fromCallback is only expected to be
    // invoked a single time
    deferredSet.add(googleMapsAutocomplete(term)).done(callback);
    deferredSet.add(googleMapsPlacesSearch(term)).done(callback);
    deferredSet.add(routePlannerAddressCandidates(term, take, model)).done(callback);
    deferredSet.execute(() => callback([]));
  }).map(results => {
    return {
      'storeId': action.storeId,
      'id': action.id,
      'data': results
    };
  });
}

function placeDetails(action) {
  var model = action.model;
  var store = model.getIn(['stores', action.storeId]);
  return Bacon.fromCallback(function (callback) {
    const request = {
      'placeId': store.toJS().search.term
    };
    if (R.isNil(placesService)) {
      return callback(new Bacon.Error(500));
    }
    placesService.getDetails(request, function (place, status) {
      if (status === goog.maps.places.PlacesServiceStatus.OK) {
        callback({
          'storeId': action.storeId,
          'id': action.id,
          'config': action.config,
          'embeddedPath': action.embeddedPath,
          'data': {
            'placeId': place.place_id,
            'name': place.formatted_address,
            'lat': place.geometry.location.lat(),
            'lng': place.geometry.location.lng()
          }
        });
      } else {
        callback(new Bacon.Error(status));
      }
    });
  });
}


function geocode(actionObj) {
  if (R.isNil(geocodeService) && !R.isNil(goog)) {
    geocodeService = new goog.maps.Geocoder();
  }
  var model = actionObj.model;
  var store = model.getIn(["stores", actionObj.storeId]);
  var actionConfig = actionObj.config;
  var restFilterObj = remoteAPIStreamFactory.replaceStateReferences(store, model, actionConfig, 0)(R.merge(
    R.defaultTo({}, actionConfig.handlerRequest.query),
    remoteAPIStreamFactory.getTableQuery(store)(actionConfig.handlerRequest)
  ));
  //dropLast removes the '%'
  var searchAddress = R.dropLast(1, restFilterObj.where.or[0].ADDRESS.like);
  searchAddress = searchAddress + (restFilterObj.where.or.length > 1
    ? " " + R.dropLast(1, restFilterObj.where.or[1].state.like)
    : "");
  searchAddress = searchAddress + (restFilterObj.where.or.length > 2
    ? " " + R.dropLast(1, restFilterObj.where.or[2].postcode.like)
    : "");
  return Bacon.fromCallback(function (callback) {
    if (R.isNil(geocodeService)) {
      return callback(R.assoc("error", {"message": "Geocode service unavailable"}, actionObj));
    }
    // var latlng = new google.maps.LatLng(-34.397, 150.644);
    const request = {
      "address": searchAddress,
      "componentRestrictions": {
        "country": "AU"
      }
    };
    geocodeService.geocode(request, function (results, status) {
      if (status === 'OK') {
        callback(processGeocodeResult(R.take(10, results), actionObj));
      } else {
        callback(R.assoc("error", {"message": status}, actionObj));
      }
    });
  });
}

function reverseGeocode(actionObj) {
  if (R.isNil(geocodeService) && !R.isNil(goog)) {
    geocodeService = new goog.maps.Geocoder();
  }
  var model = actionObj.model;
  var store = model.getIn(["stores", actionObj.storeId]);
  var actionConfig = actionObj.config;
  var restFilterObj = remoteAPIStreamFactory.replaceStateReferences(store, model, actionConfig, 0)(R.merge(
    R.defaultTo({}, actionConfig.handlerRequest.query),
    remoteAPIStreamFactory.getTableQuery(store)(actionConfig.handlerRequest)
  ));
  var latlng = R.dropLast(1, restFilterObj.where.or[0].latlng.like); //drop '%'
  var latlngStr = R.split(",", latlng);
  return Bacon.fromCallback(function (callback) {
    if (R.isNil(geocodeService)) {
      return callback(R.assoc("error", {"message": "Geocode service unavailable"}, actionObj));
    }
    // var latlng = new google.maps.LatLng(-34.397, 150.644);
    const request = {
      "location": {
        "lat": parseFloat(latlngStr[0]),
        "lng": parseFloat(latlngStr[1])
      }
    };
    geocodeService.geocode(request, function (results, status) {
      if (status === 'OK') {
        callback(processGeocodeResult(R.take(10, results), actionObj));
      } else {
        callback(R.assoc("error", {"message": status}, actionObj));
      }
    });
  });
}

function processGeocodeResult(results, action) {
  //google api returns 200 response for subscription errors and result.results = {"error_message": "...
  return R.assoc('data', R.map((item) => (
    R.pipe(
      R.assoc("addressLine", item.formatted_address.split(
        ", " + getComponentType(["locality", "political"], item.address_components, "long_name")
      )[0]),
      R.assoc("locality", getComponentType(["locality", "political"], item.address_components, "long_name")),
      R.assoc("state", getComponentType(
        ["administrative_area_level_1", "political"], item.address_components, "short_name")
      ),
      R.assoc("postcode", getComponentType(["postal_code"], item.address_components, "long_name")),
      R.assoc("name", R.is(String, item.formatted_address)
        ? item.formatted_address.replace(/, Australia$/, '')
        : item.formatted_address
      ),
      R.assoc("ADDRESS", R.is(String, item.formatted_address)
        ? item.formatted_address.replace(/, Australia$/, '')
        : item.formatted_address
      ),
      R.assoc("lng", item.geometry.location.lng()),
      R.assoc("lat", item.geometry.location.lat()),
      R.assoc("type","major")
    )(item)
  ), results), action);
}

function getComponentType(componentType, addressComponents, field) {
  return R.defaultTo("",
    R.defaultTo({},
      R.find(
        (component) => (R.equals(componentType, R.defaultTo([], component.types))),
        R.defaultTo([], addressComponents)
      ))[field]);
}

function identifyFeatures(action) {
  const model = action.model;
  const store = model.getIn(['stores', action.storeId]);
  const filteredLayers = store.getIn(['props', 'GIS', 'filteredLayers']);
  const mapRef = store.getIn(['props', 'routePrint', 'mapRef']);

  const $div = $(mapRef._container);
  const latlngCentre = getIdentifyFeaturesCoordinate(mapRef);

  const checkedLayers = R.filter(layer => layer.checked, R.defaultTo([], filteredLayers));
  let services = R.groupBy(layer => layer.mapService.url, checkedLayers);
  services = R.map(function eachLayer(layers) {
    return R.join(',', R.map(layer => layer.layerId, layers));
  }, services);


  return Bacon.fromCallback(function (callback) {
    if (R.keys(services).length === 0) {
      return callback({
        'storeId': action.storeId,
        'id': action.id,
        'config': action.config,
        'embeddedPath': action.embeddedPath,
        'data': []
      });
    }
    const url = R.keys(services)[0];
    const layers = 'all:' + services[url];
    esri.identifyFeatures({url: url})
      .on(mapRef)
      .at(latlngCentre)
      .layers(layers)
      .tolerance($div.offset().left)
      .returnGeometry(false)
      .run((error, featureCollection, response) => {
        if (!R.isNil(error)) {
          return callback({
            'storeId': action.storeId,
            'id': action.id,
            'config': action.config,
            'embeddedPath': action.embeddedPath,
            'data': []
          });
        }
        // Remove duplicates features
        const uniqueResults = R.uniqBy(item => {
          return item.layerId + item.value;
        }, response.results);
        const mappedResults = uniqueResults.map(item => {
          let attributes = item.attributes;
          R.forEach(ignore => {
            attributes = R.dissoc(ignore, attributes);
          }, IGNORE_ATTRIBUTES);
          // Replace null strings with actual nulls
          for (let attribute in attributes) {
            if (attributes[attribute] === 'Null') {
              attributes[attribute] = null;
            }
          }
          return {
            layerName: item.layerName,
            attributes: attributes
          };
        });
        callback({
          'storeId': action.storeId,
          'id': action.id,
          'config': action.config,
          'embeddedPath': action.embeddedPath,
          'data': mappedResults
        });
      });
  });
}


function getIdentifyFeaturesCoordinate(map) {
  const $div = $(map._container);
  const xMin = $div.position().left;
  const yMax = $div.position().top;
  const yMin = yMax + $div.height();
  // const xMax = xMin + $div.width();
  return map.containerPointToLatLng([xMin, yMin]);
}
