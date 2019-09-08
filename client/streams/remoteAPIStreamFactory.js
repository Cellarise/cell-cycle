"use strict";
import R from 'ramda';
import Immutable from 'immutable';
import moment from 'moment';
import {mergeDeepL2, regexEscape, modelKeys} from '../utils';
import {appInsights} from '../globals';
import {getValue} from '../utils/domDriverUtils';
import {getRecordValues, getActiveRecord, getRecordFieldsHasChangesToSave} from '../utils/recordUtils';
import {getCurrentAccountTypeAndId, getLoggedInAccountTypeAndId} from '../utils/authHelpers';
import {
  createRemoteAPIStreams as utilsCreateRemoteAPIStreams, getResponseMessage
}
  from '../utils/remoteAPIUtils';

/**
 * Mandatory interface method called by the Intent loader to attach the stream request and response handlers to
 * the framework
 * @param {Object} driverConfig - the driver configuration
 * @param {Immutable} model - the model including all configuration
 * @return {Object} a map containing an array of request streams and an array of response streams
 */
export function createRemoteAPIStreams(driverConfig, model) {
  /**
   * utils.createRemoteAPIStreams is a helper method to create the stream request and response handlers
   * @param {Immutable} model - the model including all configuration
   * @param {String} requestActionProp - the signature for store action handlers to route the handler to this device
   * @param {Function} getAjaxConfigFunc - a function receiving an action object and returning the configuration
   * for jQuery.ajax
   * @param {Function} processResultFunc - a function receiving a successful result from jQuery.ajax and the
   * action configuration object and returning the formatted result object which contains the result on the
   * property 'data'
   * @param {Function} processErrorFunc - a function receiving an error result from jQuery.ajax and the
   * action configuration object and returning the formatted error object which contains the error message on the
   * property 'error.message'
   * @return {Object} a map containing an array of request streams and an array of response streams
   */
  return utilsCreateRemoteAPIStreams(
    model,
    driverConfig,
    getAjaxConfig,
    processResult,
    processError
  );
}

export function getAjaxConfig(actionObj) {
  const model = actionObj.model;
  const store = model.getIn(["stores", actionObj.storeId]);
  const actionConfig = actionObj.config;
  let serverModel, restAPI, headers;
  //for direct call to /session to get session and CSRF tokens
  const currentAccountTypeAndId = getCurrentAccountTypeAndId(model);
  const loggedInAccountTypeAndId = getLoggedInAccountTypeAndId(model);
  if (actionConfig.handlerRequest.hasOwnProperty("session")) {
    return {
      "headers": {
        "X-Secure-Token": model.getIn(["stores", "authenticationUI", "props", "secure_token", "id"]),
        "X-Access-Token": model.getIn(["stores", "authenticationUI", "props", "access_token", "id"]),
        "X-Session-Token": model.getIn(["stores", "authenticationUI", "props", "sessionTokens", "X-Session-Token"])
      },
      "url": '/session',
      "type": "GET",
      "contentType": "application/json; charset=utf-8",
      "dataType": "json"
    };
  }
  serverModel = actionConfig.handlerRequest.serverModel || actionConfig.serverModel;
  restAPI = getRestAPI(actionObj, store, model, serverModel);
  headers = {
    "X-Secure-Token": model.getIn(["stores", "authenticationUI", "props", "secure_token", "id"]),
    "X-Access-Token": model.getIn(["stores", "authenticationUI", "props", "access_token", "id"]),
    "X-Session-Token": model.getIn(["stores", "authenticationUI", "props", "sessionTokens", "X-Session-Token"]),
    "X-Account-Type": currentAccountTypeAndId.accountType,
    "X-Account-Id": currentAccountTypeAndId.accountId,
    "X-Operations-Account-Id": loggedInAccountTypeAndId.accountType === "operations" ? loggedInAccountTypeAndId.accountId : null,
    "X-Utc-Offset": moment().utcOffset()
  };
  return R.merge({
    "headers": headers,
    "url": '/api/' + serverModel + 's' + restAPI.url,
    "type": restAPI.type,
    "data": JSON.stringify(restAPI.data),
    "contentType": restAPI.contentType ? restAPI.contentType : "application/json; charset=utf-8",
    "dataType": restAPI.dataType ? restAPI.dataType : "json"
  }, processHttp(store, actionConfig.handlerRequest));
}

function getRestAPI(actionObj, store, model, serverModel) {
  const actionId = actionObj.id;
  const actionConfig = actionObj.config;
  const handlerRequest = actionConfig.handlerRequest;
  const restProperty = R.defaultTo(R.defaultTo(actionId, handlerRequest.property), handlerRequest.propertyOverride);
  const httpType = R.defaultTo({}, handlerRequest.http).verb;
  const restData = replaceStateReferences(store, model, actionConfig, 0)(R.defaultTo({}, handlerRequest.data));
  let restType, restUrl, restFilterObj, restFilter, actionValue;
  // Filter path allows the query params to be stored on a key other than the store's "collection"
  const filterPath = R.defaultTo(['collection'], handlerRequest.filterPath);
  /*
   * Certain properties have a different query format
   */
  if (R.contains(restProperty, ['search'])) {
    restFilterObj = replaceStateReferences(store, model, actionConfig, 0)(
      mergeDeepL2(
        R.defaultTo({}, handlerRequest.data),
        getTableSearchQuery(store, filterPath)
      )
    );
  } else if (R.contains(restProperty, ['count', 'findById', 'updateAll', 'destroyAll', 'findAudit'])) {
    restFilterObj = replaceStateReferences(store, model, actionConfig, 0)(
      mergeDeepL2(
        R.defaultTo({}, handlerRequest.query),
        getQuery(store, filterPath)(handlerRequest)
      )
    );
  } else {
    restFilterObj = replaceStateReferences(store, model, actionConfig, 0)(
      mergeDeepL2(
        R.defaultTo({}, handlerRequest.query),
        getTableQuery(store, filterPath)(handlerRequest)
      )
    );
  }
  /*
   * Count has a different filter format
   */
  if (restProperty === 'search') {
    restFilter = toSearchString(restFilterObj);
  } else if (restProperty === 'count') {
    restFilter = toCountFilterString(restFilterObj);
  } else {
    restFilter = toFilterString(restFilterObj);
  }
  /*
   * removeFile uses action.event value as the filename
   */
  let fileName, filePrefix, fileId, fileSecureId, fileModelId;
  if (restProperty === 'removeFile' && actionObj.event) {
    actionValue = getValue(actionObj.event);
  }
  if (R.is(Object, actionValue)) {
    fileName = 'fileName=' + actionValue.name;
    filePrefix = '&prefix=' + actionValue.prefix;
    fileId = '&id=' + actionValue.id;//refers to model containing file list
    fileSecureId = actionValue.secureId;
    fileModelId = '&fileModelId=' + R.defaultTo(0, actionValue.fileModelId);//refers to source model file was attached
  } else {
    fileName = 'fileName=' + (actionValue || R.defaultTo({}, restFilterObj.where).id);
    filePrefix = R.defaultTo({}, restFilterObj.where).prefix
      ? ('&prefix=' + R.defaultTo({}, restFilterObj.where).prefix)
      : "";
    fileId =  '&id=' + R.defaultTo({}, restFilterObj.where).id;
    fileModelId = '&fileModelId=0';
  }
  switch (restProperty) {
    case 'count':
      return {
        'type': 'GET',
        'url': '/count' + restFilter,
        'data': {}
      };
    case 'find':
      return {
        'type': 'GET',
        'url': restFilter,
        'data': {}
      };
    case 'search':
      //search analytics
      appInsights.trackPageView('Search', restFilter + "&searchCategory=" + serverModel);
      return {
        'type': 'GET',
        'url': '/search' + restFilter,
        'data': null
      };
    case 'findOne':
      return {
        'type': 'GET',
        'url': '/findOne' + restFilter,
        'data': {}
      };
    case 'findById':
      return {
        'type': 'GET',
        'url': '/' + R.defaultTo({}, restFilterObj.where).id + restFilter,
        'data': {}
      };
    case 'findByIdCache':
      return {
        'type': 'GET',
        'url': '/findByIdCache?id=' + restData.id,
        'data': {}
      };
    case 'create':
      return {
        'type': 'POST',
        'url': '',
        'data': R.dissoc("id", restData) //ensure id field not included on create
      };
    case 'upsert':
      return {
        'type': 'PUT',
        'url': '', //upsert implied by type PUT and id sent as part of restData
        'data': restData
      };
    case 'secureUpdate':
      return {
        'type': 'PUT',
        'url': '/secureUpdate?id=' + restData.id,
        'data': restData
      };
    case 'update':
    case 'updateAttributes':
      return {
        'type': 'PUT',
        'url': '/' + restData.id,
        'data': restData
      };
    case 'destroyById':
      return {
        'type': 'DELETE',
        'url': '/' + restData.id,
        'data': {}
      };
    case 'updateAll':
      return {
        'type': 'PUT',
        'url': '/updateAll/' + restFilter,
        'data': restData
      };
    case 'destroyAll':
      return {
        'type': 'DELETE',
        'url': '/destroyAll/' + restFilter,
        'data': restData
      };
    case 'removeFile':
      return {
        'type': 'DELETE',
        'url': '/removeFile?' + fileName + fileId + filePrefix + fileModelId
        + (handlerRequest.secureId ?
          ('&' + handlerRequest.secureId +
            "=" + R.defaultTo(fileSecureId, R.defaultTo({}, restFilterObj.where).secureId))
          : ""),
        'data': restData
      };
    case 'files':
      return {
        'type': 'GET',
        'url': '/files?id=' + R.defaultTo({}, restFilterObj.where).id
        + (handlerRequest.secureId ?
          ('&' + handlerRequest.secureId + "=" + R.defaultTo(0, R.defaultTo({}, restFilterObj.where).secureId))
          : ""),
        'data': restData
      };
    //@todo Dropzone component handles upload directly - should upload be routed through stream?
    //case 'upload':
    //  return {
    //    'type': 'POST',
    //    'url': '/upload?fileName=' + R.defaultTo({}, restFilterObj.where).id
    //    + (handlerRequest.secureId ?
    //      ('&' + handlerRequest.secureId + "=" + R.defaultTo({}, restFilterObj.where).secureId)
    //      : ""),
    //    'data': restData
    //  };
    case 'download':
      return {
        'type': 'GET',
        'url': '/download?fileName=' + R.defaultTo({}, restFilterObj.where).id,
        'contentType': "text/plain",
        'data': restData,
        'dataType': 'text'
      };
    case 'findAuditHistory':
      return {
        'type': 'GET',
        'url': "/" + restFilterObj.where.id + "/findAuditHistory/" + restFilter,
        'data': {}
      };
    case 'findAudit':
      return {
        'type': 'GET',
        'url': "/" + restFilterObj.where.id + "/findAudit/" + restFilter + "&modified=" + restFilterObj.where.modified,
        'data': {}
      };
    default:
      restType = httpType || 'POST';
      restUrl = restType === 'GET'
        ? '/' + restProperty + toQueryString(restData)
        : '/' + restProperty;
      return {
        'type': restType,
        'url': restUrl,
        'data': restType === 'GET' ? null : restData
      };
  }
}

export function toQueryString(data) {
  return "?" + R.pipe(
      R.toPairs,
      R.filter((pair) => (!R.isNil(pair[1]))),
      R.map((pair) => (encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1]))),
      R.join("&")
    )(data);
}

export let toCountFilterString = R.ifElse(R.pipe(R.keys, R.contains('where')),
  (obj)=> ('?where=' + encodeURIComponent(JSON.stringify(obj.where))),
  ()=> ('')
);

export let toFilterString = R.ifElse(R.pipe(R.keys, R.isEmpty),
  ()=> (''),
  (obj)=> ('?filter=' + encodeURIComponent(JSON.stringify(obj)))
);

export function toSearchString(restFilterObj) {
  return "?" + R.pipe(
    R.toPairs,
    R.reduce(
      (accRestFilterString, filterPair) => {
        if (accRestFilterString !== "") {
          accRestFilterString = accRestFilterString + "&";
        }
        return accRestFilterString + filterPair[0] + "=" + encodeURIComponent(filterPair[1]);
      },
      ""
    )
  )(R.defaultTo({}, restFilterObj));
}

export function replaceStateReferences(store, model, actionConfig, level) {
  const activeRecord = getActiveRecord(store);
  const activeRecordValues = !R.isNil(activeRecord) ? getRecordValues(activeRecord) : null;
  const regexEscapeQuery = actionConfig.handlerRequest && actionConfig.handlerRequest.hasOwnProperty("regexEscapeQuery")
    ? actionConfig.handlerRequest.regexEscapeQuery
    : true;
  const activeRecordFieldsHasChangesToSave = getRecordFieldsHasChangesToSave(activeRecord);
  return R.pipe(
    R.pickBy((path) => {
      if (level !== 0 || R.isNil(path)) {
        return true;
      }
      //filter by hasChangesToSave
      if (path.length === 2 && path[0] === "_activeRecord") {
        return R.contains(path[1], activeRecordFieldsHasChangesToSave);
      }
      return true;
    }),
    R.mapObjIndexed((path, key) => {
      let activeFieldValue;
      if (R.is(Array, path) && R.contains(key, ['fields'])) {
        return path;
      }
      if (R.is(Array, path) && R.contains(key, ['include'])) {
        return R.map((pathItem) => {
          if (R.is(String, pathItem)) {
            return pathItem;
          }
          return replaceStateReferences(store, model, actionConfig, level + 1)(pathItem);
        })(path);
      }
      if (R.is(Array, path) && R.contains(key, ['and', 'or', 'order'])) {
        return R.map(replaceStateReferences(store, model, actionConfig, level + 1))(path);
      }
      if (R.is(Array, path) && R.contains(key, ['nin', 'inq'])) {
        return path;
      }
      if (R.is(Array, path) && R.contains(key, ['like', 'nlike'])) {
        if (path.length > 0 && R.contains(path[0], modelKeys())) {
          return regexEscapeQuery ? regexEscape(model.getIn(path)) + '%' : model.getIn(path) + '%';
        } else if (path.length > 0) {
          return regexEscapeQuery ? regexEscape(store.getIn(path)) + '%' : store.getIn(path) + '%';
        }
        activeFieldValue = activeRecordValues ? activeRecordValues.get(key) : '';
        return regexEscapeQuery ? regexEscape(activeFieldValue) + '%' : activeFieldValue + '%';
      }
      //If path is an array than assume a value to be injected from record
      if (R.is(Array, path)) {
        if (path.length > 0 && R.contains(path[0], modelKeys())) {
          return model.getIn(path);
        } else if (path.length > 0 && path[0] !== "_activeRecord") {
          return store.getIn(path);
        } else if (path.length === 2 && path[0] === "_activeRecord") {
          return activeRecordValues ? activeRecordValues.get(path[1]) : '';
        }
        return activeRecordValues ? activeRecordValues.get(key) : '';
      }
      if (R.is(Object, path)) {
        return replaceStateReferences(store, model, actionConfig, level + 1)(path);
      }
      if (R.contains(key, ['like', 'nlike'])) {
        return regexEscapeQuery ? regexEscape(path) + '%' : path + '%';
      }
      return path;
    })
  );
}

export function getQuery(store, filterPath) {
  return R.ifElse(
    R.propEq('table', true),
    () => {
      const searchTerm = store.getIn(filterPath.concat(["searchTerm"]));
      const searchFields = store.getIn(filterPath.concat(["searchFields"]));
      const where = store.getIn(filterPath.concat(["where"]));
      const include = store.getIn(filterPath.concat(["include"]));
      let searchClause;
      var nonTableObj = {};
      if (where) {
        nonTableObj.where = where.toJS();
      } else {
        nonTableObj.where = {};
      }
      if (searchTerm && Immutable.List.isList(searchFields)) {
        searchClause = searchFields.map(
          (searchField) => (R.assoc(searchField, {"like": regexEscape(searchTerm)}, {}))
        ).toJS();
        if (nonTableObj.where.and) {
          nonTableObj.where.and.push({"or": searchClause});
        } else {
          nonTableObj.where.or = searchClause;
        }
      }
      if (include) {
        nonTableObj.include = include.toJS();
      }
      return nonTableObj;
    },
    () => ({})
  );
}


export function getTableSearchQuery(store, filterPath) {
  const searchTerm = store.getIn(filterPath.concat(["searchTerm"]));
  const searchFields = store.getIn(filterPath.concat(["searchFields"]));
  const sort = store.getIn(filterPath.concat(["sort"]));
  const where = store.getIn(filterPath.concat(["where"]));
  const pageSize = store.getIn(filterPath.concat(["pageSize"]));
  const page = store.getIn(filterPath.concat(["page"]));
  const tableObj = {};
  if (sort && sort.size > 0) {
    tableObj.sort = sort.toJS();
  }
  if (searchTerm) {
    tableObj.search = searchTerm;
  }
  if (searchFields) {
    tableObj.searchFields = searchFields;
  }
  if (where) {
    tableObj.where = where.toJS();
  }
  if (pageSize && page) {
    tableObj.limit = pageSize;
    tableObj.skip = (page - 1) * pageSize;
  }
  return tableObj;
}

export function getTableQuery(store, filterPath) {
  return R.ifElse(
    R.propEq('table', true),
    () => {
      const searchTerm = store.getIn(filterPath.concat(["searchTerm"]));
      const searchFields = store.getIn(filterPath.concat(["searchFields"]));
      const searchFieldsFreeText = store.getIn(filterPath.concat(["searchFieldsFreeText"]));
      const selectFields = store.getIn(filterPath.concat(["selectFields"]));
      const sort = store.getIn(filterPath.concat(["sort"]));
      const where = store.getIn(filterPath.concat(["where"]));
      const include = store.getIn(filterPath.concat(["include"]));
      const pageSize = store.getIn(filterPath.concat(["pageSize"]));
      const page = store.getIn(filterPath.concat(["page"]));
      let order, searchClause;
      let tableObj = {};
      if (selectFields) {
        tableObj.fields = selectFields.toJS();
      }
      if (sort && sort.size > 0) {
        order = sort.toJS()[0];
        tableObj.order = order.field + (order.direction === 1 ? " ASC" : " DESC");
      }
      if (where) {
        tableObj.where = where.toJS();
      } else {
        tableObj.where = {};
      }
      if (searchTerm && (
          Immutable.List.isList(searchFields) ||
          Immutable.List.isList(searchFieldsFreeText)
        )
      ) {
        searchClause = [];
        if (Immutable.List.isList(searchFields)) {
          searchClause = R.concat(searchClause, searchFields.map(
            (searchField) => (R.assoc(searchField, {"like": regexEscape(searchTerm)}, {}))
          ).toJS());
        }
        if (Immutable.List.isList(searchFieldsFreeText)) {
          searchClause = R.concat(searchClause, searchFieldsFreeText.map(
            (searchField) => (R.assoc(searchField, {"like": "%" + regexEscape(searchTerm)}, {}))
          ).toJS());
        }
        if (tableObj.where.and) {
          tableObj.where.and.push({"or": searchClause});
        } else {
          tableObj.where.or = searchClause;
        }
      }
      if (include) {
        tableObj.include = include.toJS();
      }
      if (pageSize && page) {
        tableObj.limit = pageSize;
        tableObj.skip = (page - 1) * pageSize;
      }
      return tableObj;
    },
    () => ({})
  );
}

export function processHttp(store, handlerRequest) {
  return R.pipe(
    R.prop('http'),
    R.defaultTo({}),
    R.toPairs,
    R.map(pair => (transformHttpValue(pair[0], pair[1], store))),
    R.fromPairs
  )(handlerRequest);
}

/**
 * @param {String} key - request http key (may be transformed)
 * @param {String} value - request http key value (may be transformed)
 * @param {Immutable} store - store
 * @return {Object} default value for property
 */
export function transformHttpValue(key, value, store) {
  switch (key) {
    case "headers":
      return [key, R.mapObjIndexed((headerValue, header) => {
        switch (header) {
          case "X-Access-Token":
            return store.getIn(headerValue);
          default:
            return headerValue;
        }
      })(value)];
    case "verb":
      return ["type", value];
    default:
      //includes case "url"
      return [key, value];
  }
}

export function processResult(result, action, driverConfig) {
  const headers = R.defaultTo({}, action.ajaxConfig).headers;
  const message = getResponseMessage(R.merge(result, {"status": 200}), action.config, driverConfig);
  if (result && result.hasOwnProperty('count')
    && !result.hasOwnProperty('results')
    && !result.hasOwnProperty('limit')) {
    return R.merge(action, {"data": result.count, "message": message, "headers": headers});
  }
  return R.merge(action, {"data": result, "message": message, "headers": headers});
}

export function processError(result, action, driverConfig) {
  const message = getResponseMessage(result, action.config, driverConfig);
  const error = result.responseJSON && result.responseJSON.error
    ? result.responseJSON.error
    : {"status": result.status, "code": result.code};
  error.message = message;
  return R.assoc('error', error, action);
}
