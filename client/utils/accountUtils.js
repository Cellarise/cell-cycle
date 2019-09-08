import R from 'ramda';


export function getAccountFlagRecords(flagValues, accountDataSets) {
  let accountRecord, accountFlags;
  if (!R.isNil(accountDataSets)) {
    if (!R.isNil(accountDataSets.OperationsAccount) && accountDataSets.OperationsAccount.length > 0) {
      accountRecord = accountDataSets.OperationsAccount;
    }
    if (!R.isNil(accountDataSets.CustomerAccount) && accountDataSets.CustomerAccount.length > 0) {
      accountRecord = accountDataSets.CustomerAccount;
    }
    if (!R.isNil(accountDataSets.PartnerAccount) && accountDataSets.PartnerAccount.length > 0) {
      accountRecord = accountDataSets.PartnerAccount;
    }
  }
  if (R.isNil(accountRecord[0].flags) || accountRecord[0].flags.length === 0) {
    return R.map(
      (flagValue) => {
        return {
          "id": flagValue,
          "name": flagValue
        }
      },
      flagValues
    );
  }
  accountFlags = accountRecord[0].flags;
  return R.map(
    (flagValue) => {
      const accountFlag = R.find(R.propEq('flag', flagValue), accountFlags);
      return {
        "id": flagValue,
        "name": R.isNil(accountFlag) || R.isNil(accountFlag.name) ? flagValue : accountFlag.name
      }
    },
    flagValues
  );
}

export function getWorkgroupRecords(accountDataSets) {
  let accountRecord;
  if (!R.isNil(accountDataSets)) {
    if (!R.isNil(accountDataSets.OperationsAccount) && accountDataSets.OperationsAccount.length > 0) {
      accountRecord = accountDataSets.OperationsAccount;
    }
    if (!R.isNil(accountDataSets.CustomerAccount) && accountDataSets.CustomerAccount.length > 0) {
      accountRecord = accountDataSets.CustomerAccount;
    }
    if (!R.isNil(accountDataSets.PartnerAccount) && accountDataSets.PartnerAccount.length > 0) {
      accountRecord = accountDataSets.PartnerAccount;
    }
  }
  if (R.isNil(accountRecord) || R.isNil(accountRecord[0].workGroups) || accountRecord[0].workGroups.length === 0) {
    return [];
  }
  return R.map(
    (workgroup) => {
      return {
        "id": workgroup.name,
        "name": workgroup.name
      }
    },
    accountRecord[0].workGroups
  );
}
