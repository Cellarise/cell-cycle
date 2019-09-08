"use strict";
const R = require('ramda');


// const ESRI_WEB_MERCATOR = 102100;
// const EPSG_WEB_MERCATOR = 3857;


function parseRoadManagerId(roadMgrCode) {
  if (R.isNil(roadMgrCode)) {
    return {
      "id": null,
      "primaryContactId": 1,
      "fileList": null,
      "RCN": null,
      "RMID": "R_NEW",
      "name": "R_NEW- NO RM CODE *NEW*",
      "roleType": null,
      "roleCategory": null,
      "state": "QLD"
    };
  }
  const prefix = R.slice(0, 2, roadMgrCode);
  if (prefix === "RM") {
    return {
      "id": null,
      "primaryContactId": 1,
      "fileList": null,
      "RCN": null,
      "RMID": roadMgrCode,
      "name": roadMgrCode + "- Road Authority *NEW*",
      "roleType": "State_Road_Agency",
      "roleCategory": "State or Territory",
      "state": "QLD"
    };
  }
  if (prefix === "PO") {
    return {
      "id": null,
      "primaryContactId": 1,
      "fileList": null,
      "RCN": null,
      "RMID": roadMgrCode,
      "name": roadMgrCode + "- Port Authority *NEW*",
      "roleType": "Port_Authority",
      "roleCategory": "Other",
      "state": "QLD"
    };
  }
  if (prefix === "TP") {
    const mid = R.slice(2, 2, roadMgrCode);
    return {
      "id": null,
      "primaryContactId": 1,
      "fileList": null,
      "RCN": null,
      "RMID": roadMgrCode,
      "name": roadMgrCode + "- Third Party *NEW*",
      "roleType": "Road_Owner",
      "roleCategory": "Third Party",
      "state": getState(mid)
    };
  }
  if (prefix === "IA") {
    const mid = R.slice(3, 2, roadMgrCode);
    return {
      "id": null,
      "primaryContactId": 1,
      "fileList": null,
      "RCN": null,
      "RMID": roadMgrCode,
      "name": roadMgrCode + "- Intelligent Access Program *NEW*",
      "roleType": "Other",
      "roleCategory": "Other",
      "state": getState(mid)
    };
  }
  if (prefix === "AI") {
    return {
      "id": null,
      "primaryContactId": 1,
      "fileList": null,
      "RCN": null,
      "RMID": roadMgrCode,
      "name": roadMgrCode + "- Airport *NEW*",
      "roleType": "Road_Owner",
      "roleCategory": "Other",
      "state": "QLD"
    };
  }
  return {
    "id": null,
    "primaryContactId": 1,
    "fileList": null,
    "RCN": null,
    "RMID": roadMgrCode,
    "name": roadMgrCode + "- Local Government *NEW*",
    "roleType": "LGA",
    "roleCategory": "Local Government",
    "state": getState(prefix)
  };
}

function getState(prefix) {
  switch (prefix) {
    case "VI":
      return "VIC";
    case "NS":
      return "NSW";
    case "QL":
      return "QLD";
    case "SA":
      return "SA";
    case "NT":
      return "NT";
    case "WA":
      return "WA";
    case "TA":
      return "TAS";
    default:
      return "QLD";
  }
}

function flattenGeometryByRMID(permitApplicationRoute) {
  if (R.isNil(permitApplicationRoute) ||
    !R.is(Array, permitApplicationRoute.routes) ||
    permitApplicationRoute.routes.length === 0) {
    return [];
  }
  return R.map(
    function eachRouteData(routeData) {
      return R.unnest(flattenGeometryByRoute(routeData));
    },
    permitApplicationRoute.routes
  );
}
function flattenGeometryByRoute(routeData) {
  if (R.isNil(routeData) ||
    !R.is(Array, routeData.RM_SEGMENTS) ||
    routeData.RM_SEGMENTS.length === 0) {
    return [];
  }
  return R.map(
    function eachEachRoute(eachRoute) {
      return R.unnest(flattenGeometry(eachRoute));
    },
    routeData.RM_SEGMENTS
  );
}
function flattenGeometry(eachRoute) {
  if (R.isNil(eachRoute) ||
    !R.is(Array, eachRoute["NA ANALYSIS"]) ||
    eachRoute["NA ANALYSIS"].length === 0 ||
    R.isNil(eachRoute["NA ANALYSIS"][0]) ||
    !R.is(Array, eachRoute["NA ANALYSIS"][0].GEOMETRY) ||
    eachRoute["NA ANALYSIS"][0].GEOMETRY.length === 0) {
    return [];
  }
  return R.map(
    function eachCoordArrBatch(coordArrBatch) {
      return R.map(
        function eachCoordArr(coordArr) {
          return [coordArr[0], coordArr[1]];
        },
        coordArrBatch
      );
    },
    eachRoute["NA ANALYSIS"][0].GEOMETRY
  );
}

module.exports = {
  "parseRoadManagerId": parseRoadManagerId,
  "flattenGeometryByRMID": flattenGeometryByRMID
};
