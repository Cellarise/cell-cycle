import {$} from '../globals';
import L from 'leaflet';
import R from 'ramda';
import {toNumber} from '../utils';
import {inVehicleHierarchyById} from './vehicleHelpers';
import {getCurrentAccountTypeAndId} from './authHelpers';
import {getActiveRecord} from "./recordUtils";

/**
 * Compares coord1 and coord2 truncated to decimalPlaces.
 * If decimalPlaces is not provided, coord1 and coord2 are compared.
 *
 * @param {Number} coord1 first coord to compare
 * @param {Number} coord2 second coord to compare
 * @param {Number} decimalPlaces number of decimal places to truncate coords. Defaults to 6.
 * @return {Boolean} true if the coords are equal; false otherwise
 */
export function coordsAreEqual(coord1, coord2, decimalPlaces = 6) {
  if (!coord1 || !coord2) {
    return false;
  }
  return decimalPlaces ?
    coord1.toFixed(decimalPlaces) === coord2.toFixed(decimalPlaces) :
    coord1 === coord2;
}

export function flattenGeometryLegacy(legacyData) {
  const permitApplicationRoute = {
    "routes": [
      {
        "RM_SEGMENTS": [
          {
            "RM CODE": "*Legacy*",
            "NA ANALYSIS": [
              {
                "SEGMENTS": "-1",
                "GEOMETRY": R.map(
                  path => (R.map(
                      coord => (mercatorCoordToLatLngArr(coord[0], coord[1])),
                      path)
                  ),
                  legacyData.geometry.paths
                )
              }
            ]
          }
        ]
      }
    ]
  };
  return flattenGeometryByRMID(permitApplicationRoute, [], {})
}

export function flattenGeometryByRMID(permitApplicationRoute, roadList, roadPartnerAccounts) {
  if (R.isNil(permitApplicationRoute) || R.isNil(permitApplicationRoute.routes) ||
    permitApplicationRoute.routes.length === 0) {
    return [];
  }
  return R.pipe(
    R.addIndex(R.map)(
      (routeData, routeIdx) => (flattenGeometryByRoute(routeData, roadList, roadPartnerAccounts, routeIdx))
    ),
    R.unnest
  )(permitApplicationRoute.routes);
}

function flattenGeometryByRoute(routeData, roadList, roadPartnerAccounts, routeIdx) {
  if (R.isNil(routeData) || R.isNil(routeData.RM_SEGMENTS) || R.isNil(roadPartnerAccounts)) {
    return [];
  }
  const routeColor = routeData.routeColor;
  roadList = R.defaultTo([], roadList);
  return R.map(
    (eachRoute) => {
      return flattenGeometry(roadList, roadPartnerAccounts, eachRoute, routeIdx, routeColor);
    },
    routeData.RM_SEGMENTS
  );
}

function flattenGeometry(roadList, roadPartnerAccounts, eachRoute, routeIdx, routeColor) {
  const naAnalysis = eachRoute["NA ANALYSIS"][0];
  let segmentId;
  if (!R.isNil(naAnalysis.KEY_SEGMENT)) {
    segmentId = toNumber(naAnalysis.KEY_SEGMENT);
  } else {
    segmentId = toNumber(R.split(",", naAnalysis.SEGMENTS + "")[0]);
  }
  let RMID = eachRoute["RM CODE"];
  //lookup matching road and check for change to RMID or approval type
  let matchingRoad = R.defaultTo({}, R.find(R.propEq("id", segmentId), roadList));
  if (!R.isNil(matchingRoad.RMID)) {
    RMID = matchingRoad.RMID;
  }
  const roadMgrDetail = R.defaultTo({}, roadPartnerAccounts[RMID]);
  return {
    "geometry": R.pipe(
      R.map((coordArrBatch) => (
        R.map(
          (coordArr) => ([coordArr[1], coordArr[0]]),
          coordArrBatch
        )
      ))
    )(naAnalysis.GEOMETRY),
    'RMID': RMID,
    'segmentId': segmentId,
    'routeIdx': routeIdx,
    'color': getColorForApprovalType(matchingRoad.approvalType, roadMgrDetail.color, routeColor)
  };
}

export function getColorForApprovalType(approvalType, requiresConsentColor, routeColor) {
  switch (approvalType) {
    case "Consent Granted":
    case "Excluded":
      return "Black";
    case "Under Notice":
      return "LightGrey";
    case "Pre-approved":
      return "DimGrey";
    default:
      if (routeColor) {
        return routeColor;
      }
      return R.defaultTo("red", requiresConsentColor);
  }
}

/**
 * Switches y,x coordinates (e.g. GeoJSON) to x,y coordinates (e.g. LatLng)
 *
 * @param {Array} coord coordinates to reverse
 * @return {Array} reversed coordinates
 */
export function reverseCoords(coord) {
  return [coord[1], coord[0]];
}

export function mercatorCoordToLatLng(x, y) {
  let lat, lng;
  if ($.isNumeric(x) && $.isNumeric(y)) {
    const point = new L.Point(x, y);
    const latlng = L.Projection.SphericalMercator.unproject(point);
    lat = latlng.lat;
    lng = latlng.lng;
  }
  return {
    'lat': lat,
    'lng': lng
  };
}
export function mercatorCoordToLatLngArr(x, y) {
  let lat, lng;
  if ($.isNumeric(x) && $.isNumeric(y)) {
    const point = new L.Point(x, y);
    const latlng = L.Projection.SphericalMercator.unproject(point);
    lat = latlng.lat;
    lng = latlng.lng;
  }
  return [lng, lat];
}

export function latLngToMercatorCoord(lat, lng) {
  let x, y;
  if ($.isNumeric(lat) && $.isNumeric(lng)) {
    const latlng = L.latLng(lat, lng);
    const coord = L.Projection.SphericalMercator.project(latlng);
    x = coord.x;
    y = coord.y;
  }
  return {
    'x': x,
    'y': y
  };
}

// From Route Planner directions.js
export function decompressGeometry(geometry) {
  var xDiffPrev = 0,
    yDiffPrev = 0,
    points = [],
    x, y, j,
    strings,
    coefficient;

  strings = geometry.match(/((\+|\-)[^\+\-]+)/g); //eslint-disable-line
  coefficient = parseInt(strings[0], 32);

  for (j = 1; j < strings.length; j += 2) {
    x = parseInt(strings[j], 32) + xDiffPrev;
    xDiffPrev = x;
    y = parseInt(strings[j + 1], 32) + yDiffPrev;
    yDiffPrev = y;
    points.push([x / coefficient, y / coefficient]);
  }

  return points;
}

export function onUpdateFilterLayersFromModel(model, action, drivers, origModel) {
  const record = getActiveRecord(model.getIn(["stores", action.storeId]));
  const origRecord = getActiveRecord(origModel.getIn(["stores", action.storeId]));
  if (
    record.getIn(['applicationType', 'value']) !== origRecord.getIn(['applicationType', 'value']) ||
    record.getIn(['applicationType', 'value']) !== origRecord.getIn(['applicationType', 'value']) ||
    record.getIn(['vehicleComponentSetTypeId', 'value']) !== origRecord.getIn(['vehicleComponentSetTypeId', 'value']) ||
    record.getIn(['width', 'value']) !== origRecord.getIn(['width', 'value']) ||
    record.getIn(['length', 'value']) !== origRecord.getIn(['length', 'value']) ||
    record.getIn(['height', 'value']) !== origRecord.getIn(['height', 'value']) ||
    record.getIn(['totalMass', 'value']) !== origRecord.getIn(['totalMass', 'value']) ||
    record.getIn(['freightType', 'value']) !== origRecord.getIn(['freightType', 'value']) ||
    record.getIn(['pbsLevel', 'value']) !== origRecord.getIn(['pbsLevel', 'value']) ||
    record.getIn(['mapState', 'value', 'showAllLayers', 'value']) !==
    origRecord.getIn(['mapState', 'value', 'showAllLayers', 'value'])
  ) {
    model = model.setIn(
      ["stores", action.storeId, "props", "GIS", "filteredLayers"],
      updateFilterLayersFromModel(model, record)
    );
    model = model.setIn(
      ["stores", action.storeId, "props", "GIS", "filteredLayersCounter"],
      model.getIn(["stores", action.storeId, "props", "GIS", "filteredLayersCounter"]) + 1
    );
  }
  return model;
}

export function updateFilterLayersFromModel(model, record) {
  const mapServices = model.getIn([
    "stores",
    "mapServiceUI",
    "collection",
    "records"
  ]);
  const networkLayers = model.getIn([
    "stores",
    "networkLayerUI",
    "collection",
    "records"
  ]);
  const vehicleComponentSetTypes = model.getIn([
    "stores",
    "vehicleComponentSetTypeUI",
    "collection",
    "records"
  ]);
  const accountType = getCurrentAccountTypeAndId(model).accountType;

  if (!mapServices || !networkLayers || !vehicleComponentSetTypes) {
    return [];
  }
  return filterLayers(mapServices, networkLayers, vehicleComponentSetTypes, accountType, record);
}

export function filterLayers(mapServices, networkLayers, vehicleComponentSetTypes, accountType, record) {
  let showAllLayers = record.getIn(['mapState', 'value', 'showAllLayers', 'value']) === true;

  let layers = showAllLayers ? networkLayers : networkLayers.filter(layer => {
    let criteriaMatch = [];

    if (!R.isNil(layer.vehicleComponentSetTypeId) &&
      !R.isNil(vehicleComponentSetTypes) &&
      !R.isNil(record.getIn(['vehicleComponentSetTypeId', 'value']))) {
      criteriaMatch.push(
        inVehicleHierarchyById(
          record.getIn(['vehicleComponentSetTypeId', 'value']),
          layer.vehicleComponentSetTypeId,
          vehicleComponentSetTypes
        )
      );
    } else {
      criteriaMatch.push(true);
    }

    if (!R.isNil(layer.applicationType)) {
      criteriaMatch.push(equalityCriteria(layer.applicationType, record.getIn(['applicationType', 'value'])));
    }

    criteriaMatch.push(lessThanOrEqualToCriteria(layer.length, record.getIn(['length', 'value'])));
    criteriaMatch.push(lessThanOrEqualToCriteria(layer.width, record.getIn(['width', 'value'])));
    criteriaMatch.push(lessThanOrEqualToCriteria(layer.height, record.getIn(['height', 'value'])));
    criteriaMatch.push(lessThanOrEqualToCriteria(layer.totalMass, record.getIn(['totalMass', 'value'])));

    criteriaMatch.push(
      layer.freightType && layer.freightType !== 'Not applicable' && record.getIn(['freightType', 'value'])
        ? record.getIn(['freightType', 'value']) === layer.freightType
        : true
    );

    criteriaMatch.push(equalityCriteria(layer.pbsLevel, record.getIn(['pbsLevel', 'value'])));

    const vehicleComponentId = record.getIn(['customerVehicleSetItem', 'value', '0', 'vehicleComponentId', 'value']);
    criteriaMatch.push(
      layer.spvVehicleComponentId && !R.isNil(vehicleComponentId)
        ? vehicleComponentId === layer.spvVehicleComponentId
        : R.isNil(layer.spvVehicleComponentId) || !R.isNil(vehicleComponentId)
    );

    return R.all(c => c === true, criteriaMatch);
  });
  let _networkLayers = record.getIn(['mapState', 'value', 'networkLayers', 'value']);
  _networkLayers = _networkLayers ? _networkLayers.toJS() : [];
  layers = R.map(layer => {
    const networkLayerIds = R.map(l => l.id.value, _networkLayers);
    return {
      'id': layer.id,
      'name': layer.name,
      'mapService': R.find(s => s.id === layer.mapServiceId, R.defaultTo([], mapServices)),
      'layerId': layer.layerId,
      'sortOrder': layer.sortOrder,
      "subLayerIds": layer.subLayerIds,
      'checked': R.isNil(networkLayerIds) ? false : R.contains(layer.id, networkLayerIds)
    };
  }, layers);
  //filter layers based on mapservice permissions
  layers = R.filter(
    (layer) => {
      if (R.isNil(layer.mapService)) {
        return false;
      }
      return hasPermission(layer.mapService.permission, accountType);
    },
    layers
  );
  // Remove any overlapping NetworkLayers by using a key of the name, map service and layer id.
  // If an admin has made a change to NetworkLayers, ensure semantically equivalent layers (based
  // on the key) are checked.
  layers = R.pipe(
    R.reduce((uniqueLayers, layer) => {
      const key = layer.name + layer.mapService.id + layer.layerId;
      uniqueLayers[key] = layer;
      return uniqueLayers;
    }, {}),
    R.values
  )(layers);
  // layers = R.values(layers.reduce((unique, layer) => {
  //   const key = layer.name + layer.mapService.id + layer.layerId;
  //   const otherLayer = unique[key];
  //   if (otherLayer && !otherLayer.checked && layer.checked) {
  //     otherLayer.checked = true;
  //   } else {
  //     unique[key] = layer;
  //   }
  //   return unique;
  // }, {}));
  return layers;
}

function equalityCriteria(rule, value) {
  return rule && value ? value === rule : true;
}

function lessThanOrEqualToCriteria(rule, value) {
  return rule && value ? value <= rule : true;
}

function hasPermission(permission, accountType) {
  if (R.isNil(permission)) {
    return true;
  }
  switch (permission) {
    case "Regulator Only":
      return accountType === "operations";
    case "Customer Only":
      return R.contains(accountType, ['operations', 'customer']);
    case "Single Road Manager Only":
      return R.contains(accountType, ['operations', 'partner']);
    case "Road Managers Only":
      return R.contains(accountType, ['operations', 'partner']);
    case "Customer - Single Road Manager Only":
      return true;
    case "Everyone":
    default:
      return true;
  }
}


