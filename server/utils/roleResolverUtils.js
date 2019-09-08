"use strict";
const R = require('ramda');
const {
  getAccountAndServicePrincipals, getAccountRoleFromPrincipal, getServiceRoleFromPrincipal
} = require('../libraries/authorisations');
const jsonUtils = require('./jsonUtils');


function findModelId(context, modelIdFld) {
  let modelId, whereJS;
  if (R.isNil(context.remotingContext.req)) {
    return modelId;
  }
  if (R.path(["body", modelIdFld], context.remotingContext.req)) {
    modelId = context.remotingContext.req.body[modelIdFld];
  } else if (R.path(["query", modelIdFld], context.remotingContext.req)) {
    modelId = context.remotingContext.req.query[modelIdFld];
  } else if (R.path(["query", "where"], context.remotingContext.req)) {
    whereJS = R.defaultTo({}, jsonUtils.deserialize(context.remotingContext.req.query.where));
    if (whereJS.and && whereJS.and.length > 0 && whereJS.and[0]
      && whereJS.and[0].and && whereJS.and[0].and.length > 0 && whereJS.and[0].and[0]) {
      modelId = whereJS.and[0].and[0][modelIdFld];
    } else if (whereJS.and && whereJS.and.length > 0 && whereJS.and[0]) {
      modelId = whereJS.and[0][modelIdFld];
    }
  } else if (R.path(["query", "filter"], context.remotingContext.req)) {
    whereJS = R.defaultTo({}, jsonUtils.deserialize(context.remotingContext.req.query.filter));
    if (R.path(["where", "and"], whereJS) && whereJS.where.and.length > 0 && whereJS.where.and[0]
      && whereJS.where.and[0].and && whereJS.where.and[0].and.length > 0 && whereJS.where.and[0].and[0]) {
      modelId = whereJS.where.and[0].and[0][modelIdFld];
    } else if (R.path(["where", "and"], whereJS)  && whereJS.where.and.length > 0 && whereJS.where.and[0]) {
      modelId = whereJS.where.and[0][modelIdFld];
    }
  }
  return modelId;
}

function isInAccountOrOperationsAndRoleFromContext(roleMatrix, context, principalIdPartial, opPrincipalIdPartial) {
  let accountType, accountId, accountIdField, principalId, operationsPrincipalId;
  if (!R.isNil(context.accessToken) && !R.isNil(context.accessToken.accountType)) {
    accountType = context.accessToken.accountType;
    accountId = context.accessToken.accountId;
    accountIdField = accountType + "AccountId";
    principalId = accountType + "Account" + principalIdPartial;
    operationsPrincipalId = "operationsAccount" + opPrincipalIdPartial;
    if (isInAccountAndRole(roleMatrix, context, accountIdField, accountId, accountType, principalId)) {
      return true;
    }
    return hasAccountRole(roleMatrix, context, "operations", operationsPrincipalId);
  }
  return false;
}

function isInAccountAndRoleFromContext(roleMatrix, context, principalIdPartial) {
  let accountType, accountId, accountIdField, principalId;
  if (!R.isNil(context.accessToken) && !R.isNil(context.accessToken.accountType)) {
    accountType = context.accessToken.accountType;
    accountId = context.accessToken.accountId;
    accountIdField = accountType + "AccountId";
    principalId = accountType + "Account" + principalIdPartial;
    return isInAccountAndRole(roleMatrix, context, accountIdField, accountId, accountType, principalId);
  }
  return false;
}

function isInAccountOrOperationsAndServiceRoleFromContext(roleMatrix, context, service, principalIdPartial) {
  let accountType, accountId, accountIdField, principalId;
  if (!R.isNil(context.accessToken) && !R.isNil(context.accessToken.accountType)) {
    accountType = context.accessToken.accountType;
    accountId = context.accessToken.accountId;
    accountIdField = accountType + "AccountId";
    principalId = accountType + service + principalIdPartial;
    if (isInAccountAndRole(roleMatrix, context, accountIdField, accountId, accountType, principalId)) {
      return true;
    }
    principalId = "operations" + service + principalIdPartial;
    accountId = R.defaultTo(1, context.accessToken.operationsAccountId);
    return isInAccountAndRole(roleMatrix, context, "operationsAccountId", accountId, "operations", principalId);
  }
  return false;
}

function isInAccountAndServiceRoleFromContext(roleMatrix, context, service, principalIdPartial) {
  let accountType, accountId, accountIdField, principalId;
  if (!R.isNil(context.accessToken) && !R.isNil(context.accessToken.accountType)) {
    accountType = context.accessToken.accountType;
    accountId = context.accessToken.accountId;
    accountIdField = accountType + "AccountId";
    principalId = accountType + service + principalIdPartial;
    return isInAccountAndRole(roleMatrix, context, accountIdField, accountId, accountType, principalId);
  }
  return false;
}

function getActiveOperationsAccount(context) {
  var accounts, operationsAccountId;
  if (!R.isNil(context.accessToken)) {
    accounts = context.accessToken.accounts;
    operationsAccountId = context.accessToken.operationsAccountId;
  } else if (!R.isNil(context.req) && !R.isNil(context.req.accessToken)) {
    accounts = context.req.accessToken.accounts;
    operationsAccountId = context.req.accessToken.operationsAccountId;
  }
  if (R.isNil(accounts) || R.isNil(accounts.operations) || R.isNil(operationsAccountId)) {
    return null;
  }
  return R.find(
    function eachAccount(account) {
      return account.operationsAccountId === parseInt(operationsAccountId, 10)
        && account.userActivated === true
        && account.accountActivated === true;
    },
    accounts.operations
  );
}

function isInAccountAndRoleFromContextWithImpersonation(roleMatrix, context, principalId) {
  let accountType, accountId, accountIdField;
  if (!R.isNil(context.accessToken) && !R.isNil(context.accessToken.accountType)) {
    accountType = context.accessToken.accountType;
    accountId = context.accessToken.accountId;
    return isInAccountAndRoleWithImpersonation(roleMatrix, context, accountId, accountType, principalId);
  }
  return false;
}

function isInAccountAndRoleWithImpersonation(roleMatrix, context, accountId, accountType, principalId) {
  var userId, accounts;
  if (!R.isNil(context.accessToken)) {
    userId = context.accessToken.userId;
    accounts = context.accessToken.accounts;
  } else if (!R.isNil(context.req) && !R.isNil(context.req.accessToken)) {
    userId = context.req.accessToken.userId;
    accounts = context.req.accessToken.accounts;
  } else {
    userId = null;
    accounts = null;
  }

  //give access if admin
  if (userId === 1) {
    return true;
  }
  //allow for impersonation
  const operationsAccountUserMapping = getActiveOperationsAccount(context);
  if (R.contains(accountType, ["customer", "partner", "contractor"]) && !R.isNil(operationsAccountUserMapping)) {
    return R.contains(
      principalId,
      getAccountAndServicePrincipals(operationsAccountUserMapping, "operations", [], roleMatrix)
    );
  }
  if (R.isNil(userId)
    || R.isNil(accountId)
    || R.isNil(accounts)
    || R.isNil(accounts[accountType])
    || accounts[accountType].length === 0) {
    // do not allow anonymous users
    // do not allow access without account id specified
    return false;
  }

  // check if userId has AccountUserMapping table for the given account id
  const accountUserMapping = R.find(
    function eachAccount(account) {
      return account[accountType + "AccountId"] === parseInt(accountId, 10)
        && account.userActivated === true
        && account.accountActivated === true;
    },
    R.defaultTo([], accounts[accountType])
  );

  if (R.isNil(accountUserMapping)) {
    return false;
  }

  return R.contains(
    principalId,
    getAccountAndServicePrincipals(accountUserMapping, accountType, [], roleMatrix)
  );
}

function isInAccountAndRole(roleMatrix, context, accountIdField, accountId, accountType, principalId) {
  var userId, accounts;
  if (!R.isNil(context.accessToken)) {
    userId = context.accessToken.userId;
    accounts = context.accessToken.accounts;
  } else if (!R.isNil(context.req) && !R.isNil(context.req.accessToken)) {
    userId = context.req.accessToken.userId;
    accounts = context.req.accessToken.accounts;
  } else {
    userId = null;
    accounts = null;
  }

  //give access if admin
  if (userId === 1) {
    return true;
  }
  if (R.isNil(userId)
    || R.isNil(accountId)
    || R.isNil(accounts)
    || R.isNil(accounts[accountType])
    || accounts[accountType].length === 0) {
    // do not allow anonymous users
    // do not allow access without account id specified
    return false;
  }

  // check if userId has AccountUserMapping table for the given account id
  const accountUserMapping = R.find(
    function eachAccount(account) {
      return account[accountIdField] === parseInt(accountId, 10)
        && account.userActivated === true
        && account.accountActivated === true;
    },
    R.defaultTo([], accounts[accountType])
  );

  if (R.isNil(accountUserMapping)) {
    return false;
  }

  return R.contains(
    principalId,
    getAccountAndServicePrincipals(accountUserMapping, accountType, [], roleMatrix)
  );
}

/* eslint max-params:0 */
/*
 * Check if user has an ACTIVE account mapping record for any account
 * For find requests against a user - will list all account mappings for user
 * For update requests against a single user - will allow changes to any account mappings for user
 */
function hasAccountRole(roleMatrix, context, accountType, principalId) {
  var userId, accounts;
  if (!R.isNil(context.accessToken)) {
    userId = context.accessToken.userId;
    accounts = context.accessToken.accounts;
  } else if (!R.isNil(context.req) && !R.isNil(context.req.accessToken)) {
    userId = context.req.accessToken.userId;
    accounts = context.req.accessToken.accounts;
  } else {
    userId = null;
    accounts = null;
  }

  if (userId === 1) {
    //('isInAccountAndRole() - admin user');
    return true;
  }
  if (R.isNil(userId) || R.isNil(accounts)) {
    // do not allow anonymous users
    return false;
  }

  // check if userId is in AccountUserMapping table for the given roles
  const accountMapping = R.find(
    function eachAccount(account) {
      return R.contains(account.role, getAccountRoleFromPrincipal(accountType, principalId, roleMatrix))
        && account.userActivated === true
        && account.accountActivated === true;
    },
    R.defaultTo([], accounts[accountType])
  );

  //give access if found or user is admin
  return !R.isNil(accountMapping);
}

function hasServiceRole(roleMatrix, context, accountType, service, principalId) {
  var userId, accounts;
  if (!R.isNil(context.accessToken)) {
    userId = context.accessToken.userId;
    accounts = context.accessToken.accounts;
  } else if (!R.isNil(context.req) && !R.isNil(context.req.accessToken)) {
    userId = context.req.accessToken.userId;
    accounts = context.req.accessToken.accounts;
  } else {
    userId = null;
    accounts = null;
  }

  if (userId === 1) {
    //('isInAccountAndRole() - admin user');
    return true;
  }
  if (R.isNil(userId) || R.isNil(accounts)) {
    // do not allow anonymous users
    return false;
  }

  // check if userId is in AccountUserMapping table for the given roles
  const serviceMapping = R.find(
    function eachAccount(account) {
      return R.contains(
        account["role" + service], getServiceRoleFromPrincipal(accountType, principalId, service, roleMatrix)
        )
        && account.userActivated === true
        && account.accountActivated === true;
    },
    R.defaultTo([], accounts[accountType])
  );

  //give access if found
  return !R.isNil(serviceMapping);
}

module.exports = {
  "findModelId": findModelId,
  "getActiveOperationsAccount": getActiveOperationsAccount,
  "isInAccountAndServiceRoleFromContext": isInAccountAndServiceRoleFromContext,
  "isInAccountOrOperationsAndServiceRoleFromContext": isInAccountOrOperationsAndServiceRoleFromContext,
  "isInAccountAndRoleFromContext": isInAccountAndRoleFromContext,
  "isInAccountAndRoleWithImpersonation": isInAccountAndRoleWithImpersonation,
  "isInAccountAndRoleFromContextWithImpersonation": isInAccountAndRoleFromContextWithImpersonation,
  "isInAccountOrOperationsAndRoleFromContext": isInAccountOrOperationsAndRoleFromContext,
  "isInAccountAndRole": isInAccountAndRole,
  "hasAccountRole": hasAccountRole,
  "hasServiceRole": hasServiceRole
};
