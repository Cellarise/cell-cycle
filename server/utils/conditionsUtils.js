"use strict";
const R = require('ramda');
const moment = require('moment');

function standardiseFieldTypesInTemplateConfig(templateConfig) {
  if (R.isNil(templateConfig)) {
    return null;
  }
  return R.map(
    function eachTemplateField(templateField) {
      if (templateField.fieldType === 'number') {
        templateField.exampleValue = R.isNil(templateField.exampleValue) ? null : toNumber(templateField.exampleValue);
        templateField.value = R.isNil(templateField.value) ? null : toNumber(templateField.value);
      }
      if (templateField.fieldType === 'date') {
        templateField.exampleValue = "DATE";
        templateField.value = R.isNil(templateField.value) ? null : toDate(templateField.value);
      }
      return templateField;
    },
    R.defaultTo({}, templateConfig)
  );
}

function toNumber(value) {
  if (R.isNil(value) || isNaN(value)) {
    return 0;
  }
  return Number(value);
}

function toDate(value) {
  if (value instanceof Date) {
    return value;
  }
  const dateMoment = moment(value);
  if (!dateMoment.isValid()) {
    return value;
  }
  return dateMoment.toDate();
}



module.exports = {
  "standardiseFieldTypesInTemplateConfig": standardiseFieldTypesInTemplateConfig
};
