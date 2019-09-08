"use strict";
const R = require('ramda');


module.exports = function getRoadList(roadMgrCodes, partnerAccounts, mergedRmSegments, alt) {
  return R.reduce(
    function eachSegment(accRoadSegments, segment) {
      if (R.isNil(segment) ||
        !R.is(Array, segment["NA ANALYSIS"]) ||
        segment["NA ANALYSIS"].length === 0) {
        return accRoadSegments;
      }
      if (R.isNil(segment["RM CODE"]) || R.isNil(partnerAccounts[segment["RM CODE"]])) {
        return accRoadSegments;
      }
      const naAnalysis = segment["NA ANALYSIS"][0];
      const partnerAccountId = partnerAccounts[segment["RM CODE"]].id;
      let roadObj = {
        "id": segment.SID,
        "partnerAccountId": partnerAccountId,
        "RMID": segment["RM CODE"],
        "name": naAnalysis.STREETNAME,
        "currentRouteIndex": segment.currentRouteIndex
      };
      if (R.isNil(roadObj.name) || roadObj.name === "") {
        roadObj.name = "Unknown Road, UNKNOWN SUBURB";
      }
      if (R.slice(0, 1, roadObj.name) === ",") {
        roadObj.name = "Unknown Road" + roadObj.name;
      }
      if (alt === true && !R.isNil(segment.approvalType)) {
        roadObj.approvalType = segment.approvalType;
      }
      if (!R.isNil(segment.alias)) {
        roadObj.alias = segment.alias;
      }
      if (!R.isNil(segment.code)) {
        roadObj.code = segment.code;
      }
      if (!R.isNil(segment.notes)) {
        roadObj.notes = segment.notes;
      }
      if (!R.isNil(segment.nameChange)) {
        roadObj.nameChange = segment.nameChange;
      }
      if (!R.isNil(segment.currentRouteIndex)) {
        roadObj.currentRouteIndex = segment.currentRouteIndex;
      }
      accRoadSegments.push(roadObj);
      return accRoadSegments;
    },
    [],
    mergedRmSegments
  );
};
