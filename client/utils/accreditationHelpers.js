import R from "ramda";
import moment from "moment";
import React from "react";
import {toFixed} from './numberHelpers';


export function accreditationPeriodCalculation(entryDate, expiryDate) {
  if (R.isNil(entryDate) || R.isNil(expiryDate)) {
    return null;
  }
  let diff = moment(expiryDate).diff(moment(entryDate), 'years', true);
  diff = toFixed(diff, 0);
  return diff === 0 ? 1 : diff;
}

export function accreditationShouldBeSuspended(expiryDate) {
  if (R.isNil(expiryDate)) {
    return false;
  }
  return moment(expiryDate).diff(moment(new Date()), 'months') < -1;
}

export function getCalculatedExpiryStatusLabel(workflowState, expiryDate, workflowRecords) {
  const currentStateConfig = getCalculatedExpiryStatusObj(workflowState, expiryDate, workflowRecords);
  if (R.isNil(currentStateConfig)) {
    return null;
  }
  if (currentStateConfig.id === 60) {
    return <span>-</span>;
  }
  return <span className={"label label-" + currentStateConfig.style}>{currentStateConfig.name}</span>;
}

export function getCalculatedExpiryStatus(workflowState, expiryDate, workflowRecords) {
  const currentStateConfig = getCalculatedExpiryStatusObj(workflowState, expiryDate, workflowRecords);
  if (R.isNil(currentStateConfig)) {
    return "";
  }
  return currentStateConfig.name;
}

function getCalculatedExpiryStatusObj(workflowState, expiryDate, workflowRecords) {
  let currentStateConfig = !R.isNil(workflowRecords) && workflowRecords.length >= workflowState
    ? workflowRecords[workflowState - 1]
    : null;
  if (R.isNil(currentStateConfig)) {
    return null;
  }
  if (!R.isNil(expiryDate) && workflowState === 62) {
    const differenceLeftByMonth = moment(expiryDate).diff(moment(new Date()), 'months');
    const differenceDate = moment(expiryDate).diff(moment(new Date()), 'hours');
    if (differenceLeftByMonth < 3) {
      currentStateConfig = R.clone(currentStateConfig);
      currentStateConfig.name = "Expires soon";
      currentStateConfig.style = "warning";
    }
    if (differenceDate < 0) {
      currentStateConfig = workflowRecords[67 - 1];//Expired
    }
    if (differenceLeftByMonth < -1) {
      currentStateConfig = R.clone(currentStateConfig);
      currentStateConfig.name = "Suspended";
      currentStateConfig.style = "danger";
    }
  }
  return currentStateConfig;
}

export function accreditationCurrent(workflowState, expiryDate) {
  if (workflowState !== 62 || R.isNil(expiryDate)) {
    return false;
  }
  const differenceDate = moment(expiryDate).diff(moment(new Date()), 'hours');
  if (differenceDate < 0) {
    //"Expired"
    return false;
  }
  return true;
}

export function accreditationIsAddeable(workflowState, expiryDate, moduleStatus) {
  if (moduleStatus !== true || R.isNil(expiryDate)) {
    return true;
  }
  const differenceLeftByMonth = moment(expiryDate).diff(moment(new Date()), 'months');
  if (workflowState === 62 && differenceLeftByMonth < -1) {
    return true; //suspended can request add
  }
  if (workflowState === 62) {
    return false;
  }
  return true;
}

export function accreditationIsRemoveable(workflowState, expiryDate) {
  if (workflowState !== 62 || R.isNil(expiryDate)) {
    return false;
  }
  const differenceLeftByMonth = moment(expiryDate).diff(moment(new Date()), 'months');
  if (differenceLeftByMonth < -1) {
    return false; //suspended can't remove
  }
  return true;
}

export function accreditationIsUpdateable(workflowState, expiryDate) {
  if (workflowState !== 62 || R.isNil(expiryDate)) {
    return false;
  }
  const differenceLeftByMonth = moment(expiryDate).diff(moment(new Date()), 'months');
  if (differenceLeftByMonth < -1) {
    return false; //suspended can't update
  }
  return true;
}


export function accreditationIsMaintainable(workflowState, expiryDate, moduleCanMaintain) {
  if (workflowState !== 62 || R.isNil(expiryDate) || moduleCanMaintain === false) {
    return false;
  }
  const differenceLeftByMonth = moment(expiryDate).diff(moment(new Date()), 'months');
  if (differenceLeftByMonth >= 3) {
    return false; //not within 3 month expires soon range for maintain
  }
  if (differenceLeftByMonth < -1) {
    return false; //suspended can't maintain
  }
  // if (differenceLeftByMonth < -3) {
  //   return false; //expired can't maintain
  // }
  return true;
}

export function applicationTypesToShowDatePanel(applicationType) {
  return R.contains(applicationType, ['Establish Accreditation', 'Add Module', "Maintain Accreditation"]);
}

export function accreditationDefaultEntryDate() {
  return moment(new Date()).toDate();
}

export function accreditationDefaultExpiryDate(entryDate) {
  return moment(entryDate).add(3, "years").subtract(1, "day").toDate();
}

export function accreditationNextAuditDate(entryDate, expiryDate, lastAuditDate) {
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
