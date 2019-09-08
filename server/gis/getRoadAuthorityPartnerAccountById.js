"use strict";
const R = require('ramda');
const getStateColors = require('cell-cycle/server/utils/colorUtils').getStateColors;


module.exports = function getRoadAuthorityPartnerAccountIdAndRMID(state) {
  switch (R.defaultTo("", state)) {
    case 3:
      return {
        "id": 3,
        "fileList": null,
        "RCN": 10000236,
        "RMID": "RMACT1",
        "color": getStateColors.ACT,
        "name": "Territory and Municipal Services Directorate",
        "roleType": "State_Road_Agency",
        "roleCategory": "State or Territory",
        "state": "ACT"
      };
    case 4:
      return {
        "id": 4,
        "fileList": null,
        "RCN": 10000238,
        "RMID": "RMNSW1",
        "color": getStateColors.NSW,
        "name": "Roads and Maritime Services",
        "roleType": "State_Road_Agency",
        "roleCategory": "State or Territory",
        "state": "NSW"
      };
    case 190:
      return {
        "id": 190,
        "fileList": null,
        "RCN": 10000190,
        "RMID": "RMTAS1",
        "color": getStateColors.TAS,
        "name": "Department of State Growth",
        "roleType": "State_Road_Agency",
        "roleCategory": "State or Territory",
        "state": "TAS"
      };
    case 220:
      return {
        "id": 220,
        "fileList": null,
        "RCN": 10000220,
        "RMID": "RMQLD1",
        "color": getStateColors.QLD,
        "name": "Transport and Main Roads - Brisbane Office",
        "roleType": "State_Road_Agency",
        "roleCategory": "State or Territory",
        "state": "QLD"
      };
    case 378:
      return {
        "id": 378,
        "fileList": null,
        "RCN": 10000378,
        "RMID": "RMVIC9",
        "name": "VicRoads",
        "color": getStateColors.VIC,
        "roleType": "State_Road_Agency",
        "roleCategory": "State or Territory",
        "state": "VIC"
      };
    case 478:
      return {
        "id": 478,
        "fileList": null,
        "RCN": 10000478,
        "RMID": "RMSA1",
        "color": getStateColors.SA,
        "name": "Department of Planning, Transport and Infrastructure (DPTI)",
        "roleType": "State_Road_Agency",
        "roleCategory": "State or Territory",
        "state": "SA"
      };
    default:
      return {
        "id": 0,
        "fileList": null,
        "RCN": 10000000,
        "RMID": "RM",
        "color": "Red",
        "name": "",
        "roleType": "State_Road_Agency",
        "roleCategory": "State or Territory",
        "state": "--NA--"
      };
  }
};
