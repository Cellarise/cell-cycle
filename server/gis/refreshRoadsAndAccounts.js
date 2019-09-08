"use strict";
const R = require('ramda');
const async = require('async');
const parseRMSegments = require('./parseRMSegments');
const getRoadList = require('./getRoadList');
const getRoadColorName = require('../utils/colorUtils').getRoadColorName;
const parseRoadManagerId = require('../utils/gisUtils').parseRoadManagerId;


function getError(message) {
  return {
    "name": "InternalServerError",
    "status": 500,
    "message": message,
    "statusCode": 500,
    "details": {
      "context": "RoutePlannerService",
      "messages": message
    }
  };
}

//newList = update roads from redis
// IF result=single route 'new getRMIDRoute' THEN parse roads
//alt = keep approval type on road if available
module.exports = function refreshRoadsAndAccounts(RoutePlannerService, redisRoadSegments,
                                                  result, areaPartnerAccountId, forceParse, newList, alt, cb) {
  if (R.isNil(result)) {
    cb(getError("Route not found"));
    return;
  }
  let rmSegments = result.RM_SEGMENTS;

  if (R.is(Array, result.routes)) {
    if (result.routes.length === 0) {
      result.routes = null; //guard against routes with empty array
      rmSegments = null;
    } else if (forceParse === true ||
      !R.isNil(result.routes[0].RM_SEGMENTS) && result.routes[0].RM_SEGMENTS.length > 0 &&
      !R.isNil(result.routes[0].RM_SEGMENTS[0]) && R.isNil(result.routes[0].RM_SEGMENTS[0].SID)) {
      //For loading alternative routes - ensure currentRouteIndex set
      //check for SID - should be set already by original parse
      rmSegments = R.pipe(
        R.addIndex(R.map)(
          function eachRoute(route, currentRouteIndex) {
            return parseRMSegments(route.RM_SEGMENTS, currentRouteIndex);
          }
        ),
        R.unnest
      )(result.routes);
    } else {
      rmSegments = R.pipe(
        R.addIndex(R.map)(
          function eachRoute(route, currentRouteIndex) {
            return R.map(R.assoc("currentRouteIndex", currentRouteIndex), R.defaultTo([], route.RM_SEGMENTS));
          }
        ),
        R.unnest
      )(result.routes);
    }
  } else if (newList) {
    //For getRMID route parse the RM segments
    result.RM_SEGMENTS = parseRMSegments(result.RM_SEGMENTS, 0);
    rmSegments = result.RM_SEGMENTS;
  }

  if (R.isNil(rmSegments)) {
    cb(null, result);
    return;
  }

  async.waterfall([
      function loadFromRedisRoadList(callback) {
        let _segmentsByRoadMgr = {}, _roadMgrCodes = [];
        if (newList !== true) {
          _segmentsByRoadMgr = R.groupBy(R.prop('RM CODE'), rmSegments);
          _roadMgrCodes = R.keys(_segmentsByRoadMgr);
          process.nextTick(function nextTickCb() {
            callback(null, _roadMgrCodes, rmSegments);
          });
          return;
        }
        //merge redis road list only for new getRMIDRoute requests
        redisRoadSegments.mergeAll(
          rmSegments,
          function redisCb(err, mergedRmSegments) {
            if (err) {
              callback(err);
              return;
            }
            //format response//get partners
            _segmentsByRoadMgr = R.groupBy(R.prop('RM CODE'), mergedRmSegments);
            _roadMgrCodes = R.keys(_segmentsByRoadMgr);
            callback(null, _roadMgrCodes, mergedRmSegments);
            return;
          }
        );
      },
      function findExistingPartnerAccounts(roadMgrCodes, mergedRmSegments, callback) {
        let whereObj = {
          "RMID": {"inq": roadMgrCodes}
        };
        if (!R.isNil(areaPartnerAccountId)) {
          whereObj = {
            "or": [
              {"RMID": {"inq": roadMgrCodes}},
              {"id": areaPartnerAccountId}
            ]
          };
        }
        RoutePlannerService.app.models.PartnerAccount.find({
            "where": whereObj,
            "fields": [
              "id", "primaryContactId", "fileList", "RCN", "RMID", "name",
              "roleType", "roleCategory", "state", "color"
            ]
          },
          function rpcCb(err, _partnerAccounts) {
            if (err) {
              callback(err);
              return;
            }
            callback(null, roadMgrCodes, mergedRmSegments, _partnerAccounts);
            return;
          }
        );
      },
      function createNewPartnerAccounts(roadMgrCodes, mergedRmSegments, _partnerAccounts, callback) {
        let partnerAccounts = R.map(
          function eachPartner(partnerAccount) {
            return R.has('__data', partnerAccount) ? partnerAccount.__data : partnerAccount;
          },
          R.defaultTo([], _partnerAccounts)
        );
        //find new partner accounts
        const existingPartnerAccounts = R.reduce(
          function eachRMCode(accPartnerAccounts, roadMgrCode) {
            const partnerAccount = R.find(R.propEq('RMID', roadMgrCode), partnerAccounts);
            if (!R.isNil(partnerAccount)) {
              accPartnerAccounts[roadMgrCode] = partnerAccount;
            }
            return accPartnerAccounts;
          },
          {},
          R.defaultTo([], roadMgrCodes)
        );
        let newPartnerAccounts = R.reduce(
          function eachRMCode(accPartnerAccounts, roadMgrCode) {
            if (R.isNil(existingPartnerAccounts[roadMgrCode])) {
              accPartnerAccounts[roadMgrCode] = parseRoadManagerId(roadMgrCode);
            }
            return accPartnerAccounts;
          },
          {},
          R.defaultTo([], roadMgrCodes)
        );
        const newRoadMgrCodes = R.keys(newPartnerAccounts);

        //return if no missing partner accounts
        if (newRoadMgrCodes.length === 0) {
          process.nextTick(function nextTickCb() {
            callback(null, roadMgrCodes, mergedRmSegments, existingPartnerAccounts, partnerAccounts);
          });
          return;
        }

        //create missing accounts
        async.map(
          newRoadMgrCodes,
          function createPartnerAccount(newRoadMgrCode, mapCallback) {
            delete newPartnerAccounts[newRoadMgrCode].id;
            RoutePlannerService.app.models.PartnerAccount.create(
              R.merge(
                {
                  "termsAgreed": true,
                  "entityTypeBasic": "Non-individual",
                  "registeredLine1": "ADDRESS",
                  "registeredLocality": "LOCALITY",
                  "registeredState": newPartnerAccounts[newRoadMgrCode].state,
                  "registeredPostalCode": "0000",
                  "postalLine1": "ADDRESS",
                  "postalLocality": "LOCALITY",
                  "postalState": newPartnerAccounts[newRoadMgrCode].state,
                  "postalPostalCode": "0000",
                  "billingLine1": "ADDRESS",
                  "billingLocality": "LOCALITY",
                  "billingState": newPartnerAccounts[newRoadMgrCode].state,
                  "billingPostalCode": "0000",
                  "billingPhone1": "0700000000",
                  "billingEmail": "system@nhvr.gov.au",
                  "billingName": "NAME",
                  "noABN": true
                },
                newPartnerAccounts[newRoadMgrCode]
              ),
              mapCallback
            );
          },
          function end(err, _createdPartnerAccounts) {
            if (err) {
              callback(err);
              return;
            }
            let createdPartnerAccounts = R.map(
              function eachPartner(partnerAccount) {
                return R.has('__data', partnerAccount) ? partnerAccount.__data : partnerAccount;
              },
              R.defaultTo([], _createdPartnerAccounts)
            );
            //add id
            newPartnerAccounts = R.reduce(
              function eachRMCode(accPartnerAccounts, roadMgrCode) {
                const partnerAccount = R.find(R.propEq('RMID', roadMgrCode), createdPartnerAccounts);
                if (!R.isNil(partnerAccount)) {
                  accPartnerAccounts[roadMgrCode].id = partnerAccount.id;
                }
                return accPartnerAccounts;
              },
              newPartnerAccounts,
              newRoadMgrCodes
            );
            callback(
              null,
              roadMgrCodes,
              mergedRmSegments,
              R.merge(existingPartnerAccounts, newPartnerAccounts),
              R.concat(partnerAccounts, createdPartnerAccounts)
            );
          }
        );
        return;
      },
      function consolidatePartnerAccountsFn(roadMgrCodes, mergedRmSegments,
                                            consolidatedPartnerAccounts, partnerAccounts, callback) {
        result.PARTNER_ACCOUNTS = R.addIndex(R.reduce)(
          function eachRMCode(accPartnerAccounts, roadMgrCode, index) {
            accPartnerAccounts[roadMgrCode].color = R.defaultTo(
              getRoadColorName(index + 1), //add 1 to ensure no duplication with areaPartnerAccountId
              accPartnerAccounts[roadMgrCode].color
            );
            return accPartnerAccounts;
          },
          consolidatedPartnerAccounts,
          roadMgrCodes
        );
        //
        if (!R.isNil(areaPartnerAccountId)) {
          const areaPartnerAccount = R.merge(
            parseRoadManagerId(null),
            R.defaultTo({}, R.find(R.propEq('id', areaPartnerAccountId), partnerAccounts))
          );
          result.PARTNER_ACCOUNTS[areaPartnerAccount.RMID] = areaPartnerAccount;
          if (R.isNil(result.PARTNER_ACCOUNTS[areaPartnerAccount.RMID].color)) {
            result.PARTNER_ACCOUNTS[areaPartnerAccount.RMID].color = getRoadColorName(0);
          }
        }
        //get road list
        result.ROAD_LIST = getRoadList(roadMgrCodes, result.PARTNER_ACCOUNTS, mergedRmSegments, alt);

        callback(null, result);
        return;
      }
    ],
    cb
  );
};
