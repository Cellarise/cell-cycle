"use strict";
var R = require('ramda');


function isFeatureEnabledInSettings(feature, settingsField) {
  if (R.isNil(settingsField)) {
    return false;
  }
  if (settingsField.hasOwnProperty("value")
    && R.is(Object, settingsField.value)
    && settingsField.value.hasOwnProperty("features")
    && settingsField.value.features.hasOwnProperty("value")
    && R.is(Array, settingsField.value.features.value)) {
    return !!R.find(function (f) {
      return f.id.value === feature;
    }, settingsField.value.features.value);
  } else if (settingsField.hasOwnProperty("features")
    && R.is(Array, settingsField.features)) {
    return !!R.find(function (f) {
      return f.id === feature;
    }, settingsField.features);
  }
  return false;
}

function isFeatureEnabledForAnyAccount(feature, authenticationUIProps) {
  var accountTypes = [
    'contractorAccounts',
    'customerAccounts',
    'operationsAccounts',
    'partnerAccounts'
  ];
  var features = R.flatten(
    R.map(function(type) {
      var relationName = type.slice(0, -1);
      return R.pipe(
        R.filter(function (mapping) {
          return mapping[relationName].settings && mapping[relationName].settings.features;
        }),
        R.map(function (mapping) {
          return mapping[relationName].settings.features;
        })
      )(authenticationUIProps[type]);
    }, accountTypes)
  );
  return !!R.find(function (f) {
    return f.id === feature;
  }, features);
}

module.exports = {
  "isFeatureEnabledInSettings": isFeatureEnabledInSettings,
  "isFeatureEnabledForAnyAccount": isFeatureEnabledForAnyAccount
};
