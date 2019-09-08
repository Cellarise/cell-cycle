"use strict";
var R = require('ramda');

function serialize(obj) {
  if (R.isNil(obj)) {
    return obj;
  }
  return JSON.stringify(obj);
}

function deserialize(dbObj) {
  var parsedResult;
  if (R.isNil(dbObj)) {
    return dbObj;
  }
  if (typeof dbObj === 'string') {
    try {
      parsedResult = JSON.parse(dbObj);
    } catch (err) {
      parsedResult = dbObj;
    }
    return parsedResult;
  }
  return dbObj;
}

module.exports = {
  "serialize": serialize,
  "deserialize": deserialize
};
