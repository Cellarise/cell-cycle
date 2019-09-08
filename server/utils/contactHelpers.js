"use strict";
const R = require('ramda');
const {isImmutable} = require("../utils");

function contactUserNameFormatter(user) {
  if (isImmutable(user)) {
    user = user.toJS();
  }
  if (R.isNil(user)) {
    return "";
  }
  if (R.isNil(user.name)) {
    return user.email;
  }
  return user.firstName + " " + user.name;
}


module.exports = {
  "contactUserNameFormatter": contactUserNameFormatter
};
