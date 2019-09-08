"use strict";
const R = require('ramda');
const {toNumber} = require('../utils');

module.exports = function escapeInput(input, whiteList) {
  const inputWhiteList = R.defaultTo("[^SNA0-9]+", whiteList);
  let idType = "abn";
  if (!R.is(String, input)) {
    return {
      "type": "id",
      "input": 0
    };
  }
  let sanitisedInput = R.defaultTo("", input).replace(new RegExp(inputWhiteList, "ig"), "");
  if (sanitisedInput.indexOf("SN401") > -1 && sanitisedInput.length === 14) {
    sanitisedInput = sanitisedInput.replace("SN401", "");
    idType = "id";
  } else if (sanitisedInput.indexOf("SA") > -1 && sanitisedInput.length === 13) {
    sanitisedInput = sanitisedInput.replace("SA", "");
    idType = "abn";
  } else {
    return {
      "type": "id",
      "input": 0
    };
  }
  sanitisedInput = toNumber(sanitisedInput);
  if (!R.isNil(sanitisedInput) && R.is(Number, sanitisedInput)) {
    return {
      "type": idType,
      "input": sanitisedInput
    };
  }
  return {
    "type": "id",
    "input": 0
  };
};
