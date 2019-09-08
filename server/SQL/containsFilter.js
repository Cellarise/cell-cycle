"use strict";
const R = require('ramda');
const result = require('../../../../common/data/stopListWords.json');
const stopWords = R.map(
  function eachItem(noiseList) {
    return noiseList.stopword;
  },
  result
);

module.exports = function containsFilter(input) {
  if (R.is(Number, input)) {
    return input + " ";

  }
  if (!R.is(String, input)) {
    return '""';
  }
  /* Remove all punctuation but keep the spaces */
  const sanitisedInput = R.defaultTo("", input).replace(/[^A-Za-z0-9\s\\/@]/g, "").replace(/\s{2,}/g, " ");
  const splitInput = R.split(' ', sanitisedInput.trim());
  const removeStopListWord = R.without(stopWords, splitInput);
  const inputQuery = R.join(' AND ', removeStopListWord);
  if (R.contains(sanitisedInput, stopWords)) {
    return R.defaultTo('""', sanitisedInput);
  }
  return R.isNil(inputQuery) || inputQuery === "" ? '""' : inputQuery;
};
