"use strict";
const R = require('ramda');
const moment = require('moment');
const {toNumber} = require('cell-cycle/server/utils');

module.exports = function dateReportsValue(filterType) {
  let value, finYear;
  if (!R.contains(filterType,
      ["currentFinYear", "currentYear", "currentMonth",
        "previousFinYear", "previousYear","previousMonth",
        "last3Months", "last6Months", "last12Months"]
    )) {
    return null;
  }
  const year = toNumber(moment().format('YYYY'));
  const currentMonthNumber = toNumber(moment().format('M'));
  if (filterType === "currentMonth") {
    return getYearMonthValue(year, currentMonthNumber, 0);
  }
  if (filterType === "previousMonth") {
    return getYearMonthValue(year, currentMonthNumber, 1);
  }
  if (filterType === "last3Months") {
    return [
      getYearMonthValue(year, currentMonthNumber, 0),
      getYearMonthValue(year, currentMonthNumber, 1),
      getYearMonthValue(year, currentMonthNumber, 2)
    ];
  }
  if (filterType === "last6Months") {
    return [
      getYearMonthValue(year, currentMonthNumber, 0),
      getYearMonthValue(year, currentMonthNumber, 1),
      getYearMonthValue(year, currentMonthNumber, 2),
      getYearMonthValue(year, currentMonthNumber, 3),
      getYearMonthValue(year, currentMonthNumber, 4),
      getYearMonthValue(year, currentMonthNumber, 5)
    ];
  }
  if (filterType === "last12Months") {
    return [
      getYearMonthValue(year, currentMonthNumber, 0),
      getYearMonthValue(year, currentMonthNumber, 1),
      getYearMonthValue(year, currentMonthNumber, 2),
      getYearMonthValue(year, currentMonthNumber, 3),
      getYearMonthValue(year, currentMonthNumber, 4),
      getYearMonthValue(year, currentMonthNumber, 5),
      getYearMonthValue(year, currentMonthNumber, 6),
      getYearMonthValue(year, currentMonthNumber, 7),
      getYearMonthValue(year, currentMonthNumber, 8),
      getYearMonthValue(year, currentMonthNumber, 9),
      getYearMonthValue(year, currentMonthNumber, 10),
      getYearMonthValue(year, currentMonthNumber, 11)
    ];
  }
  if (filterType === "currentFinYear" || filterType === "previousFinYear") {
    if (currentMonthNumber > 6) {
      finYear = year + 1;
    } else {
      finYear = year;
    }
    if (filterType === "previousFinYear") {
      finYear = finYear - 1;
    }
    return [
      finYear - 1 + "-07 (Jul)",
      finYear - 1 + "-08 (Aug)",
      finYear - 1 + "-09 (Sep)",
      finYear - 1 + "-10 (Oct)",
      finYear - 1 + "-11 (Nov)",
      finYear - 1 + "-12 (Dec)",
      finYear + "-01 (Jan)",
      finYear + "-02 (Feb)",
      finYear + "-03 (Mar)",
      finYear + "-04 (Apr)",
      finYear + "-05 (May)",
      finYear + "-06 (Jun)"
    ];
  }
  if (filterType === "currentYear") {
    value = year;
  }
  if (filterType === "previousYear") {
    value = year - 1;
  }
  return value + ""; //return string
};

function getYearMonthValue(year, currentMonthNumber, offset) {
  let _year = year;
  if (currentMonthNumber - offset < 1) {
    _year = _year - 1;
  }
  return _year + '-' + moment().subtract(offset, 'months').format('MM') +
    ' (' + moment().subtract(offset, 'months').format('MMM') + ")";
}
