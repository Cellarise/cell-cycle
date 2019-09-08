import React from "react"; //eslint-disable-line no-unused-vars
import R from "ramda";
import classnames from 'classnames';
import {getAccessTokenId, getCurrentAccountTypeAndId} from './authHelpers';
import {
  removeApiServer, connectors,
  nhvrLogoUrl, nhvrLogoUrlLogin, nhvrLogoUrlForm, nhvrLogoUrlCustomer, nhvrLogoUrlOperations, nhvrLogoUrlPartner
}
from "../globals";
import {sanitise} from '../utils';

const ALLOWED_CHARS_WHITELIST = "[^A-Za-z0-9\\s_.\\(\\)\\-\\[\\]]+";
const WhiteListRegex = new RegExp(ALLOWED_CHARS_WHITELIST, "gi");


export function cleanFileName(fileName) {
  const lowercaseFilenameExt = fileName.toLowerCase().split(".").pop();
  return R.defaultTo("file.txt", fileName
    .replace(WhiteListRegex, "")
    .replace(/\s/g, "_")
    .replace(/\.\w+$/i, "." + lowercaseFilenameExt));
}

export function getLogo(authenticationUI) {
  const activeAccountType = R.defaultTo("", authenticationUI.getIn(['savedSettings', 'activeAccountType']));
  if (authenticationUI.getIn(['props', 'access_token', 'secureTokenFlag']) === true) {
    return (
      <img alt="NHVR Portal - Forms Logo"
           src={nhvrLogoUrlForm}/>
    );
  }
  if (authenticationUI.getIn(['props', 'user', 'id']) === "") {
    return (
      <img alt="NHVR Portal Logo"
           src={nhvrLogoUrlLogin}/>
    );
  }

  return getLogoFromAccountType(activeAccountType);
}

export function getLogoFromAccountType(activeAccountType, className = "") {
  if (activeAccountType === "customer") {
    return (
      <img alt="NHVR Portal - Customer Module Logo" className={className}
           src={nhvrLogoUrlCustomer}/>
    );
  } else if (activeAccountType === "partner") {
    return (
      <img alt="NHVR Portal - Road Manager Module Logo" className={className}
           src={nhvrLogoUrlPartner}/>
    );
  } else if (activeAccountType === "operations") {
    return (
      <img alt="NHVR Portal - Regulator Module Logo" className={className}
           src={nhvrLogoUrlOperations}/>
    );
  }
  return (
    <img alt="NHVR Logo" className={className}
         src={nhvrLogoUrl}/>
  );
}

export function getUserProfilePictureUrl(fileList) {
  return R.is(Array, fileList) && fileList.length > 0
    ? connectors.remoteStorage.server + "/" + fileList[0].container + "/" + fileList[0].name
    : connectors.remoteStorage.server + "/policies/" + "defaultUser.png";
}

export function getAccountPictureUrl(fileList) {
  return R.is(Array, fileList) && fileList.length > 0
    ? connectors.remoteStorage.server + "/" + fileList[0].container + "/" + fileList[0].name
    : connectors.remoteStorage.server + "/policies/" + "defaultAccount.png";
}

export function UserProfilePicture({fileList, size, title, toggle, onClick, placement, style, className}) {
  const _size = R.defaultTo("small", size);
  const classNames = R.defaultTo("img-responsive img-circle center-block", className);
  return (
    <span>
      <img
        src={getUserProfilePictureUrl(fileList)}
        title={sanitise(title)}
        data-toggle={toggle}
        data-placement={placement}
        onClick={onClick}
        style={style}
        className={classnames(classNames, {
          "profile-image-sm": _size === "small",
          "profile-image-md": _size === "medium",
          "profile-image-lg": _size === "large",
          "profile-image": _size !== "small" && _size !== "medium" && _size !== "large"
        })}/>
  </span>);
}
export function AccountPicture({fileList, size}) {
  const _size = R.defaultTo("small", size);
  return (
    <img
      src={getAccountPictureUrl(fileList)}
      className={classnames("img-responsive img-rounded", {
        "profile-image-account-xs": _size === "x-small",
        "profile-image-account-sm": _size === "small",
        "profile-image-account-md": _size === "medium",
        "profile-image-account-lg": _size === "large",
        "profile-image-account": _size !== "small" && _size !== "medium" && _size !== "large"
      })}/>
  );
}

export function getServerModelFileUrl(fileList) {
  return R.is(Array, fileList) && fileList.length > 0
    ? connectors.remoteStorage.server + "/" + fileList[0].container + "/" + fileList[0].name
    : "";
}

/*
 * Returns the original filename from a dropzone saved file.
 * For older format saved fileLists the originalFilename is not available. For these files the modelId is required.
 * However, the modelId is the record id which assumes the file is directly attached to the current record.
 * This prevents referencing files from any other record (in the case of copying fileLists to another record).
 */
export function toFilename(prefix, file, modelId) {
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

export function getFileRecordId(prefix, file, modelId) {
  let _fileName = file.name;
  let _origFileName = file.originalFilename;
  if (R.isNil(_origFileName)) {
    return modelId;
  }
  if (prefix && (prefix + "").length > 0) {
    _fileName = R.slice((prefix + "").length, _fileName.length, _fileName);
  }
  if ((_origFileName + "").length > 0) {
    _fileName = R.slice(0, _fileName.length - (cleanFileName(_origFileName + "")).length, _fileName);
  }
  return _fileName; //id left
}


export function getApiUrlFromModel(model, serverModelName, method, queryArr) {
  const accountTypeAndId = getCurrentAccountTypeAndId(model);
  return getApiUrl(
    serverModelName,
    method,
    queryArr,
    getAccessTokenId(model),
    accountTypeAndId.accountType,
    accountTypeAndId.accountId
  );
}

export function getApiUrl(serverModelName, method, queryArr, accessTokenId, accountType, accountId) {
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
  _queryArr = R.uniq(_queryArr)
  return removeApiServer + "/api/" + serverModelName + "s/" + method + "?" + R.join("&", _queryArr);
}

//@todo deprecate and remove use of this legacy function
export function getDownloadUrl(serverModelName, accessTokenId, modelId, prefix, accountIdField, accountId) {
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


const FILE_EXTENSION_ICON_MAP = {
  "csv": {"icon": "file-delimited", "name": "CSV"},
  "doc": {"icon": "file-word", "name": "Word"},
  "docm": {"icon": "file-word", "name": "Word"},
  "docx": {"icon": "file-word", "name": "Word"},
  "gif": {"icon": "file-image", "name": "GIF"},
  "jpeg": {"icon": "file-image", "name": "JPEG"},
  "jpg": {"icon": "file-image", "name": "JPEG"},
  "mp3": {"icon": "file-music", "name": "MP3"},
  "pdf": {"icon": "file-pdf", "name": "PDF"},
  "png": {"icon": "file-image", "name": "PNG"},
  "ppt": {"icon": "file-powerpoint", "name": "PowerPoint"},
  "pptm": {"icon": "file-powerpoint", "name": "PowerPoint"},
  "pptx": {"icon": "file-powerpoint", "name": "PowerPoint"},
  "txt": {"icon": "file-document", "name": "Text"},
  "xls": {"icon": "file-excel", "name": "Excel"},
  "xlsm": {"icon": "file-excel", "name": "Excel"},
  "xlsx": {"icon": "file-excel", "name": "Excel"},
  "xml": {"icon": "file-xml", "name": "XML"},
};

export function fileIcon(fileName, iconSize, showName) {
  const extension = fileName.split(".").pop();
  const fileExtMap = FILE_EXTENSION_ICON_MAP[extension] || {"icon": "file", "name": "File"};
  const icon = fileExtMap.icon;
  const name = fileExtMap.name;
  const size = iconSize === "small" ? "mdi-1x" : "mdi-2x"
  return (
    <span className="text-primary">
      <span className={"glyphicon mdi-" + icon + " " + size}/>
      {showName && <small>{name}</small>}
    </span>
  );
}
