import R from 'ramda';
import {isImmutable} from '../utils';


function getAccountsHelper(authenticationUIProps, accountType, accountId) {
  const plural = accountType + "s";
  const accountsIM = authenticationUIProps.get(plural);
  return R.filter(
    (account) => {
      if (!R.isNil(accountId)) {
        return account[accountType + "Id"] === accountId
      }
      return true;
    },
    !R.isNil(accountsIM) ? accountsIM.toJS() : []
  );
}
/**
 * Checks if the user has an activated role for a given account type.
 * @param {Object} authenticationUIProps - authentication store props
 * @param {String} role - role e.g. "Administrator"
 * @param {String} accountType - account type of account, i.e. "contractAccount", "customerAccount",
 *   "operationsAccount", "partnerAccount"
 * @returns {Boolean} if the user has an activated role for the account type
 */
export function userHasRole(authenticationUIProps, role, accountType, accountId) {
  const accounts = getAccountsHelper(authenticationUIProps, accountType, accountId);
  let roles = [role];
  if (accountType === "operationsAccount") {
    switch (role) {
      case "Administrator (financial)":
        roles = [
          "System Administrator",
          "Administrator (financial)"
        ];
        break;
      case "Administrator":
        roles = [
          "System Administrator",
          "Administrator (financial)",
          "Administrator"
        ];
        break;
    }
  }
  switch (role) {
    case "User (supervisor)":
      roles = [
        "System Administrator",
        "Administrator (financial)",
        "Administrator",
        "User (supervisor)"
      ];
      break;
    case "User (submitter)":
      roles = [
        "System Administrator",
        "Administrator (financial)",
        "Administrator",
        "User (supervisor)",
        "User (submitter)"
      ];
      break;
    case "User (general)":
      roles = [
        "System Administrator",
        "Administrator (financial)",
        "Administrator",
        "User (supervisor)",
        "User (submitter)",
        "User (general)"
      ];
      break;
    case "User (read only)":
      roles = [
        "System Administrator",
        "Administrator (financial)",
        "Administrator",
        "User (supervisor)",
        "User (submitter)",
        "User (general)",
        "User (read only)"
      ];
      break;
  }

  return R.findIndex(
    account => (account.accountActivated && account.userActivated && R.contains(account.role, roles)),
    accounts
  ) > -1;
}

export function userHasServiceRole(authenticationUIProps, service, serviceRole, accountType, accountId) {
  const accounts = getAccountsHelper(authenticationUIProps, accountType, accountId);
  let serviceRoles = [serviceRole];
  switch (serviceRole) {
    case "User (supervisor)":
      serviceRoles = [
        "Service Administrator",
        "User (supervisor)"
      ];
      break;
    case "User (submitter)":
      serviceRoles = [
        "Service Administrator",
        "User (supervisor)",
        "User (submitter)"
      ];
      break;
    case "User (general)":
      serviceRoles = [
        "Service Administrator",
        "User (supervisor)",
        "User (submitter)",
        "User (general)"
      ];
      break;
    case "User (read only)":
    case "Enabled":
      serviceRoles = [
        "Service Administrator",
        "User (supervisor)",
        "User (submitter)",
        "User (general)",
        "User (read only)",
        "Enabled"
      ];
      break;
  }
  return R.findIndex(
    account => (account.accountActivated && account.userActivated
      && R.contains(account["role" + service], serviceRoles)),
    accounts
  ) > -1;
}

export function userHasServiceRoleLoggedInAccount(authenticationUI, service, serviceRole) {
  const accountType = getLoggedInAccountTypeAndIdFromAuthenticationUI(authenticationUI).accountType;
  const accountId = getLoggedInAccountTypeAndIdFromAuthenticationUI(authenticationUI).accountId;
  const authenticationUIProps = authenticationUI.get("props");
  return userHasServiceRole(authenticationUIProps, service, serviceRole, accountType + "Account", accountId);
}

export function userHasServiceRoleLoggedInAccountOrOperations(authenticationUI, service, serviceRole) {
  const authenticationUIProps = authenticationUI.get("props");
  if (!userHasServiceRoleLoggedInAccount(authenticationUI, service, serviceRole)) {
    return userHasServiceRole(authenticationUIProps, service, serviceRole, "operationsAccount");
  }
  return true;
}

export function isRoadAuthorityLoggedInAccount(authenticationUI) {
  const accountType = getLoggedInAccountTypeAndIdFromAuthenticationUI(authenticationUI).accountType;
  const accountId = getLoggedInAccountTypeAndIdFromAuthenticationUI(authenticationUI).accountId;
  return accountType === "partner" && R.contains(accountId, [220, 4, 3, 378, 478, 190]);
}

export function userHasServiceRoleCurrentAccountOrOperations(model, service, serviceRole) {
  const accountType = getCurrentAccountTypeAndId(model).accountType;
  const accountId = getCurrentAccountTypeAndId(model).accountId;
  const authenticationUIProps = model.getIn(["stores", "authenticationUI", "props"]);
  if (!userHasServiceRole(authenticationUIProps, service, serviceRole, accountType + "Account", accountId)) {
    return userHasServiceRole(authenticationUIProps, service, serviceRole, "operationsAccount");
  }
  return true;
}

export function userHasRoleCurrentAccountOrServiceRole(model, role, service, serviceRole, serviceAccountType) {
  const authenticationUIProps = model.getIn(["stores", "authenticationUI", "props"]);
  return userHasRoleCurrentAccount(model, role)
    || userHasServiceRole(authenticationUIProps, service, serviceRole, serviceAccountType);
}

export function userHasRoleAndOperations(authenticationUIProps, role, accountType) {
  if (accountType !== "operationsAccount") {
    if (!userHasRole(authenticationUIProps, role, accountType)) {
      return userHasRole(authenticationUIProps, role, "operationsAccount");
    }
    return true;
  }
  return userHasRole(authenticationUIProps, role, "operationsAccount");
}

export function userHasRoleCurrentAccountOrOperations(model, role) {
  const accountType = getCurrentAccountTypeAndId(model).accountType;
  const accountId = getCurrentAccountTypeAndId(model).accountId;
  const authenticationUIProps = model.getIn(["stores", "authenticationUI", "props"]);
  if (!userHasRole(authenticationUIProps, role, accountType + "Account", accountId)) {
    return userHasRole(authenticationUIProps, role, "operationsAccount");
  }
  return true;
}

export function userHasRoleCurrentAccount(model, role) {
  const accountType = getCurrentAccountTypeAndId(model).accountType;
  const accountId = getCurrentAccountTypeAndId(model).accountId;
  const authenticationUIProps = model.getIn(["stores", "authenticationUI", "props"]);
  return userHasRole(authenticationUIProps, role, accountType + "Account", accountId);
}

/**
 * Checks if the user actively belongs to an account type.
 * @param {Immutable} authenticationUIProps - authentication store props
 * @param {String} accountType - account type of account, i.e. "contractAccount", "customerAccount",
 *   "operationsAccount", "partnerAccount"
 * @returns {Boolean} if the user has the role for the account
 */
export function userBelongsToAccountType(authenticationUIProps, accountType) {
  const plural = accountType + "s";
  const accounts = R.defaultTo([], authenticationUIProps.get(plural));
  return accounts.findIndex(
    account => (account.get('accountActivated') && account.get('userActivated'))
  ) > -1;
}

export function userBelongsToAnyAccountType(authenticationUIProps) {
  return userBelongsToAccountType(authenticationUIProps, "operationsAccount")
    || userBelongsToAccountType(authenticationUIProps, "partnerAccount")
    || userBelongsToAccountType(authenticationUIProps, "customerAccount");
}

export function getLoggedInAccountTypeAndId(model) {
  return getLoggedInAccountTypeAndIdFromAuthenticationUI(model.getIn(["stores", "authenticationUI"]));
}
export function getLoggedInAccountTypeAndIdFromAuthenticationUI(authenticationUI) {
  //determine if authenticated
  const accessToken = authenticationUI.getIn(["props", "access_token", "id"]);
  //determine if authenticated
  if (R.isNil(accessToken) || accessToken.length === 0) {
    return {
      "accountId": 0,
      "accountType": ""
    };
  }
  const activeAccountType = authenticationUI.getIn(["savedSettings", "activeAccountType"]);
  if (activeAccountType === "customer") {
    return {
      "accountId": authenticationUI.getIn(["savedSettings", "activeCustomerAccount"]),
      "accountType": activeAccountType
    };
  }
  if (activeAccountType === "partner") {
    return {
      "accountId": authenticationUI.getIn(["savedSettings", "activePartnerAccount"]),
      "accountType": activeAccountType
    };
  }
  return {
    "accountId": authenticationUI.getIn(["savedSettings", "activeOperationsAccount"]),
    "accountType": activeAccountType
  };
}

export function getCurrentAccountTypeAndId(model) {
  //determine if authenticated
  const accessToken = model.getIn(["stores", "authenticationUI", "props", "access_token", "id"]);
  //determine if authenticated
  if (R.isNil(accessToken) || accessToken.length === 0) {
    return {
      "accountId": 0,
      "accountType": ""
    };
  }
  const activeAccountType = model.getIn(["stores", "authenticationUI", "savedSettings", "activeAccountType"]);
  if (activeAccountType === "customer") {
    return {
      "accountId": model.getIn(["stores", "authenticationUI", "savedSettings", "activeCustomerAccount"]),
      "accountType": activeAccountType
    };
  }
  if (activeAccountType === "partner") {
    return {
      "accountId": model.getIn(["stores", "authenticationUI", "savedSettings", "activePartnerAccount"]),
      "accountType": activeAccountType
    };
  }
  if (activeAccountType !== "operations") {
    return {
      "accountId": 0,
      "accountType": ""
    };
  }
  //operations
  //get router pageLabels to determine accountType of current page
  const pageLabels = model.getIn(["stores", "routerUI", "props", "pageLabels"]);
  if (R.isNil(pageLabels)
    || pageLabels.size < 3
    || pageLabels.get(0) !== "regulator"
    || !(
      R.contains(pageLabels.get(1), ["customer", "partner"])
      || R.contains(pageLabels.get(4), [
        "manage_customer_account", "manage_partner_account", "manage_regulator_account"
      ])
    )) {
    return {
      "accountId": model.getIn(["stores", "authenticationUI", "savedSettings", "activeOperationsAccount"]),
      "accountType": activeAccountType
    };
  }
  if (pageLabels.get(4) === "manage_regulator_account") {
    return {
      "accountId": model.getIn(["stores", "operationsAccountUI-upsert", "props", "id"]),
      "accountType": "operations"
    };
  }
  if (pageLabels.get(1) === "customer" || pageLabels.get(4) === "manage_customer_account") {
    return {
      "accountId": model.getIn(["stores", "customerAccountUI-upsert", "props", "id"]),
      "accountType": "customer"
    };
  }
  //partner
  return {
    "accountId": model.getIn(["stores", "partnerAccountUI-upsert", "props", "id"]),
    "accountType": "partner"
  };
}

export function getCurrentAccountId(accountType, authenticationUI, partnerAccountUIUpsert, customerAccountUIUpsert) {
  //determine if authenticated
  const accessToken = authenticationUI.getIn(["props", "access_token", "id"]);
  //determine if authenticated
  if (R.isNil(accessToken) || accessToken.length === 0) {
    return 0;
  }
  const activeAccountType = authenticationUI.getIn(["savedSettings", "activeAccountType"]);
  if (activeAccountType === "customer") {
    return authenticationUI.getIn(["savedSettings", "activeCustomerAccount"]);
  }
  if (activeAccountType === "partner") {
    return authenticationUI.getIn(["savedSettings", "activePartnerAccount"]);
  }
  if (activeAccountType !== "operations") {
    return 0;
  }
  //operations
  if (!R.contains(accountType, ["customer", "partner"])) {
    return authenticationUI.getIn(["savedSettings", "activeOperationsAccount"]);
  }
  if (accountType === "partner" && !R.isNil(partnerAccountUIUpsert)) {
    return partnerAccountUIUpsert.getIn(["props", "id"]);
  }
  if (accountType === "customer" && !R.isNil(customerAccountUIUpsert)) {
    return customerAccountUIUpsert.getIn(["props", "id"]);
  }
  return 0;
}

export function getCurrentAccountTypeAndIdAndAccount(model) {
  const currentAccountTypeAndId = getCurrentAccountTypeAndId(model);
  const activeAccountType = currentAccountTypeAndId.accountType;
  const activeAccountId = currentAccountTypeAndId.accountId;
  const accountMappings = model.getIn(["stores", "authenticationUI", "props", activeAccountType + "Accounts"]);
  if (!R.isNil(accountMappings)) {
    const accountMapping = accountMappings.find(
      (_accountMapping) => {
        return _accountMapping.get(activeAccountType + "AccountId") === activeAccountId;
      }
    );
    if (!R.isNil(accountMapping) && !R.isNil(accountMapping.get(activeAccountType + "Account"))) {
      const account = accountMapping.get(activeAccountType + "Account").toJS();
      return R.merge(currentAccountTypeAndId, {
        "account": account,
        "name": account.name,
        "ABN": account.ABN
      });
    }
  }
  const operationsAccountUIUpsert = model.getIn(["stores", "operationsAccountUI-upsert"]);
  const partnerAccountUIUpsert = model.getIn(["stores", "partnerAccountUI-upsert"]);
  const customerAccountUIUpsert = model.getIn(["stores", "customerAccountUI-upsert"]);
  if (activeAccountType === "operations" && !R.isNil(operationsAccountUIUpsert)) {
    const account = R.defaultTo({}, operationsAccountUIUpsert.getIn(["props", "record"]));
    return R.merge(currentAccountTypeAndId, {
      "account": account,
      "name": account.name,
      "ABN": account.ABN
    });
  }
  if (activeAccountType === "partner" && !R.isNil(partnerAccountUIUpsert)) {
    const account = R.defaultTo({}, partnerAccountUIUpsert.getIn(["props", "record"]));
    return R.merge(currentAccountTypeAndId, {
      "account": account,
      "name": account.name,
      "ABN": account.ABN
    });
  }
  if (activeAccountType === "customer" && !R.isNil(customerAccountUIUpsert)) {
    const account = R.defaultTo({}, customerAccountUIUpsert.getIn(["props", "record"]));
    return R.merge(currentAccountTypeAndId, {
      "account": account,
      "name": account.name,
      "ABN": account.ABN
    });
  }
  return currentAccountTypeAndId;
}

export function getCurrentAccountLegalRepresentatives(model) {
  let legalRepresentatives = [];
  const currentAccount = getCurrentAccountTypeAndIdAndAccount(model).account;
  if (R.isNil(currentAccount)) {
    return legalRepresentatives;
  }
  if (!R.isNil(currentAccount.legalRepresentative)) {
    legalRepresentatives.push(currentAccount.legalRepresentative);
  }
  if (!R.isNil(currentAccount.secondaryLegalRepresentative)) {
    legalRepresentatives.push(currentAccount.secondaryLegalRepresentative);
  }
  return legalRepresentatives;
}

export function currentUserIsLegalRepresentative(model) {
  return R.contains(getUserId(model), getCurrentAccountLegalRepresentatives(model));
}

export function getAccountTypeLabel(accountType, lowerCase) {
  let label;
  switch (accountType) {
    case "operations":
      label = "Regulator Account";
      break;
    case "partner":
      label = "Partner Account";
      break;
    case "customer":
      label = "Customer Account";
      break;
    default:
      label = ""
      break;
  }
  if (lowerCase) {
    return label.toLowerCase();
  }
  return label;
}

export function getAccountTypeLabelPrefix(accountType, lowerCase) {
  let label;
  switch (accountType) {
    case "operations":
      label = "Regulator";
      break;
    case "partner":
      label = "Road Manager";
      break;
    case "customer":
      label = "Customer";
      break;
    default:
      label = ""
      break;
  }
  if (lowerCase) {
    return label.toLowerCase();
  }
  return label;
}

export function getAccountNumberField(accountType) {
  switch (accountType) {
    case "operations":
      return "RRN";
    case "partner":
      return "RPN";
    case "customer":
      return "RCN";
    default:
      return "RCN"
  }
}

export function getAccountNumber(accountRecord, accountType) {
  const accountNumberField = getAccountNumberField(accountType);
  if (isImmutable(accountRecord)) {
    return accountRecord.getIn([accountNumberField, 'value']);
  }
  return accountRecord[accountNumberField];
}


export function getAccessTokenId(model) {
  return model.getIn(["stores", "authenticationUI", "props", "access_token", "id"]);
}

export function getUserId(model) {
  return model.getIn(["stores", "authenticationUI", "props", "access_token", "userId"]);
}

export function getUser(model, fields) {
  const user = model.getIn(["stores", "authenticationUI", "props", "user"]);
  if (!R.isNil(fields) && !R.isNil(user)) {
    return R.pick(fields, user.toJS());
  }
  return user;
}

export function getServiceUIName(service) {
  const serviceId = R.defaultTo("", service);
  if (serviceId.indexOf("vehicleStandard") > -1) {
    return "Vehicle Standards";
  }
  if (serviceId.indexOf("accreditation") > -1) {
    return "Acceditation";
  }
  if (serviceId.indexOf("permit") > -1) {
    return "Access";
  }
  return "Portal";
}

export function getServiceRoleName(service) {
  const serviceId = R.defaultTo("", service);
  if (serviceId.indexOf("vehicleStandard") > -1) {
    return "Vehicle";
  }
  if (serviceId.indexOf("accreditation") > -1) {
    return "Accreditation";
  }
  if (serviceId.indexOf("permit") > -1) {
    return "Access";
  }
  return "";
}
