"use strict";
const R = require('ramda');

module.exports = function escapeInput(input, whiteList) {
  const inputWhiteList = R.defaultTo("[^A-Za-z0-9@&\\s_.,\\(\\)\\-\\\"\\'\\/\\<\\>]+", whiteList);
  // if (input === "$now") {
  //   return moment.utc(new Date()).toDate();
  // }
  if (R.is(Number, input)) {
    return input;
  }
  if (!R.is(String, input)) {
    return "";
  }
  const sanitisedInput = R.defaultTo("", input).replace(new RegExp(inputWhiteList, "ig"), "");
  return sanitisedInput;
};
