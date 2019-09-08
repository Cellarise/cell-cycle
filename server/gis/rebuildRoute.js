"use strict";
const R = require('ramda');
const refreshRoadsAndAccounts = require('./refreshRoadsAndAccounts');
const updateMergeRoadList = require('./updateMergeRoadList');


module.exports = function rebuildRoute(RoutePlannerService,
                                       redisRoadSegments,
                                       _permitApplicationRoute,
                                       _road,
                                       areaPartnerAccountId,
                                       mergeRedis,
                                       merge,
                                       next) {
  if (R.isNil(_permitApplicationRoute)
    || !R.is(Array, _permitApplicationRoute.routes) || _permitApplicationRoute.routes.length === 0) {
    next({
      "permitApplicationRoute": _permitApplicationRoute,
      "road": _road
    });
    return;
  }
  let permitApplicationRoute = _permitApplicationRoute;
  permitApplicationRoute.routes = R.filter(
    function eachRouteSet(routeSet) {
      if (R.isNil(routeSet)
        || !R.is(Array, routeSet.RM_SEGMENTS) || routeSet.RM_SEGMENTS.length === 0
        || !R.is(Array, routeSet.Stops) || routeSet.Stops.length < 2
        || !R.is(Array, routeSet.Stops[0]) || routeSet.Stops[0].length < 2
        || !R.is(Array, routeSet.Stops[1]) || routeSet.Stops[1].length < 2
      ) {
        return false;
      }
      return true;
    },
    _permitApplicationRoute.routes
  );
  const roadList = R.defaultTo([], _road);
  //build up road list from permitApplicationRoute
  refreshRoadsAndAccounts(
    RoutePlannerService,
    redisRoadSegments,
    permitApplicationRoute,
    areaPartnerAccountId,
    true, //force parse rmsegments-road list
    true, //new road list
    false,
    function getPartnerAndRoadsCb(err, result) {
      if (err) {
        next(err);
        return;
      }
      const cleanRoadList = result.ROAD_LIST;
      const mergedRoadList = R.pipe(R.reduce(
        function eachCleanRoad(mergingRoadList, cleanRoad) {
          let segmentSetSID = cleanRoad.id;
          let currentRouteIndex = cleanRoad.currentRouteIndex;
          let matchingRoads = R.filter(
            function eachRoad(road) {
              if (R.isNil(road)) {
                return false;
              }
              if (road.id === segmentSetSID) {
                return true;
              }
              if (road.origId === segmentSetSID) {
                return true;
              }
              return false;
            },
            roadList
          );
          if (matchingRoads.length === 0) {
            mergingRoadList.push(cleanRoad);
            return mergingRoadList;
          }
          R.forEach(
            function eachMatchingRoad(matchRoad) {
              let mergedRoad = matchRoad;
              matchRoad.currentRouteIndex = currentRouteIndex;
              if (mergeRedis === true) {
                //overwrite road name
                mergingRoadList.push(R.merge(cleanRoad, matchRoad));
              } else {
                mergingRoadList.push(mergedRoad);
              }
            },
            matchingRoads
          );
          return mergingRoadList;
        },
        []),
        R.addIndex(R.map)(
          function eachRoad(road, idx) {
            road._idx = idx;
            return road;
          }
        )
      )(R.defaultTo([], cleanRoadList));
      permitApplicationRoute.PERMIT_ROAD_LIST = _road;
      permitApplicationRoute.ROAD_LIST = mergedRoadList;
      permitApplicationRoute.areaPartnerAccountId = areaPartnerAccountId;
      let areaPartnerAccount;
      if (!R.isNil(areaPartnerAccountId) && !R.isNil(permitApplicationRoute.PARTNER_ACCOUNTS)) {
        areaPartnerAccount = R.find(
          function eachPartnerAccount(partnerAccount) {
            return !R.isNil(partnerAccount) && partnerAccount.id === areaPartnerAccountId;
          },
          permitApplicationRoute.PARTNER_ACCOUNTS
        );
      }
      if (merge === true) {
        //updateMergeRoadList(isAreaRouteType, areaPartnerAccount, currentRouteIndex, currentRoadList,
        //                    ROAD_LIST, filterOnCurrentRouteIndex, altRoute)
        permitApplicationRoute.ROAD_LIST = updateMergeRoadList(
          !R.isNil(areaPartnerAccount), areaPartnerAccount, 0, _road, mergedRoadList, false, true
        );
      } else {
        permitApplicationRoute.__REBUILD = true;
      }
      next(null, permitApplicationRoute);
      return;
    }
  );
};
