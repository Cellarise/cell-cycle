"use strict";
const R = require('ramda');
const config = require('../../../../server/config.local');

/*
 * Returns the original filename from a dropzone saved file.
 * For older format saved fileLists the originalFilename is not available. For these files the modelId is required.
 * However, the modelId is the record id which assumes the file is directly attached to the current record.
 * This prevents referencing files from any other record (in the case of copying fileLists to another record).
 */
function toFilename(prefix, file, modelId) {
  let _fileName = file.name;
  let _origFileName = file.originalFilename;
  if (!R.isNil(_origFileName)) {
    return _origFileName;
  }
  if (prefix && (prefix + "").length > 0) {
    _fileName = R.slice((prefix + "").length, _fileName.length, _fileName);
  }
  if (modelId && (modelId + "").length > 0) {
    _fileName = R.slice((modelId + "").length, _fileName.length, _fileName);
  }
  return _fileName;
}

//@todo deprecate and remove use of this legacy function
function getDownloadUrl(serverModelName, accessTokenId, modelId, prefix, accountIdField, accountId) {
  let accountType;
  if (accountIdField === "customerAccountId") {
    accountType = "customer";
  } else if (accountIdField === "partnerAccountId") {
    accountType = "partner";
  } else if (accountIdField === "operationsAccountId") {
    accountType = "operations";
  }
  if (R.isNil(modelId)) {
    return getApiUrl(serverModelName, "download", [], accessTokenId);
  }
  return getApiUrl(
    serverModelName,
    "download",
    [
      "id=" + modelId,
      "prefix=" + prefix,
      "accountId=" + accountId,
      accountIdField + "=" + accountId
    ],
    accessTokenId,
    accountType,
    accountId
  );
}

function getApiUrl(serverModelName, method, queryArr, accessTokenId, accountType, accountId) {
  let _queryArr = R.defaultTo([], queryArr);
  if (!R.isNil(accountType) && !R.isNil(accountId)) {
    _queryArr.push("accountType=" + accountType);
    _queryArr.push("accountId=" + accountId);
    if (accountType === "customer") {
      _queryArr.push("customerAccountId=" + accountId);
    } else if (accountType === "partner") {
      _queryArr.push("partnerAccountId=" + accountId);
    } else if (accountType === "operations") {
      _queryArr.push("operationsAccountId=" + accountId);
    }
  }
  if (!R.isNil(accessTokenId)) {
    _queryArr.push("access_token=" + accessTokenId);
  }
  _queryArr = R.uniq(_queryArr);
  return config.externalURL.emailUrl + "/api/" + serverModelName + "s/" + method + "?" + R.join("&", _queryArr);
}



module.exports = {
  "toFilename": toFilename,
  "getDownloadUrl": getDownloadUrl
};
