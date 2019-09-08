"use strict";
const R = require('ramda');


function getLegalAndTradingName(account) {
  let name;
  if (!R.isNil(account.legalName) && account.legalName !== "") {
    name = account.legalName;
  }
  if (R.isNil(name) && !R.isNil(account.mainName) && account.mainName !== "") {
    name = account.mainName;
  }
  if (R.isNil(name)) {
    name = account.name;
  }
  if (!R.isNil(account.tradingName) && account.tradingName !== "") {
    name = name + ' t/a ' + account.tradingName;
  }
  if (!R.isNil(account.RMID) && account.RMID !== "") {
    name = name + ' (' + account.RMID + ")";
  }
  return name;
}

module.exports = {
  "getLegalAndTradingName": getLegalAndTradingName
};
