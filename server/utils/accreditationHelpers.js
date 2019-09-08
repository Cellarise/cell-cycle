"use strict";
const R = require('ramda');
const moment = require('moment');


function accreditationIsComplianceAuditReady(workflowState, expiryDate) {
  if (workflowState !== 62 || R.isNil(expiryDate)) {
    return false;
  }
  const differenceLeftByMonth = moment(expiryDate).diff(moment(new Date()), 'months');
  if (differenceLeftByMonth >= 9) {
    return false; //not within 9 month range for maintain
  }
  return true;
}

function accreditationNextAuditDate(entryDate, expiryDate, lastAuditDate) {
  if (R.isNil(entryDate) || R.isNil(expiryDate)) {
    return null;
  }
  // const period = accreditationPeriodCalculation(entryDate, expiryDate); //1 - 5 years
  const sixMonthFromEntryDate = moment(entryDate).add(6, "months").add(1, "day").toDate();
  // const threeMonthToExpiryDate = moment(expiryDate).subtract(3, "months").toDate();
  //initial compliance audit notification date
  if (R.isNil(lastAuditDate)) {
    //cannot exceed three Month To Expiry date - final maintain compliance audit notification
    // if (moment(sixMonthFromEntryDate).isAfter(moment(threeMonthToExpiryDate))) {
    //   return threeMonthToExpiryDate;
    // }
    if (moment(sixMonthFromEntryDate).isAfter(moment(expiryDate))) {
      return expiryDate;
    }
    return sixMonthFromEntryDate;
  }
  //final maintain compliance audit
  // if (moment(lastAuditDate).isSameOrAfter(moment(expiryDate))
  //   || moment(lastAuditDate).add(1, "day").isAfter(moment(expiryDate))) {
  //   return expiryDate;
  // }
  // return threeMonthToExpiryDate;
  return expiryDate;
}

function getAccreditationNumber(accreditation, accreditationId) {
  if (R.isNil(accreditation)) {
    return accreditationId;
  }
  return R.defaultTo(accreditation.id, accreditation.accreditationNumber);
}

function getAccreditationNotificationHeading(application, stage) {
  var stageText = "";
  if (R.isNil(application) || R.isNil(application.applicationClass) || R.isNil(application.applicationType)) {
    return "";
  }
  if (!R.contains(application.applicationClass, [
    "Compliance Audit", "Establish Accreditation", "Maintain Accreditation"
  ])) {
    return application.applicationType;
  }
  if (stage === "reminder") {
    stageText = " Reminder";
  } else if (stage === "overdue") {
    stageText = " Overdue";
  }
  return "NHVAS - " + application.applicationType + stageText + " Notice";
}

function getAccreditationModulesAndExpiryHTMLTable(applicationModel) {
  var table, accreditation;
  if (R.isNil(applicationModel) || R.isNil(applicationModel.accreditation)) {
    return "";
  }
  accreditation = applicationModel.accreditation;
  table = '<table width="500" border="0" cellspacing="0" cellpadding="0" bgcolor="#ffffff">'
    + '<tr><td><p><strong>Module</strong></p></td><td><p><strong>Expiry</strong></p></td></tr>';
  if (applicationModel.moduleMass === true) {
    table = table + '<tr>' +
      '<td><p>Mass Management</p></td>' +
      '<td><p>' + moment(R.defaultTo(new Date(), accreditation.accreditationMassExpiry)).format("DD/MM/YYYY") +
      '</p></td>' +
      '</tr>';
  }
  if (applicationModel.moduleMaintenance === true) {
    table = table + '<tr>' +
      '<td><p>Maintenance Management</p></td>' +
      '<td><p>' + moment(R.defaultTo(new Date(), accreditation.accreditationMaintenanceExpiry)).format("DD/MM/YYYY") +
      '</p></td>' +
      '</tr>';
  }
  if (applicationModel.moduleBFM === true) {
    table = table + '<tr>' +
      '<td><p>Basic Fatigue Management</p></td>' +
      '<td><p>' + moment(R.defaultTo(new Date(), accreditation.accreditationBFMExpiry)).format("DD/MM/YYYY") +
      '</p></td>' +
      '</tr>';
  }
  if (applicationModel.moduleAFM === true) {
    table = table + '<tr>' +
      '<td><p>Advanced Fatigue Management</p></td>' +
      '<td><p>' + moment(R.defaultTo(new Date(), accreditation.accreditationAFMExpiry)).format("DD/MM/YYYY") +
      '</p></td>' +
      '</tr>';
  }
  table = table
    + '</table>';
  return table;
}

function isRemovingAllModules(accreditationRecord, record) {
  if (R.isNil(record) || !record.removeModule) {
    return false;
  }
  const hasModules = R.any((module) => module, [
      accreditationRecord.moduleMass === true && record.moduleMassRemove !== true,
      accreditationRecord.moduleMaintenance === true && record.moduleMaintenanceRemove !== true,
      accreditationRecord.moduleBFM === true && record.moduleBFMRemove !== true,
      accreditationRecord.moduleAFM === true && record.moduleAFMRemove !== true
    ]
  );
  return !hasModules;
}

module.exports = {
  "accreditationIsComplianceAuditReady": accreditationIsComplianceAuditReady,
  "accreditationNextAuditDate": accreditationNextAuditDate,
  "getAccreditationNumber": getAccreditationNumber,
  "getAccreditationModulesAndExpiryHTMLTable": getAccreditationModulesAndExpiryHTMLTable,
  "getAccreditationNotificationHeading": getAccreditationNotificationHeading,
  "isRemovingAllModules": isRemovingAllModules
};
