"use strict";
const R = require('ramda');
const getRoadAuthorityPartnerAccountIdAndRMID = require('./getRoadAuthorityPartnerAccountIdAndRMID');


module.exports = function updateMergeRoadList(isAreaRouteType, areaPartnerAccount, currentRouteIndex, currentRoadList,
                                              ROAD_LIST, filterOnCurrentRouteIndex, altRoute) {

  var roadAuthorityPartnerAccount, areaPartnerAccountIds = [], excludedCurrentRoadList, newRoadList;

  if (isAreaRouteType && filterOnCurrentRouteIndex) {
    excludedCurrentRoadList = R.filter(
      function eachRoad(road) {
        return !R.propEq('currentRouteIndex', currentRouteIndex, road);
      },
      currentRoadList
    );
  } else {
    //effectively reset entire road list (nothing excluded)
    excludedCurrentRoadList = [];
  }
  if (isAreaRouteType && !R.isNil(areaPartnerAccount)) {
    areaPartnerAccountIds.push(areaPartnerAccount.id);
    //get road authority
    roadAuthorityPartnerAccount = getRoadAuthorityPartnerAccountIdAndRMID(areaPartnerAccount.state);
    areaPartnerAccountIds.push(roadAuthorityPartnerAccount.id);
  }

  newRoadList = R.reduce(
    function eachRoad(accNewRoadList, newRoad) {
      var updatedNewRoad;
      const currentRoadMatch = R.find(R.propEq('id', newRoad.id), currentRoadList);
      if (!R.isNil(currentRoadMatch)) {
        //check if currentRoadMatch.currentRouteIndex !== currentRouteIndex - do not allow
        if (filterOnCurrentRouteIndex && currentRoadMatch.currentRouteIndex !== currentRouteIndex) {
          return accNewRoadList;
        }
        updatedNewRoad = R.merge(newRoad, currentRoadMatch);
        updatedNewRoad.partnerAccountId = newRoad.partnerAccountId;
        updatedNewRoad.RMID = newRoad.RMID;
        updatedNewRoad.name = newRoad.name;
        updatedNewRoad.nameChange = R.defaultTo(updatedNewRoad.nameChange, newRoad.nameChange);
        updatedNewRoad.alias = R.defaultTo(updatedNewRoad.alias, newRoad.alias);
        updatedNewRoad.code = R.defaultTo(updatedNewRoad.code, newRoad.code);
        updatedNewRoad.notes = R.defaultTo(updatedNewRoad.notes, newRoad.notes);
        if (!filterOnCurrentRouteIndex) {
          updatedNewRoad = R.assoc("currentRouteIndex", newRoad.currentRouteIndex, updatedNewRoad);
        } else {
          //make sure all new roads have correct currentRouteIndex set
          updatedNewRoad.currentRouteIndex = currentRouteIndex;
        }
        if (altRoute === true) {
          updatedNewRoad.approvalType = R.defaultTo(updatedNewRoad.approvalType, newRoad.approvalType);
        }
        //If current road is marked for Removal then it must have been submitted at previous consent generation
        //As this road is now back in road list it should be marked as Submitted
        if (currentRoadMatch.status === "Remove") {
          updatedNewRoad.status = "Submitted";
        }
      } else {
        updatedNewRoad = R.merge({
          // Properties provided by getRouteRMID service
          // "id": toNumber(R.split(",", naAnalysis.SEGMENTS)[0]),
          // "partnerAccountId": partnerAccountId,
          // "RMID": roadMgrCode,
          // "name": naAnalysis.STREETNAME,
          // "nameChange": ...,
          // "code": ...,
          // "alias": ...,
          // "notes": ...,
          "approvalType": "Requires Consent",
          "approved": null,
          "approvalConditions": null,
          "refused": null,
          "refusalReason": null,
          "decisionActivityId": null,
          "decisionDate": null,
          "status": "Add",
          "modified": null,
          "modifiedBy": null,
          "currentRouteIndex": currentRouteIndex
        }, newRoad);
        if (filterOnCurrentRouteIndex) {
          //make sure all new roads have correct currentRouteIndex set
          updatedNewRoad.currentRouteIndex = currentRouteIndex;
        }
      }
      //mark all non areaPartnerAccount OR roadAuthorityPartnerAccount roads as Excluded
      if (isAreaRouteType && altRoute !== true) {
        if (!R.contains(updatedNewRoad.partnerAccountId, areaPartnerAccountIds)) {
          updatedNewRoad.approvalType = "Excluded";
        } else if (updatedNewRoad.approvalType === "Excluded") {
          updatedNewRoad.approvalType = "Requires Consent";
        }
      } else if (!isAreaRouteType && updatedNewRoad.approvalType === "Excluded") {
        updatedNewRoad.approvalType = "Requires Consent";
      }
      accNewRoadList.push(updatedNewRoad);
      return accNewRoadList;
    },
    [],
    R.defaultTo([], ROAD_LIST)
  );
  //ensure unique roadlist
  newRoadList = R.uniqBy(R.prop('id'), newRoadList);
  //get roads to be removed i.e. submitted roads in current road list that are not in the new road list
  const currentRoadListSubmitted = R.filter(
    function eachRoad(road) {
      if (filterOnCurrentRouteIndex) {
        return R.propEq('status', 'Submitted', road) && R.propEq('currentRouteIndex', currentRouteIndex, road);
      }
      return R.propEq('status', 'Submitted', road);
    },
    currentRoadList
  );
  const roadsForRemoval = R.differenceWith(R.eqBy(R.prop('id')), currentRoadListSubmitted, newRoadList);
  const roadsMarkedForRemoval = R.map(R.assoc('status', 'Remove'), roadsForRemoval);

  //add _idx because Javascript sort is unstable - i.e. can change order of items with equal comparison
  const unsortedRoadList = R.addIndex(R.map)(
    function eachRoad(item, idx) {
      return R.assoc("_idx", idx, item);
    },
    R.concat(excludedCurrentRoadList, R.concat(roadsMarkedForRemoval, newRoadList))
  );
  return R.sort(
    function eachRoad(roadA, roadB) {
      if (roadA.currentRouteIndex !== roadB.currentRouteIndex) {
        return roadA.currentRouteIndex - roadB.currentRouteIndex;
      }
      return roadA._idx - roadB._idx;
    },
    unsortedRoadList
  );
};
