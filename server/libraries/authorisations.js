"use strict";
const R = require('ramda');

const authorisations = {
  /**
   * @param {Object} accountUserMapping - the accountUserMapping
   * @param {String} accountType - the account type ('customer, 'partner', 'contractor', 'operations')
   * @param {Array} rolePrincipalTypes - current set of role principals
   * @param {Array} roleMatrix - the role matrix
   * @return {Array} - account based principals
   */
  "getAccountAndServicePrincipals": function getAccountAndServicePrincipals(
    accountUserMapping, accountType, rolePrincipalTypes, roleMatrix
  ){
    if (!accountUserMapping.userActivated || !accountUserMapping.accountActivated) {
      return rolePrincipalTypes;
    }
    if (R.path([accountType, accountUserMapping.role], roleMatrix)) {
      //Add service based principals
      rolePrincipalTypes = R.concat(
        rolePrincipalTypes,
        roleMatrix.__services.Registration[accountType][R.defaultTo("Disabled", accountUserMapping.roleRegistration)]);
      rolePrincipalTypes = R.concat(
        rolePrincipalTypes,
        roleMatrix.__services.Access[accountType][R.defaultTo("Disabled", accountUserMapping.roleAccess)]);
      rolePrincipalTypes = R.concat(
        rolePrincipalTypes,
        roleMatrix.__services
          .Accreditation[accountType][R.defaultTo("Disabled", accountUserMapping.roleAccreditation)]);
      rolePrincipalTypes = R.concat(
        rolePrincipalTypes,
        roleMatrix.__services.Vehicle[accountType][R.defaultTo("Disabled", accountUserMapping.roleVehicle)]);
      rolePrincipalTypes = R.concat(
        rolePrincipalTypes,
        roleMatrix.__services.PBS[accountType][R.defaultTo("Disabled", accountUserMapping.rolePBS)]);
      //Add impersonation roles
      if (accountType === "operations") {
        //Add service based principals
        rolePrincipalTypes = R.concat(
          rolePrincipalTypes,
          roleMatrix.__services.Registration.customer[R.defaultTo("Disabled", accountUserMapping.roleRegistration)]);
        rolePrincipalTypes = R.concat(
          rolePrincipalTypes,
          roleMatrix.__services.Access.customer[R.defaultTo("Disabled", accountUserMapping.roleAccess)]);
        rolePrincipalTypes = R.concat(
          rolePrincipalTypes,
          roleMatrix.__services
            .Accreditation.customer[R.defaultTo("Disabled", accountUserMapping.roleAccreditation)]);
        rolePrincipalTypes = R.concat(
          rolePrincipalTypes,
          roleMatrix.__services.Vehicle.customer[R.defaultTo("Disabled", accountUserMapping.roleVehicle)]);
        rolePrincipalTypes = R.concat(
          rolePrincipalTypes,
          roleMatrix.__services.PBS.customer[R.defaultTo("Disabled", accountUserMapping.rolePBS)]);
        rolePrincipalTypes = R.concat(
          rolePrincipalTypes,
          roleMatrix.__services.Registration.partner[R.defaultTo("Disabled", accountUserMapping.roleRegistration)]);
        rolePrincipalTypes = R.concat(
          rolePrincipalTypes,
          roleMatrix.__services.Access.partner[R.defaultTo("Disabled", accountUserMapping.roleAccess)]);
        rolePrincipalTypes = R.concat(
          rolePrincipalTypes,
          roleMatrix.__services
            .Accreditation.partner[R.defaultTo("Disabled", accountUserMapping.roleAccreditation)]);
        rolePrincipalTypes = R.concat(
          rolePrincipalTypes,
          roleMatrix.__services.Vehicle.partner[R.defaultTo("Disabled", accountUserMapping.roleVehicle)]);
        rolePrincipalTypes = R.concat(
          rolePrincipalTypes,
          roleMatrix.__services.PBS.partner[R.defaultTo("Disabled", accountUserMapping.rolePBS)]);
      }
      //Add account level roles
      rolePrincipalTypes = R.concat(rolePrincipalTypes, roleMatrix[accountType][accountUserMapping.role]);
      //return security roles matched to the account and role combination in roleMatrix
      return rolePrincipalTypes;
    }
    return rolePrincipalTypes;
  },
  /**
   * @param {String} accountType - the account type ('customer, 'partner', 'contractor', 'operations')
   * @param {String} accountPrincipal - an account principal
   * @param {Array} roleMatrix - the role matrix
   * @return {Array} - role based principals
   */
  "getAccountRoleFromPrincipal": function getAccountRoleFromPrincipal(accountType, accountPrincipal, roleMatrix) {
    return R.pipe(
      R.toPairs,
      R.filter(function filterByRolePrincipal(roleAccountPrincipalsPair) {
        const accountPrincipals = roleAccountPrincipalsPair[1];
        return R.contains(accountPrincipal, accountPrincipals);
      }),
      R.map(function getRolePrincipal(roleAccountPrincipalsPair) {
        return roleAccountPrincipalsPair[0];
      })
    )(roleMatrix[accountType]);
  },
  "getServiceRoleFromPrincipal": function getServiceRoleFromPrincipal(accountType, rolePrincipal, service, roleMatrix) {
    return R.pipe(
      R.toPairs,
      R.filter(function filterByServiceRolePrincipal(serviceRolePrincipalsPair) {
        const servicePrincipals = serviceRolePrincipalsPair[1];
        return R.contains(rolePrincipal, servicePrincipals);
      }),
      R.map(function getRolePrincipal(serviceRolePrincipalsPair) {
        return serviceRolePrincipalsPair[0];
      })
    )(roleMatrix.__services[service][accountType]);
  },
  "getPrincipals": function getPrincipals(accountType, role, roleMatrix) {
    return roleMatrix[accountType][role];
  },
  "getAllPrincipals": function getPrincipals(accountType, roleMatrix) {
    return authorisations.getPrincipals(accountType, "System Administrator", roleMatrix);
  },
  "getPrincipalsByService": function getPrincipalsByService(accountType, role, service, roleMatrix) {
    return roleMatrix.__services[service][accountType][role];
  },
  "getAllPrincipalsByService": function getAllPrincipalsByService(accountType, service, roleMatrix) {
    return authorisations.getPrincipalsByService(accountType, "Service Administrator", service, roleMatrix);
  }
};

module.exports = authorisations;
