"use strict";
import R from 'ramda';
import {$} from '../globals';
import Proj4 from 'proj4'

import {createRemoteAPIStreams as createRemoteAPIStreamsUtil, getResponseMessage} from '../utils/remoteAPIUtils';


/**
 * Mandatory interface method called by the Intent loader to attach the stream request and response handlers to
 * the framework
 * @param {Object} driverConfig - the driver configuration
 * @param {Immutable} model - the model including all configuration
 * @return {Object} a map containing an array of request streams and an array of response streams
 */
export function createRemoteAPIStreams(driverConfig, model) {
  /**
   * utils.createRemoteAPIStreams is a helper method to create the stream request and response handlers
   * @param {Immutable} model - the model including all configuration
   * @param {String} requestActionProp - the signature for store action handlers to route the handler to this device
   * @param {Function} getAjaxConfigFunc - a function receiving an action object and returning the configuration
   * for jQuery.ajax
   * @param {Function} processResultFunc - a function receiving a successful result from jQuery.ajax and the
   * action configuration object and returning the formatted result object which contains the result on the
   * property 'data'
   * @param {Function} processErrorFunc - a function receiving an error result from jQuery.ajax and the
   * action configuration object and returning the formatted error object which contains the error message on the
   * property 'error.message'
   * @return {Object} a map containing an array of request streams and an array of response streams
   */
  return createRemoteAPIStreamsUtil(
    model,
    driverConfig,
    getAjaxConfig,
    processResult,
    processError
  );
}
export function getAjaxConfig(actionObj, driverConfig) {
  var actionConfig = actionObj.config;
  var property = R.defaultTo("geocode", actionConfig.handlerRequest.property);
  switch (property) {
    case "getArcGISonlineWebmap":
      return getArcGISonlineWebmap(actionObj, driverConfig);
    case "getMapServerFolders":
      return getMapServerFolders(actionObj, driverConfig);
    case "getMapLayerListForSelectedMapService":
      return getMapLayerListForSelectedMapService(actionObj, driverConfig);
    case "getMapServiceList":
      return getMapServiceList(actionObj, driverConfig);
    case "getMapLayerList":
      return getMapLayerList(actionObj, driverConfig);
    case "getMapLayerLegend":
      return getMapLayerLegend(actionObj, driverConfig);
    case "getWebmap":
      return getWebmap(actionObj, driverConfig);
    case "executePrint":
      return executePrint(actionObj, driverConfig);
    case "createJourneyForJP":
      return createJourneyForJP(actionObj, driverConfig);
    case "saveJourneyForJP":
      return saveJourneyForJP(actionObj, driverConfig);
    case "saveRouteThumbnail":
      return saveRouteThumbnail(actionObj, driverConfig);
    default:
      return getMapServerFolders(actionObj, driverConfig);
  }
}
export function getArcGISonlineWebmap(actionObj) {
  var model = actionObj.model;
  var mapServers = model.getIn(['stores', actionObj.storeId, 'collection', 'mapServers']).toJS();
  var selectedMapServer = model.getIn(['stores', actionObj.storeId, 'collection', 'selectedMapServer']);
  var url = "http://www.arcgis.com/sharing/content/items/" +
    mapServers[selectedMapServer].label + "/data?f=json";

  return {
    "headers": {},
    "url": url,
    "type": "GET",
    "data": "",
    "dataType": 'json'
  };
}
export function getMapServerFolders(actionObj) {
  var model = actionObj.model;
  var mapServers = model.getIn(['stores', actionObj.storeId, 'collection', 'mapServers']).toJS();
  var selectedMapServer = model.getIn(['stores', actionObj.storeId, 'collection', 'selectedMapServer']);
  var url = mapServers[selectedMapServer].url + "?f=json";

  return {
    "headers": {},
    "url": url,
    "type": "GET",
    "data": "",
    "dataType": 'json'
  };
}
export function getMapServiceList(actionObj) {
  var model = actionObj.model;
  var mapServers = model.getIn(['stores', actionObj.storeId, 'collection', 'mapServers']).toJS();
  var selectedMapServer = model.getIn(['stores', actionObj.storeId, 'collection', 'selectedMapServer']);
  var mapServerFolder = actionObj.mapServerFolder;
  var url = mapServers[selectedMapServer].url + "/" + mapServerFolder + "?f=json";

  return {
    "headers": {},
    "url": url,
    "type": "GET",
    "data": "",
    "dataType": 'json'
  };
}
export function getMapLayerListForSelectedMapService(actionObj) {
  var model = actionObj.model;
  var mapServers = model.getIn(['stores', actionObj.storeId, 'collection', 'mapServers']).toJS();
  var selectedMapServer = model.getIn(['stores', actionObj.storeId, 'collection', 'selectedMapServer']);
  var selectedMapServiceIdx = model.getIn(['stores', actionObj.storeId, 'collection', 'selectedMapService']);
  var selectedMapServices = model.getIn(['stores', actionObj.storeId, 'collection', 'selectedMapServerServices']);
  var selectedMapService = selectedMapServices[selectedMapServiceIdx];
  var url;

  if (selectedMapService.url) { // Map Service from ArcGIS Online Webmap
    url = selectedMapService.url + "?f=json";
  } else { // Map Service from ArcGIS Server
    url = mapServers[selectedMapServer].url + "/" + selectedMapService.name + '/MapServer' + "?f=json";
  }

  return {
    "headers": {},
    "url": url,
    "type": "GET",
    "data": "",
    "dataType": 'json'
  };
}
export function getMapLayerList(actionObj) {
  var url = actionObj.url + "/layers?f=json";
  return {
    "headers": {},
    "url": url,
    "type": "GET",
    "data": "",
    "dataType": 'json',
    // Action data passes back original data related to the action to post response handlers
    'actionData': actionObj.actionData
  };
}
export function getMapLayerLegend(actionObj) {
  var url = actionObj.url + "/legend?f=json";
  return {
    "headers": {},
    "url": url,
    "type": "GET",
    "data": "",
    "dataType": 'json',
    // Action data passes back original data related to the action to post response handlers
    'actionData': actionObj.actionData
  };
}
export function getWebmapLayerList(actionObj) {
  var model = actionObj.model;
  var mapServers = model.getIn(['stores', actionObj.storeId, 'collection', 'mapServers']).toJS();
  var selectedMapServer = model.getIn(['stores', actionObj.storeId, 'collection', 'selectedMapServer']);
  var selectedMapServiceIdx = model.getIn(['stores', actionObj.storeId, 'collection', 'selectedMapService']);
  var selectedMapService = model
    .getIn(['stores', actionObj.storeId, 'collection', 'selectedMapServerServices'])[selectedMapServiceIdx].name;
  var url = mapServers[selectedMapServer].url + "/" + selectedMapService + '/MapServer' + "?f=json";

  return {
    "headers": {},
    "url": url,
    "type": "GET",
    "data": "",
    "dataType": 'json'
  };
}
export function saveRouteThumbnail(actionObj) {
  var model = actionObj.model;
  var url = actionObj.url;
  var thumbnail = model.getIn(['stores', actionObj.storeId, 'routes', 'routeThumbnail']).toJS();

  return {
    "headers": {},
    "url": url,
    "type": "POST",
    "data": {
      "f": "json",
      "Web_Map_as_JSON": JSON.stringify(thumbnail),
      "Format": "SVG",
      "Layout_Template": "MAP_ONLY"
    },
    "dataType": 'json'
  };
}
export function getWebmap() {
  return {
    "headers": {},
    "url": 'https://gis.nhvr.gov.au/RP/webmapData.json',
    "type": "GET",
    "data": {
      "f": "json"
    },
    "dataType": 'json'
  };
}

export function createJourneyForJP(actionObj) {
  var url = actionObj.url;
  var features = actionObj.features;
  var data = {
    "f": "json",
    "routeName": actionObj.routeName,
    "returnDirections": true,
    "returnRoutes": true,
    "returnStops": true,
    "returnBarriers": false,
    "returnPolygonBarriers": false,
    "returnPolylineBarriers": false,
    "attributeParameterValues": JSON.stringify([
      {"attributeName": "Avoid Private Roads", "parameterName": "Restriction Usage", "value": 2},
      {"attributeName": "Avoid Unpaved Roads", "parameterName": "Restriction Usage", "value": 2},
      {"attributeName": "Oneway", "parameterName": "Restriction Usage", "value": -1},
      {"attributeName": "Through Traffic Prohibited", "parameterName": "Restriction Usage", "value": 5}]),
    "outSR": "102100",
    "outputLines": "esriNAOutputLineTrueShape",
    "accumulateAttributeNames": "Meters",
    "restrictionAttributeNames": "Avoid Private Roads,Avoid Unpaved Roads,Oneway,Through Traffic Prohibited",
    "restrictUTurns": "esriNFSBNoBacktrack",
    "outputGeometryPrecision": 0,
    "directionsLengthUnits": "esriNAUKilometers",
    "stops": JSON.stringify({
      "type": "features",
      "features": features,
      "doNotLocateOnRestrictedElements": true
    }),
    "directionsOutputType": "esriDOTStandard"
  };

  return {
    "headers": {},
    "url": url,
    "type": "POST",
    "data": data,
    "dataType": 'json'
  };
}
export function saveJourneyForJP(actionObj) {
  var url = actionObj.url;
  var journey = actionObj.journey;
  var data = {
    "f": "json",
    "routeName": actionObj.routeName,
    "journey": JSON.stringify(journey)
  };

  return {
    "headers": {},
    "url": url,
    "type": "POST",
    "data": data,
    "dataType": 'json'
  };
}
export function processResult(result, actionObj, driverConfig) {
  const message = getResponseMessage(R.merge(result, {"status": 200}), actionObj.config, driverConfig);
  var actionConfig = actionObj.config;
  var property = R.defaultTo("checkMapServerURL", actionConfig.handlerRequest.property);
  switch (property) {
    case "getArcGISonlineWebmap":
      return R.assoc('data', result, actionObj);
    case "getMapServerFolders":
      return R.assoc('data', result.folders, actionObj);
    case "getMapServiceList":
      return R.assoc('data', result, actionObj);
    case "getMapLayerListForSelectedMapService":
      return R.assoc('data', result.layers, actionObj);
    case "getMapLayerList":
      return R.assoc('data', result, actionObj);
    case "getMapLayerLegend":
      return R.assoc('data', result, actionObj);
    case "getWebmap":
      return R.assoc('data', result, actionObj);
    case "executePrint":
      return R.has('error', result) ? processError(result, actionObj) : R.merge(actionObj, {"data": result, "message": message});
    case "createJourneyForJP":
      return R.assoc('data', result, actionObj);
    case "saveJourneyForJP":
      return R.assoc('data', result, actionObj);
    case "saveRouteThumbnail":
      return R.assoc('data', result, actionObj);
    default:
      return result.data;
  }
}
export function processError(result, action) {
  return R.pipe(
    R.assoc('error', result.responseJSON ? result.responseJSON.error : {"message": "Unknown error"})
  )(action);
}

const mapConfig = require("./mapConfig.json");

export function executePrint(actionObj) {
  const model = actionObj.model;
  const store = model.getIn(['stores', actionObj.storeId]);
  const filteredLayers = store.getIn(['props', 'GIS', 'filteredLayers']);
  const waypoints = store.getIn(['records', 0, 'routeWaypoints', 'value']).toJS();
  const mapState = store.getIn(['records', 0, 'mapState', 'value']).toJS();
  const printRecord = store.getIn(['props', 'routePrint', 'activeRecord']);
  const printTitle = printRecord.getIn(['name', 'value']);
  // const printFormat = printRecord.getIn(['printFormat', 'value']);
  // const printTemplate = printRecord.getIn(['printTemplate', 'value']);
  // const printResolution = getPrintResolution(printRecord.getIn(['printResolution', 'value']));
  const printFormat = "PDF";
  const printTemplate = "A4 Portrait";
  const printResolution = 96;
  const mapRef = store.getIn(['props', 'routePrint', 'mapRef']);
  const coordinates = getPrintCoordinates(mapRef);

  const routePath = store.getIn(['props', 'routePageState', 'routePath']);
  const steps = getSteps(routePath);


  const printServiceUrl = mapConfig.printOptions.url +
    "/" + mapConfig.printOptions.task +
    "/execute";
  const webmapAsJSON = mapConfig.webMap;
  let baseMapLayers;
  const routeLayer = {};
  const routeLine = getRoutePolyLine(steps);
  const routePoints = getRoutePoints(waypoints);
  const layerGroups = R.groupBy(filteredLayer => filteredLayer.mapService.name, filteredLayers);
  const mapName = R.isNil(mapState.basemap.value) ? "Google Roadmap" : "Google " + mapState.basemap.value;
  const mapTitle = R.isNil(mapState.basemap.title) ? "Roadmap" : mapState.basemap.value;
  const mapCheckedLayers = R.map(
    operationalLayer => {
      const visibleLayers = [];
      const checkedURL = [];
      R.map(layer => {
        if (layer.checked) {
          const mapServiceUrl = layer.mapService.url
          const url = "http" + mapServiceUrl.substring(5);
          if(!R.isNil(layer.subLayerIds) && layer.subLayerIds.length > 0){
            R.map(subLayer => visibleLayers.push(subLayer), layer.subLayerIds);
          }
          checkedURL.push(url);
        }
      }, operationalLayer);
      if (visibleLayers.length > 0 || checkedURL.length > 0) {
        return {
          "id": "NHVR_MAPS_PRINTING",
          "layerType": "ArcGISMapServiceLayer",
          "visibility": true,
          "opacity": 1,
          "visibleLayers": visibleLayers,
          "url": checkedURL[0]
        }
      }
    },
    R.values(layerGroups)
  );
  webmapAsJSON.operationalLayers = R.defaultTo([], R.filter(layer => !R.isNil(layer), mapCheckedLayers));

  baseMapLayers = R.pipe(
    R.filter((basemap) => (basemap.name === mapName)),
    R.map((basemap) => (basemap.printOptions.baseMapLayers))
  )(mapConfig.basemaps);


  webmapAsJSON.baseMap.baseMapLayers = baseMapLayers[0];
  webmapAsJSON.baseMap.name = mapName;
  webmapAsJSON.baseMap.title = mapTitle;

  webmapAsJSON.mapOptions = {
    "showAttribution": true,
    "extent": {
      "xmin": Proj4( 'EPSG:4326','EPSG:3857', [coordinates.SW.lng, coordinates.SW.lat])[0],
      "ymin": Proj4( 'EPSG:4326','EPSG:3857', [coordinates.SW.lng, coordinates.SW.lat])[1],
      "xmax": Proj4( 'EPSG:4326','EPSG:3857', [coordinates.NE.lng, coordinates.NE.lat])[0],
      "ymax": Proj4( 'EPSG:4326','EPSG:3857', [coordinates.NE.lng, coordinates.NE.lat])[1],
      "spatialReference": {
        "wkid": 102100
      }
    },
    "spatialReference": {
      "wkid": 3857
    }
  };
  webmapAsJSON.exportOptions = {
    "outputSize": [0, 0],
    "dpi": printResolution
  };
  webmapAsJSON.layoutOptions = {
    "titleText": printTitle,
    "customTextElements":
      [
        {"routeId": ""}
      ],
    "scaleBarOptions": {
      "metricUnit": "esriKilometers",
      "metricLabel": "km"
    },
    "legendOptions": {
      "operationalLayers": [{
        "id": "NHVR_MAPS_PRINTING"
      }]
    }
    };

  if (!R.isNil(waypoints)) {
    routeLayer.id = "journey_layer";
    routeLayer.opacity = 1;
    routeLayer.minScale = 0;
    routeLayer.maxScale = 0;
    routeLayer.featureCollection = {};
    routeLayer.featureCollection.layers = [];
    routeLayer.featureCollection.layers.push(routeLine);

    if (routePoints) {
      routeLayer.featureCollection.layers.push(routePoints);
    }
    webmapAsJSON.operationalLayers.push(routeLayer);
  }

  return {
    "headers": {},
    "url": printServiceUrl,
    "type": "POST",
    "data": {
      "f": "json",
      "Web_Map_as_JSON": JSON.stringify(webmapAsJSON),
      "Format": printFormat,
      "Layout_Template": printTemplate
    },
    "dataType": 'json'
  };
}


function getPrintCoordinates(map) {
  const $div = $(map._container);
  const xMin = $div.position().left;
  const yMax = $div.position().top;
  const yMin = yMax + $div.height();
  const xMax = xMin + $div.width();
  return {
    "SW": map.containerPointToLatLng([xMin, yMin]),
    "NE": map.containerPointToLatLng([xMax, yMax])
  };
}

function getRoutePolyLine(steps) {
  if (!steps.length) {
    return null;
  }
  let opacity = 255;
  return {
    "layerDefinition": {
      "name": "polylineLayer",
      "geometryType": "esriGeometryPolyline"
    },
    "featureSet": {
      "geometryType": "esriGeometryPolyline",
      "features": [{
        "attributes": {
          "id": "drawing"
        },
        "symbol": {
          "color": [
            237,
            28,
            36,
            opacity
          ],
          "width": 2.5,
          "type": "esriSLS",
          "style": "esriSLSSolid"
        },
        "geometry": {
          "paths": [steps],
          "spatialReference": {
            "wkid": 4326
          }
        }
      }]
    }
  };
}

function getRoutePoints(waypoints) {
  if (!waypoints.length) {
    return null;
  }
  return {
    "layerDefinition": {
      "name": "pointLayer",
      "geometryType": "esriGeometryPoint"
    },
    "featureSet": {
      "geometryType": "esriGeometryPoint",
      "features": R.addIndex(R.map)((waypoint, idx) => {
        const url = "https://nhvrappsprod.blob.core.windows.net/route-assets/m" + (idx + 1) + ".png";
        return {
          "geometry": {
            "x": waypoint.lng.value,
            "y": waypoint.lat.value,
            "spatialReference": {
              "wkid": 4326
            }
          },
          "attributes": {
            "id": "drawing"
          },
          "symbol": {
            "angle": 0,
            "xoffset": 0,
            "yoffset": 0,
            "type": "esriPMS",
            "url": url,
            "width": 23,
            "height": 30
          }
        };
      }, waypoints)
    }
  };
}

// function getPrintConditions(conditionsData) {
//   if (conditionsData.length === 0){
//     return null;
//   }
//   const conditions = R.filter(condition => !R.isNil(condition.attributes.Restrictions),conditionsData)
//   if (conditions.length > 0){
//     const restrictions = R.map(condition => {
//       return {
//         "RestrictionsType": condition.attributes.RestrictionType,
//         "Restrictions": condition.attributes.Restrictions
//       }
//     },conditions)
//     return restrictions
//   }
//   return null;
// }
//
// function getPrintResolution(_res) {
//   const res = R.defaultTo("low (96 dpi)", _res);
//   switch(res) {
//     case "high (300 dpi)":
//       return 300;
//     case "medium (150 dpi)":
//       return 150;
//     default:
//       return 96;
//   }
// }

function getSteps(routePath) {
  if (R.isNil(routePath) || routePath.length === 0) {
    return [];
  }
  let steps = [];
  R.forEach(
    (rPath) => {
      R.forEach(
        (paths) => {
          R.forEach(
            (path) => {
              steps.push([path[1], path[0]]);
            },
            paths
          );
        },
        rPath.geometry
      );
    },
    routePath
  );
  return steps;
}
