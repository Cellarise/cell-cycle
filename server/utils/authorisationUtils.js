"use strict";
const R = require('ramda');

function isRoadAuthority(accountId) {
  return R.contains(accountId, [3, 4, 190, 220, 378, 478]);
}

function getServiceRoleName(service) {
  const serviceId = R.defaultTo("", service);
  if (serviceId.indexOf("vehicleStandard") > -1) {
    return "Vehicle";
  }
  if (serviceId.indexOf("accreditation") > -1) {
    return "Accreditation";
  }
  if (serviceId.indexOf("permit") > -1) {
    return "Access";
  }
  return "";
}

module.exports = {
  "isRoadAuthority": isRoadAuthority,
  "getServiceRoleName": getServiceRoleName
};
