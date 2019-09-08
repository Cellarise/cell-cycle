"use strict";
import R from 'ramda';
import {memoizeShallow} from '../utils';
import {getAccountAndServicePrincipals} from '../../server/libraries/authorisations';

/**
 * @param {Immutable} model - the model
 * @return {Immutable} - the model with the application stores configuration updated with authorised flags
 */
export function authoriseStores(model) {
  return model.set('stores', authoriseStoresDeep(
    model.getIn(["stores", "authenticationUI"]),
    model.get("stores")
  ));
}

/**
 * @param {Immutable} model - the model
 * @param {String} storeName - the store name
 * @return {Immutable} - the store with the configuration updated with authorised flags
 */
export function authoriseStore(model, storeName) {
  return model.set('stores', authoriseStoresDeep(
    model.getIn(["stores", "authenticationUI"]),
    model.get("stores"),
    storeName
  ));
}

/**
 * @param {Immutable} authenticationUI - sampled authenticationUI store
 * @param {Immutable} stores - the application stores configuration
 * @param {String} [storeName] - the store name to filter on
 * @return {Array} - the application stores configuration with authorised flags updated
 */
export function authoriseStoresDeep(authenticationUI, stores, storeName) {
  return stores.withMutations(mutableStores => {
    stores.forEach((store, idx) => {
      if (R.isNil(storeName) || idx === storeName) {
        mutableStores.set(idx, mutableStores.get(idx).withMutations(mutableStore => {
            authoriseStoreDeep(mutableStore, authenticationUI);
            authoriseStoreActions(mutableStore, authenticationUI);
          })
        );
      }
    });
  });
}


export function authoriseStoreDeep(mutableObj, authenticationUI) {
  if (mutableObj.has('noACL')) {
    mutableObj.setIn(["access", "mode", "create"], true);
    mutableObj.setIn(["access", "mode", "read"], true);
    mutableObj.setIn(["access", "mode", "update"], true);
    mutableObj.setIn(["access", "mode", "delete"], true);
    setAccessOnRecordTemplateFields(mutableObj, mutableObj.getIn(["access", "mode"]));
    setAccessOnEmbeddedModelFields(mutableObj, mutableObj.getIn(["access", "mode"]));
    setAccessOnRecords(mutableObj, mutableObj.getIn(["access", "mode"]));
  } else if (mutableObj.has('access') && mutableObj.has('serverModel')) {
    mutableObj.setIn(
      ["access", "mode", "create"],
      hasAccess(
        authenticationUI,
        mutableObj.getIn(["access", "create"]),
        mutableObj.get('acls')
      )
    );
    mutableObj.setIn(
      ["access", "mode", "read"],
      hasAccess(
        authenticationUI,
        mutableObj.getIn(["access", "read"]),
        mutableObj.get('acls')
      )
    );
    mutableObj.setIn(
      ["access", "mode", "update"],
      hasAccess(
        authenticationUI,
        mutableObj.getIn(["access", "update"]),
        mutableObj.get('acls')
      )
    );
    mutableObj.setIn(
      ["access", "mode", "delete"],
      hasAccess(
        authenticationUI,
        mutableObj.getIn(["access", "delete"]),
        mutableObj.get('acls')
      )
    );
    setAccessOnRecordTemplateFields(mutableObj, mutableObj.getIn(["access", "mode"]));
    setAccessOnEmbeddedModelFields(mutableObj, mutableObj.getIn(["access", "mode"]));
    setAccessOnRecords(mutableObj, mutableObj.getIn(["access", "mode"]));
  }
  return mutableObj;
}

export function setAccessOnRecordTemplateFields(mutableObj, access) {
  return mutableObj.set("recordTemplate", setAccessOnRecordFields(mutableObj.get("recordTemplate"), access));
}

export function setAccessOnEmbeddedModelFields(mutableObj, access) {
  var embeddedModels = mutableObj.get("embeddedModels");
  var nextEmbeddedModels;
  if (embeddedModels.size > 0) {
    nextEmbeddedModels = embeddedModels.withMutations(mutableEmbeddedModels => {
      embeddedModels.forEach((embeddedModel, idx) => {
        mutableEmbeddedModels.set(idx, setAccessOnRecordFields(embeddedModel, access));
      });
    });
    return mutableObj.set("embeddedModels", nextEmbeddedModels);
  }
  return mutableObj;
}

export function setAccessOnRecords(mutableObj, access) {
  var records = mutableObj.get("records");
  var nextRecords;
  if (!R.isNil(records) && records.size > 0) {
    nextRecords = records.withMutations(mutableRecords => {
      records.forEach((record, idx) => {
        mutableRecords.set(idx, setAccessOnRecordFields(record, access));
      });
    });
    return mutableObj.set("records", nextRecords);
  }
  return mutableObj;
}

export function setAccessOnRecordFields(recordTemplate, access) {
  return recordTemplate.withMutations(mutableFields => {
    recordTemplate.forEach((field, fieldName) => {
      mutableFields.set(fieldName, mutableFields.get(fieldName).withMutations(mutableField => {
          mutableField.set("access", access);
        })
      );
    });
  });
}

export function authoriseStoreActions(mutableObj, authenticationUI) {
  var actions, nextActions;
  if (mutableObj.has("actions")) {
    actions = mutableObj.get("actions");
    nextActions = actions.withMutations(mutableActions => {
      actions.forEach((action, actionName) => {
        mutableActions.set(actionName, mutableActions.get(actionName).withMutations(mutableAction => {
            if (mutableObj.has('noACL')) {
              mutableAction.set("authorised", true);
            } else if (mutableAction.has("authorisation")) {
              mutableAction.set(
                "authorised",
                hasAccess(
                  authenticationUI,
                  mutableAction.get('authorisation'),
                  mutableObj.get('acls')
                )
              );
            }
          })
        );
      });
    });
    return mutableObj.set("actions", nextActions);
  }
  return mutableObj;
}


/**
 * @param {Immutable} model - the model
 * @return {Immutable} - the model with the application route configuration updated with authorised flags
 */
export function authoriseRoutes(model) {
  return model.set('routes', authoriseRoutesDeep(
    model.getIn(["stores", "authenticationUI"]),
    model.get("routes")
  ));
}

/**
 * @param {Immutable} authenticationUI - sampled authenticationUI store
 * @param {Immutable} routes - the application routes configuration
 * @return {Array} - the application route configuration with authorised flags updated
 */
export function authoriseRoutesDeep(authenticationUI, routes) {
  return routes.withMutations(mutableRoutes => {
    routes.forEach((route, idx) => {
      mutableRoutes.set(idx, mutableRoutes.get(idx).withMutations(mutableRoute => {
          var childrenAuthorised = false, mutableRoutesRoutes;
          if (mutableRoute.has('routes')) {
            mutableRoutesRoutes = authoriseRoutesDeep(authenticationUI, mutableRoute.get("routes"));
            mutableRoute.set("routes", mutableRoutesRoutes);
            if (!mutableRoute.has('ignoreChildAuthorisations')) {
              childrenAuthorised = R.any(
                R.propEq('authorised', true),
                R.filter(R.propEq('hide', false), mutableRoutesRoutes.toJS())
              );
            }
          }
          authoriseRouteActions(mutableRoute, authenticationUI, childrenAuthorised);
        })
      );
    });
  });
}


export function authoriseRouteActions(mutableObj, authenticationUI, childrenAuthorised) {
  var routeAuthorised = true;
  if (mutableObj.has('authorisation')) {
    routeAuthorised = hasAccess(
        authenticationUI,
        mutableObj.get('authorisation'),
        mutableObj.get('acls')
      ) || childrenAuthorised;
  }
  return mutableObj.set("authorised", routeAuthorised);
}


/**
 * Use hasAccess for checking whether the user has the REQUIRED ACCESS (*=match only *).
 * Use containsAccess for checking whether the ACCESS matches any ACL (*=match all).
 * @param {Immutable} authenticationUI - sampled authenticationUI store
 * @param {Immutable} accessRequired - map specifying access requirement
 * @param {String} [accessRequired.model] - access required to model
 * @param {String} [accessRequired.property=*] - access required to model property
 * @param {String} [accessRequired.accessType=*] - access type ['READ', 'WRITE', 'EXECUTE', '*']
 * @param {Immutable} acls - access control list set to check access against
 * @return {Boolean} - is permitted
 */
export let hasAccess = memoizeShallow(function hasAccess(authenticationUI, accessRequired, acls) {
  var accessRequiredJS = accessRequired.toJS();
  var aclsJS = acls ? acls.toJS() : [];
  var userPrincipals = getUserPrincipals(authenticationUI);
  var isNotAllowedFindLastIndex = R.findLastIndex(acl => (
    //find first match from end - on basis that acls are ordered starting with most restrictive acl
    isACLMatch(
      userPrincipals,
      {
        'model': R.defaultTo('*', accessRequiredJS.model),
        'propertyMatchList': getPropertyMatchList(accessRequiredJS.property),
        'accessTypeMatchList': getAccessTypeMatchList(accessRequiredJS.accessType),
        'permission': 'DENY'
      },
      acl)
  ), aclsJS);
  var isAllowedFindLastIndex = R.findLastIndex(acl => (
    isACLMatch(
      userPrincipals,
      {
        'model': R.defaultTo('*', accessRequiredJS.model),
        'propertyMatchList': getPropertyMatchList(accessRequiredJS.property),
        'accessTypeMatchList': getAccessTypeMatchList(accessRequiredJS.accessType),
        'permission': 'ALLOW'
      },
      acl)
  ), aclsJS);
  return isAllowedFindLastIndex > -1 && isAllowedFindLastIndex >= isNotAllowedFindLastIndex;
}, 10);


/**
 * @param {Object} userPrincipals - user principals
 * @param {String} userPrincipals.userId - user id
 * @param {Array} userPrincipals.roles - user role principalIds
 * @param {Object} accessRequired - map specifying access requirement
 * @param {String} [accessRequired.model] - access required to model
 * @param {String} [accessRequired.property=*] - access required to model property
 * @param {String} [accessRequired.accessType=*] - access type ['READ', 'WRITE', 'EXECUTE', '*']
 * @param {String} [accessRequired.modelOwnerUserId=*] - model owner
 * @param {Array} acl - access control list to check access against
 * @return {Boolean} - is permitted
 */
export function isACLMatch(userPrincipals, accessRequired, acl) {
  ///acl entry = model + model-property + accessType + principalType + permission
  return (
    permittedProperty(accessRequired, acl) &&
    permittedAccessType(accessRequired, acl) &&
    permittedPrincipleType(userPrincipals, accessRequired, acl) &&
    permittedPermission(accessRequired, acl)
  );
}

export function permittedProperty(accessRequired, acl) {
  return R.contains(R.defaultTo('*', acl.property), accessRequired.propertyMatchList);
}

export function permittedAccessType(accessRequired, acl) {
  return R.contains(R.defaultTo('*', acl.accessType), accessRequired.accessTypeMatchList);
}

export function permittedPrincipleType(userPrincipals, accessRequired, acl) {
  if (acl.principalType === 'ROLE' && acl.principalId !== '$owner') {
    return R.contains(acl.principalId, userPrincipals.roles);
  } else if (acl.principalType === 'ROLE' && acl.principalId === '$owner') {
    return userPrincipals.userId !== "";
  } else if (acl.principalType === 'USER') {
    return acl.principalId !== userPrincipals.userId;
  }
  return true;
}

export function permittedPermission(accessRequired, acl) {
  return R.defaultTo('ALLOW', acl.permission) === accessRequired.permission;
}


export function getPropertyMatchList(property) {
  //note the returned match list is for matching against an applicable acl.property
  //e.g. property = '*' can only match to acl.accessType = '*'
  //e.g. property = 'login' can match to acl.accessType = ['*', 'login']
  switch (R.defaultTo('*', property)) {
    case '*':
      return ['*'];
    default:
      return ['*', property];
  }
}


export function getAccessTypeMatchList(accessType) {
  //note the returned match list is for matching against an applicable acl.accessType
  //e.g. requiredAccessType = '*' can only match to acl.accessType = '*'
  //e.g. requiredAccessType = 'READ' can match to any acl.accessType = ['*', 'EXECUTE', 'WRITE', 'READ']
  switch (accessType) {
    case '*':
      return ['*'];
    case 'EXECUTE':
      return ['*', 'EXECUTE'];
    case 'WRITE':
      return ['*', 'EXECUTE', 'WRITE'];
    default:
      return ['*', 'EXECUTE', 'WRITE', 'READ'];
  }
}


/**
 * @param {Immutable} authenticationUI - sampled authenticationUI store
 * @return {Object} - user principals {userId: user id, roles: role principal types}
 */
export let getUserPrincipals = memoizeShallow(function getUserPrincipals(authenticationUI) {
  var props = authenticationUI.get('props').toJS();
  var roleMatrix = authenticationUI.get('roleMatrix').toJS();
  var savedSettings = authenticationUI.get('savedSettings').toJS();
  var activeAccountType = savedSettings.activeAccountType;
  var rolePrincipalTypes = [];
  var isAdmin = props.user.id === 1 || props.user.id === "1";
  var isDVSVerified = props.user.dvsVerified === true;
  var activeAccount;
  rolePrincipalTypes.push('$everyone');
  if (isDVSVerified) {
    rolePrincipalTypes.push('$dvsVerified');
  }
  if (isAdmin) {
    rolePrincipalTypes.push('admin');
  }
  if (props.authenticated) {
    rolePrincipalTypes.push('$authenticated');
    rolePrincipalTypes.push('customerAuthenticatedCreator');
  }
  if (!props.authenticated) {
    rolePrincipalTypes.push('$unauthenticated');
  }
  if (activeAccountType === "customer" && props.customerAccounts.length > 0) {
    activeAccount = R.find(
      R.pathEq(['customerAccount', 'id'], savedSettings.activeCustomerAccount),
      props.customerAccounts
    );
    if (activeAccount) {
      rolePrincipalTypes = getAccountAndServicePrincipals(
        activeAccount,
        'customer',
        rolePrincipalTypes,
        roleMatrix
      );
    }
  }
  if (activeAccountType === "partner" && props.partnerAccounts.length > 0) {
    activeAccount = R.find(
      R.pathEq(['partnerAccount', 'id'], savedSettings.activePartnerAccount),
      props.partnerAccounts
    );
    if (activeAccount) {
      rolePrincipalTypes = getAccountAndServicePrincipals(
        activeAccount,
        'partner',
        rolePrincipalTypes,
        roleMatrix
      );
      if (R.contains(savedSettings.activePartnerAccount, [220, 4, 3, 378, 478, 190])) {
        rolePrincipalTypes.push('RoadAuthority');
      }
    }
  }
  if (activeAccountType === "operations" && props.operationsAccounts.length > 0) {
    activeAccount = R.find(
      R.pathEq(['operationsAccount', 'id'], savedSettings.activeOperationsAccount),
      props.operationsAccounts
    );
    if (activeAccount) {
      //for operations this also adds impersonation principals
      rolePrincipalTypes = getAccountAndServicePrincipals(
        activeAccount,
        'operations',
        rolePrincipalTypes,
        roleMatrix
      );
      rolePrincipalTypes.push('RoadAuthority');
    }
  }
  if (activeAccountType === "contractor" && props.contractorAccounts.length > 0) {
    activeAccount = R.find(
      R.pathEq(['contractorAccount', 'id'], savedSettings.activeContractorAccount),
      props.contractorAccounts
    );
    if (activeAccount) {
      rolePrincipalTypes = getAccountAndServicePrincipals(
        activeAccount,
        'contractor',
        rolePrincipalTypes,
        roleMatrix
      );
    }
  }
  return {
    "userId": R.defaultTo("", props.user.id),
    "roles": rolePrincipalTypes
  };
});
