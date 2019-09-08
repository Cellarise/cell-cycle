"use strict";
const R = require('ramda');
const toNumber = require('../utils').toNumber;


module.exports = function parseRMSegments(RM_SEGMENTS, currentRouteIndex) {
  return R.reduce(
    function eachSegment(accSegments, segment) {
      const rmCode = R.defaultTo("", segment['RM CODE']);
      let rmCodes = R.split("|", rmCode);
      if (R.isNil(segment["NA ANALYSIS"]) ||
        !R.is(Array, segment["NA ANALYSIS"]) ||
        segment["NA ANALYSIS"].length === 0) {
        return accSegments;
      }
      let naAnalysis = segment["NA ANALYSIS"][0];
      //get the key segment id
      let segmentId;
      if (!R.isNil(naAnalysis.KEY_SEGMENT)) {
        segmentId = toNumber(naAnalysis.KEY_SEGMENT);
      } else {
        segmentId = toNumber(R.split(",", naAnalysis.SEGMENTS + "")[0]);
      }
      let updatedSegment = segment;
      updatedSegment.currentRouteIndex = currentRouteIndex;
      updatedSegment.SID = segmentId;
      updatedSegment['RM CODE'] = rmCodes[0];
      accSegments.push(updatedSegment);
      // let duplicateSegment;
      //only one additional road manager added due to uncertainty on using hack on adding
      //1 billion to segment id to create unique alternate id
      // if (rmCodes.length > 1) {
      //   duplicateSegment = R.clone(updatedSegment);
      //   duplicateSegment.SID = segmentId < 1147480000 ? segmentId + 1000000000 : segmentId + 1;
      //   duplicateSegment['RM CODE'] = rmCodes[1];
      //   accSegments.push(duplicateSegment);
      // }
      return accSegments;
    },
    [],
    R.defaultTo([], RM_SEGMENTS)
  );
};
