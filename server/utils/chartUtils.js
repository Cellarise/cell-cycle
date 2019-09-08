"use strict";
const R = require('ramda');
const moment = require('moment');

function arrangedChartValues(groupByFields, resultValue, valueFieldsLength, groupFieldsLength) {
  let valueFields, groupFields, applicationTypesForValues, values,
    associatedValues, applicationTypesForGroups, groups, associatedGroups;
  valueFields = R.map(
    function eachValue(value) {
      return R.join('', ['value', value]);
    },
    R.range(1, valueFieldsLength + 1)
  );
  groupFields = R.map(
    function eachValue(value) {
      return R.join('', ['groupBy', value]);
    },
    R.range(1, groupFieldsLength + 1)
  );
  applicationTypesForValues = R.omit(groupByFields, resultValue);
  values = R.values(applicationTypesForValues);
  associatedValues = R.zipObj(valueFields, values);
  applicationTypesForGroups = R.pick(groupByFields, resultValue);
  groups = R.values(applicationTypesForGroups);
  associatedGroups = R.merge(R.zipObj(groupFields, groups), {"created": moment().format('YYYY-MM-DD HH:mm:ss')});
  return R.merge(associatedGroups, associatedValues);
}

module.exports = {
  "arrangedChartValues": arrangedChartValues
};
