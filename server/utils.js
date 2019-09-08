"use strict";
const Immutable = require('immutable');
const R = require('ramda');
const moment = require('moment');
const accounting = require('accounting');

const AEST_UTC_OFFSET = 600;

function capitalizeFirstLetter(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

function lowerCaseFirstLetter(str) {
  return str.slice(0, 1).toLowerCase() + str.slice(1);
}

function fixedLength(str, len) {
  if (R.is(String, str) && str.length > len) {
    return str.slice(0, len - 2) + "...";
  }
  return str;
}

function toNumber(value) {
  if (R.isNil(value) || isNaN(value)) {
    return null;
  }
  return Number(value);
}

function zeroNull(value) {
  return R.isNil(value) ? 0 : value;
}

function incrementNumberFromString(value) {
  const _number = toNumber(value);
  if (R.isNil(_number)) {
    return 1;
  }
  return _number + 1;
}

function toFixed(number, decimalPlaces) {
  return accounting.unformat(accounting.toFixed(toNumber(number), decimalPlaces));
}

/*
 * Format a ISO date string or javascript date object in a system-wide
 * standard user friendly format (01-Jan-2015)
 * @param {object} dateStr ISO formatted date string or javascript date object
 * @param {*} [nullValue=null] value to return if null
 * @returns {String} Formatted date string (in the format "01-Jan-2015") or null / nullValue
 */
function formattedDate(dateStr, nullValue){
  if (!R.isNil(dateStr)) {
    return moment.utc(dateStr)
    //adjust to server timezone - will cancel out if in same zone as client
    //   .subtract(moment().utcOffset(), 'minutes') - assume AEST timezone for date
      .add(AEST_UTC_OFFSET, 'minutes')
      .format("DD-MMM-YYYY");
  }
  return R.defaultTo(
    moment.utc(new Date())
      .add(AEST_UTC_OFFSET, 'minutes')
      .format("DD-MMM-YYYY"),
    nullValue
  );
}

/*
 * Format a ISO datetime string or javascript date object in a system-wide
 * standard user friendly format (20:00:00 01-Jan-2015)
 * @param {object} dateStr ISO formatted datetime string or javascript date object
 * @param {*} [nullValue=null] value to return if null
 * @returns {String} Formatted date time string (in the format "20:00:00 01-Jan-2015") or null
 */
function formattedDateTime(dateStr, nullValue, utcOffset){
  if (!R.isNil(dateStr) && !R.isNil(utcOffset)) {
    return moment.utc(dateStr)
    //adjust to server timezone - will cancel out if in same zone as client
    //   .subtract(moment().utcOffset(), 'minutes')
      .add(utcOffset, 'minutes')
      .format("DD-MMM-YYYY HH:mm:ss");
  }
  return dateStr ? moment(dateStr).format("DD-MMM-YYYY HH:mm:ss") : R.defaultTo(null, nullValue);
}

function formattedDateTimeAMPM(dateStr, nullValue, utcOffset){
  if (!R.isNil(dateStr) && !R.isNil(utcOffset)) {
    return moment.utc(dateStr)
    //adjust to server timezone - will cancel out if in same zone as client
    //   .subtract(moment().utcOffset(), 'minutes')
      .add(utcOffset, 'minutes')
      .format("DD MMM YYYY hh:mm A");
  }
  return dateStr ? moment(dateStr).format("DD MMM YYYY hh:mm A") : R.defaultTo(null, nullValue);
}

function getStartOfDayUTCDate(dateVal, nullValue, _utcOffset) {
  const utcOffset = R.defaultTo(AEST_UTC_OFFSET, _utcOffset);
  if (!R.isNil(dateVal) && moment(dateVal).isValid()) {
    return moment.utc(dateVal)
      .add(utcOffset, 'minutes')
      .startOf('day').utc()
      .subtract(utcOffset, 'minutes')
      .toDate();
  }
  return R.defaultTo(null, nullValue);
}

function getEndOfDayUTCDate(dateVal, nullValue, _utcOffset) {
  const utcOffset = R.defaultTo(AEST_UTC_OFFSET, _utcOffset);
  if (!R.isNil(dateVal) && moment(dateVal).isValid()) {
    return moment.utc(dateVal)
      .add(utcOffset, 'minutes')
      .endOf('day').utc()
      .subtract(1, 'minutes') //ensure it is end of day and not rounded to next day
      .subtract(utcOffset, 'minutes')
      .toDate();
  }
  return R.defaultTo(null, nullValue);
}

function isImmutable(obj) {
  return !R.isNil(obj) && Immutable.Iterable.isIterable(obj);
}

function getApplicationNameConvention(applicationClassHeader, applicationClass, applicationType) {
  var _applicationClass, modeTitle;
  if (R.isNil(applicationClass)) {
    return "";
  }
  _applicationClass = R.concat(applicationClass, " Application");
  if (R.isNil(applicationType) || applicationClass === applicationType ||
    R.contains(applicationClass, ["Cancel Permit"])) {
    modeTitle = _applicationClass;
  } else {
    _applicationClass = applicationClass + " Application - ";
    modeTitle = _applicationClass + applicationType;
  }
  return modeTitle;
}

function getCalculatedExpiryStatus(status, compareDate) {
  var updatedStatus = status;
  if (!R.isNil(compareDate) && !R.isNil(updatedStatus) && updatedStatus === "Current") {
    const compareDateArray = R.slice(0, 3, moment(compareDate).toArray());
    const currentDateArray = R.slice(0, 3, moment(new Date()).toArray());
    const differenceDateByMonth = moment(compareDateArray).diff(currentDateArray, 'months');
    const differenceDate = moment(compareDate).diff(moment(new Date()), 'hours');
    if (differenceDateByMonth < 3) {
      updatedStatus = "Expires soon";
    }
    if (differenceDate < 0) {
      updatedStatus = "Expired";
    }
    if (differenceDateByMonth < 0) {
      updatedStatus = "Suspended";
    }
  }
  return updatedStatus;
}


module.exports = {
  "capitalizeFirstLetter": capitalizeFirstLetter,
  "lowerCaseFirstLetter": lowerCaseFirstLetter,
  "fixedLength": fixedLength,
  "toNumber": toNumber,
  "zeroNull": zeroNull,
  "toFixed": toFixed,
  "incrementNumberFromString": incrementNumberFromString,
  "formattedDate": formattedDate,
  "formattedDateTime": formattedDateTime,
  "formattedDateTimeAMPM": formattedDateTimeAMPM,
  "getStartOfDayUTCDate": getStartOfDayUTCDate,
  "getEndOfDayUTCDate": getEndOfDayUTCDate,
  "isImmutable": isImmutable,
  "getApplicationNameConvention": getApplicationNameConvention,
  "getCalculatedExpiryStatus": getCalculatedExpiryStatus
};
