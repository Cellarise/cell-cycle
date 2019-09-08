/* eslint-disable */
"use strict";
const R = require('ramda');
const moment = require('moment');

const AEST_UTC_OFFSET = 600;


module.exports = function dateFilter(filterType, value, _utcOffset) {
  const utcOffset = R.defaultTo(AEST_UTC_OFFSET, _utcOffset);
  switch (filterType) {
    case "gt-date":
      return moment.utc(value).add(utcOffset, 'm').startOf('day').utc().subtract(utcOffset, 'm').add(1, 'days').toDate();
    case "lt-date":
      return moment.utc(value).add(utcOffset, 'm').startOf('day').utc().subtract(utcOffset, 'm').toDate();
    case "date+0":
      return moment.utc(value).add(utcOffset, 'm').endOf('day').utc().subtract(utcOffset, 'm').toDate();
    case "date-0":
      return moment.utc(value).add(utcOffset, 'm').startOf('day').utc().subtract(utcOffset, 'm').toDate();
    case "gt+41":
      return moment.utc(new Date()).add(utcOffset, 'm').endOf('day').utc().add(41, 'days').subtract(utcOffset, 'm').toDate();
    case "gt+20":
      return moment.utc(new Date()).add(utcOffset, 'm').endOf('day').utc().add(20, 'days').subtract(utcOffset, 'm').toDate();
    case "gt+6":
      return moment.utc(new Date()).add(utcOffset, 'm').endOf('day').utc().add(6, 'days').subtract(utcOffset, 'm').toDate();
    case "gt+1":
      return moment.utc(new Date()).add(utcOffset, 'm').endOf('day').utc().add(1, 'days').subtract(utcOffset, 'm').toDate();
    case "gt+0":
      return moment.utc(new Date()).add(utcOffset, 'm').endOf('day').utc().subtract(utcOffset, 'm').toDate();
    case "gt-0":
      return moment.utc(new Date()).add(utcOffset, 'm').startOf('day').utc().subtract(utcOffset, 'm').toDate();
    case "gt-1":
      return moment.utc(new Date()).add(utcOffset, 'm').endOf('day').utc().subtract(1, 'days').subtract(utcOffset, 'm').toDate();
    case "gt-8":
      return moment.utc(new Date()).add(utcOffset, 'm').endOf('day').utc().subtract(8, 'days').subtract(utcOffset, 'm').toDate();
    case "gt-31":
      return moment.utc(new Date()).add(utcOffset, 'm').endOf('day').utc().subtract(31, 'days').subtract(utcOffset, 'm').toDate();
    case "gt-91":
      return moment.utc(new Date()).add(utcOffset, 'm').endOf('day').utc().subtract(91, 'days').subtract(utcOffset, 'm').toDate();
    default:
      return moment.utc(new Date()).add(utcOffset, 'm').startOf('day').utc().subtract(utcOffset, 'm').toDate();
  }
};
