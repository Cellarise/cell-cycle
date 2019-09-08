"use strict";
import React from 'react';
import R from 'ramda';
import Immutable from 'immutable';
import {appInsights} from './globals';
import moment from "moment";

export {
  toCamelCase
} from './utils/toCamelCase';

/**
 * The top level keys on the model
 * @return {Array} the top level keys on the model
 */
export function modelKeys() {
  return ["stores", "hash", "startupVars"];
}

export function modelPassesFilters(filters, property, model){
  return R.reduce(
    (passFilter, filterConfig) => {
      var value;
      if (!passFilter) {
        return false;
      }
      if (model && R.is(Array, filterConfig.get) && filterConfig.get.length > 0
        && R.contains(filterConfig.get[0], modelKeys())) {
        value = model.getIn(filterConfig.get);
      } else if (!R.isNil(property.getIn)) {
        value = property.getIn(filterConfig.get);
      } else {
        value = property;
      }
      switch (filterConfig.op) {
        case "neq":
          return value !== filterConfig.test;
        case "length":
          return R.defaultTo("", value).length < filterConfig.test;
        default:
          return value === filterConfig.test;
      }
    },
    true,
    filters
  );
}

/**
 * Performs equality by iterating through keys on an object and returning
 * false when any key has values which are not strictly equal between
 * objA and objB.
 *
 * @param {Object} objA - first object to compare
 * @param {Object} objB - second object to compate
 * @return {boolean} Returns true when the values of all keys are strictly equal.
 */
export function shallowEqual(objA, objB) {
  var key;
  if (R.isNil(objA) && R.isNil(objB)) {
    return true;
  }
  if (R.isNil(objA) || R.isNil(objB)) {
    return false;
  }
  if (objA === objB) {
    return true;
  }
  // Test for A's keys different from B.
  for (key in objA) {
    if (objA.hasOwnProperty(key) &&
      (!objB.hasOwnProperty(key) || objA[key] !== objB[key])) {
      return false;
    }
  }
  // Test for B's keys missing from A.
  for (key in objB) {
    if (objB.hasOwnProperty(key) && !objA.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

/**
 * Creates a new function that, when invoked, caches the result of calling 'fn' for a given
 * argument set and returns the result. Subsequent calls to the memoized 'fn' with the same
 * argument set will not result in an additional call to 'fn'; instead, the cached result
 * for that set of arguments will be returned.
 * Uses shallow equality checking of arguments to determine whether to use cached result.
 *
 * @func
 * @category Function
 * @sig (*... -> a) -> (*... -> a)
 * @param {Function} fn The function to memoize.
 * @param {Integer} [cacheLength=0] The length of the cache
 * @return {Function} Memoized version of 'fn'.
 */
export function memoizeShallow(fn, cacheLength) {
  var argumentsCache = [];
  var fnCache = [];
  var maxCacheLength = cacheLength || 0;
  return function memoizeReturn() {
    var currentCacheLength = fnCache.length;
    var fnResult;
    var keyIdx = R.findIndex(
      (cachedArguments) => R.addIndex(R.all)((arg, idx) => (arg === arguments[idx]), cachedArguments),
      argumentsCache
    );
    //check cache length and release objects for garbage collection
    if (keyIdx === -1 && currentCacheLength > maxCacheLength) {
      argumentsCache[0] = null;
      fnCache[0] = null;
      argumentsCache.shift();
      fnCache.shift();
    }
    //add new memoized result to cache
    if (keyIdx === -1) {
      fnResult = fn.apply(this, arguments);
      argumentsCache.push(arguments);
      fnCache.push(fnResult);
      keyIdx = fnCache.length - 1;
    }
    if (argumentsCache.length !== fnCache.length) {
      appInsights.trackException("argumentsCache.length !== fnCache.length", 'memoizeShallow');
    }
    return fnCache[keyIdx];
  };
}

/**
 * Merge objects up to two levels deep
 * @param {object} source - the source object to be merged on to
 * @param {object} target - the target object to merge on top of source
 * @returns {object} - the merged result
 */
export function mergeDeepL2(source, target) {
  if (!R.is(Object, source) || !R.is(Object, target)) {
    appInsights.trackException("source or target is not an object", 'mergeDeepL2');
    return null;
  }
  return R.pipe(
    R.merge(target),
    R.mapObjIndexed(
      (objVal, objKey) => {
        var targetVal = target[objKey];
        if (R.is(Object, objVal) && !R.is(Array, objVal) && R.is(Object, targetVal) && !R.is(Array, targetVal)) {
          return R.merge(objVal, targetVal);
        }
        return objVal;
      }
    )
  )(source);
}

export function isVal(val) {
  return (val !== null && typeof val !== 'undefined');
}


export function capitalizeFirstLetter(str) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}

export function lowerCaseFirstLetter(str) {
  return str.slice(0, 1).toLowerCase() + str.slice(1);
}

export function fixedLength(str, len) {
  if (R.is(String, str) && str.length > len) {
    return str.slice(0, len - 2) + "...";
  }
  return str;
}

export function regexEscape(str) {
  return R.is(String, str) ? str.replace(/[/\\^$*+?()|[\]{}]/g, '\\$&') : str;
}

export function arrayToTree(arr, parent) {
  //get immediate children of parent
  var _parent = R.defaultTo(null, parent);
  return R.pipe(
    R.defaultTo([]),
    R.filter((item) => (item.parent === _parent)),
    R.map(function getChildren(childItem) {
      childItem.children = arrayToTree(arr, childItem.id);
      return childItem;
    })
  )(arr);
}

export function addParentItemsToArr(arr, context) {
  //get all parent items
  var parents = [];
  var parentItems;
  //filter items with null parents or parent already exists in arr
  R.pipe(
    R.addIndex(R.filter)(
      (item, idx, list) => (item.parent !== null && !R.find((item1) => (item1.id === item.parent), list))),
    R.forEach((item) => (parents.push(item.parent)))
  )(arr);
  if (parents.length === 0) {
    return arr;
  }
  //get unique parents
  parents = R.uniq(parents);
  parentItems = R.filter((item) => (R.find((parent) => (parent === item.id), parents)), context);
  return arr.concat(addParentItemsToArr(parentItems, context));
}

/**
 * Safe chained function
 * Will only create a new function if needed,
 * otherwise will pass back existing functions or null.
 * @param {function} one - first function
 * @param {function} two - second function
 * @returns {function|null} chained function or null
 */
export function createChainedFunction(one, two) {
  var hasOne = typeof one === "function";
  var hasTwo = typeof two === "function";

  if (!hasOne && !hasTwo) {
    return null;
  }
  if (!hasOne) {
    return two;
  }
  if (!hasTwo) {
    return one;
  }

  return function chainedFunction() {
    one.apply(this, arguments);
    two.apply(this, arguments);
  };
}

/**
 * Get a random integer up to the number of digits specified.
 * @param {Integer} numDigits - the number of digits to return
 * @returns {Integer} random number to number of digits specified
 */
export function randomNumber(numDigits) {
  return Math.round(Math.random() * numDigits).toString(10);
}

/**
 * Round number to a specified number of digits and return as a string.
 * @param {Number} num - the number
 * @param {Number} [digits=0] - the number digits to round @todo currently only supports 0!
 * @returns {String} number rounded to required number of digits
 */
export function roundToString(num, digits) {
  return (Math.round(num)).toFixed(R.defaultTo(0, digits));
}

/**
 * Get a random id for a dom element using an optional starting name.
 * @param {String} [prefix] - an optional starting prefix
 * @returns {String} random number to number of digits specified
 */
export function getRandomDomElementId(prefix) {
  var id = randomNumber(100000);
  return prefix ? prefix + id : "" + id;
}

function getMomentDateTime(dateStr, utc) {
  if (utc === true) {
    return moment.parseZone(dateStr);
  }
  return moment(dateStr);
}
/**
 * Format a ISO date string or javascript date object in a system-wide
 * standard user friendly format (01-Jan-2015)
 * @param {object} dateStr ISO formatted date string or javascript date object
 * @param {*} [nullValue=null] value to return if null
 * @param {boolean} return as UTC
 * @returns {String} Formatted date string (in the format "01-Jan-2015") or null / nullValue
 */
export function formattedDate(dateStr, nullValue, utc){
  return dateStr ? getMomentDateTime(dateStr, utc).format("DD-MMM-YYYY") : R.defaultTo(null, nullValue);
}

export function formattedDateMonth(dateStr, nullValue, utc){
  return dateStr ? getMomentDateTime(dateStr, utc).format("MMM-YYYY") : R.defaultTo(null, nullValue);
}

/**
 * Format a ISO datetime string or javascript date object in a system-wide
 * standard user friendly format (20:00:00 01-Jan-2015)
 * @param {object} dateStr ISO formatted datetime string or javascript date object
 * @param {*} [nullValue=null] value to return if null
 * @param {boolean} return as UTC
 * @returns {String} Formatted date time string (in the format "20:00:00 01-Jan-2015") or null
 */
export function formattedDateTime(dateStr, nullValue, utc){
  return dateStr ? getMomentDateTime(dateStr, utc).format("DD-MMM-YYYY HH:mm:ss") : R.defaultTo(null, nullValue);
}

export function formattedDateTimeAMPM(dateStr, nullValue, utc){
  return dateStr ? getMomentDateTime(dateStr, utc).format("DD MMM YYYY hh:mm A") : R.defaultTo(null, nullValue);
}

export function formattedYesNo(value){
  if (value === true) {
    return 'Yes';
  }
  return 'No';
}

export function getAuditRecordsByFilterSelection(records, store, filterAuditRecordsType){
  let updatedRecords;
  if (R.isNil(records) || R.isNil(filterAuditRecordsType)) {
    return records;
  }
  if (R.is(Array, records) && records.length > 0) {
    if (filterAuditRecordsType === "All") {
      updatedRecords = records;
    } else if (filterAuditRecordsType === "My changes") {
      updatedRecords = store.getIn(['auditCollection', 'currentUserRecords']);
    } else if (filterAuditRecordsType === "System changes") {
      updatedRecords = store.getIn(['auditCollection', 'systemRecords']);
    } else {
      updatedRecords = store.getIn(['auditCollection', 'nonSystemRecords']);
    }
  }
  return updatedRecords;
}

export function getDateListByModified(filteredRecords){
  if (R.isNil(filteredRecords)){
    return [];
  }
  if (filteredRecords.length > 0) {
    const enabledDates = R.map(filteredRecord => {
      return formattedDate(filteredRecord.modified);
    }, filteredRecords)
    return enabledDates
  }
  return [];
}


export function getAttributes(records, activeRecordIndex) {
  return records.map((record, index) => {
    let version = "v" + (records.length - index) +  " " + formattedDateTimeAMPM(record.modified);
    if (index === 0) {
      version = version + " (LATEST)";
    }
    return R.merge(record, {
      'index': index,
      'version': version,
      'event': index === records.length - 1 ? 'create' : 'update',
      'selected': index === activeRecordIndex
    });
  });
}

export function filterRecordsByDateTime(filteredRecords, value) {
  if (!R.isNil(filteredRecords) || filteredRecords.length > 0) {
    const endDate = moment(value).format('DD MMM YYYY') + " 11:59 PM";
    const availableRecords = R.filter(filteredRecord => {
      const fieldModifiedDate = formattedDateTimeAMPM(filteredRecord.modified);
      return moment(fieldModifiedDate).isBetween(value, endDate);
    }, filteredRecords);
   return availableRecords
  }
  return filteredRecords;
}

export function formattedBrokenDateTimeAMPM(dateStr, nullValue, utc){
  if (R.isNil(dateStr)) {
    return R.defaultTo(null, nullValue);
  }
  let momentDateTime = getMomentDateTime(dateStr, utc);
  return (
    <p>
      {momentDateTime.format("DD MMM YYYY")}<br/>
      <small>{momentDateTime.format("hh:mm A")}</small>
    </p>
  );
}

export function toNumber(value) {
  if (R.isNil(value) || isNaN(value)) {
    return 0;
  }
  return Number(value);
}

export function toDate(value) {
  if (R.isNil(value) || value instanceof Date) {
    return value;
  }
  let dateMoment = moment(value);
  if (!dateMoment.isValid()) {
    dateMoment = moment(value, 'DD/MM/YYYY');
  }
  if (!dateMoment.isValid()) {
    dateMoment = moment(value, 'DD/MM/YY');
  }
  if (!dateMoment.isValid()) {
    return value;
  }
  return dateMoment.toDate();
}

export function isImmutable(obj) {
  return !R.isNil(obj) && Immutable.Iterable.isIterable(obj);
}

// export function coerseToNumber(value) {
//   var numValue;
//   if (R.isNil(value) || R.is(Number, value)) {
//     return value;
//   }
//   numValue = Number(value);
//   if (isNaN(numValue)) {
//     return value;
//   }
//   return numValue;
// }

export function createMarkup(notes) {
  return {__html: notes};
}

export function sanitise(str) {
  if (R.isNil(str)) {
    return "";
  }
  if (str === "" || !R.is(String, str)) {
    return str;
  }
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return str.replace(reg, (match)=>(map[match]));
}

/**
 * Format a ISO date string or javascript date object in a system-wide
 * standard user friendly format (Jan-2015)
 * @param {object} dateStr ISO formatted date string or javascript date object
 * @param {*} [nullValue=null] value to return if null
 * @returns {String} Formatted date string (in the format "Jan-2015") or null / nullValue
 */

export function formattedMonthYear(dateStr, nullValue, utc){
  return dateStr ? getMomentDateTime(dateStr, utc).format("MMM-YYYY") : R.defaultTo(null, nullValue);
}
