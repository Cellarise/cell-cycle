"use strict";
import R from 'ramda';
import Bacon from 'baconjs';
import Immutable from 'immutable';
import moment from 'moment';
import {$, win} from '../globals';
const AJAX_DRIVER_CONFIG = {
  "timeout": 7500, //7.5 seconds
  "timeoutSession": 4000, //4.0 seconds
  "retries": 3,
  "backupTimeout": 150000 //2.5 minutes
};
$.support.cors = true; //required for IE9


/**
 * Helper method to create the stream request and response handlers
 * @param {Immutable} model - the model including all configuration
 * @param {String} driverConfig - the driver configuration
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
export function createRemoteAPIStreams(model, driverConfig,
                                       getAjaxConfigFunc, processResultFunc, processErrorFunc) {
  var requestStreams = {};
  var responseStreams = {};
  var request = new Bacon.Bus();
  R.map( //R.map Object
    (store) => {
      var storeId = store.name;
      requestStreams[storeId] = {};
      responseStreams[storeId] = {};
      R.mapObjIndexed(
        (actionConfig, actionId) => {
          var _actionConfig = actionConfig;
          if (_actionConfig.hasOwnProperty("handlerRequest")
            && (!driverConfig.useIfDeclaredOnly || _actionConfig.driver
            && _actionConfig.driver === driverConfig.name)) {
            requestStreams[storeId][actionId] = new Bacon.Bus();
            responseStreams[storeId][actionId] = createResponseStream(
              requestStreams[storeId][actionId],
              {
                "id": actionId,
                "storeId": storeId,
                "config": _actionConfig
              },
              driverConfig,
              getAjaxConfigFunc,
              processResultFunc,
              processErrorFunc
            );
          }
        },
        store.actions
      );
    },
    model.get("configCompiled").stores
  );
  return {
    //use to submit request to remoteAPI request stream through remoteAPIHandlers.request
    "push": (action) => (request.push(action)),
    "request": request,
    "requestStreams": requestStreams,
    "responseStreams": responseStreams
  };
}

export function preAjaxConfig(requestStream, actionConfig) {
  if (actionConfig.hasOwnProperty("throttle") && actionConfig.hasOwnProperty("debounce")) {
    return requestStream.throttle(actionConfig.throttle).debounce(actionConfig.debounce);
  }
  if (actionConfig.hasOwnProperty("throttle")) {
    return requestStream.throttle(actionConfig.throttle);
  }
  if (actionConfig.hasOwnProperty("debounce")) {
    return requestStream.debounce(actionConfig.debounce);
  }
  return requestStream;
}

export function retryWrapper(driverConfig, ajaxConfig, source) {
  var ajaxDriverConfig = R.defaultTo(AJAX_DRIVER_CONFIG, driverConfig.ajax);
  return Bacon.retry({
    "source": source,
    "retries": ajaxDriverConfig.retries,
    "isRetryable": (error) => {
      var _error = error;
      if (error && error.ajaxConfig && error.error) {
        _error = error.error;
      }
      //check if 404 has an error message response - if so then loopback generated do not retry
      if (R.is(String, R.path(["responseJSON", "error", "message"], _error))) {
        return false;
      }
      return (_error.status === 0 || _error.status === 404 || _error.status === 500); //triggers for a retry
    },
    "delay": (context) => {
      if (!R.isNil(R.path(["globalEnvVariables", "connectors", driverConfig.name, "apiServerBackup"], win))
        && context.retriesDone === ajaxDriverConfig.retries - 2) {
        win.globalEnvVariables.connectors[driverConfig.name].apiServer =
          win.globalEnvVariables.connectors[driverConfig.name].apiServerBackup;
        win.globalEnvVariables.connectors[driverConfig.name].timeoutBackup =
          moment().add(ajaxDriverConfig.backupTimeout, "ms").unix();
      }
      if (!R.isNil(R.path(["globalEnvVariables", "connectors", driverConfig.name, "timeout"], win))) {
        win.globalEnvVariables.connectors[driverConfig.name].timeout =
          3 * ajaxDriverConfig.timeout;
      }
      return 0;
    }
  });
}

export function onResponseSuccess(action, driverConfig, processResultFunc) {
  return (response) => {
    var result = response.data;
    var ajaxConfig = response.ajaxConfig;
    return processResultFunc(result, R.assoc("ajaxConfig", ajaxConfig, action), driverConfig);
  };
}

export function onResponseError(action, driverConfig, processErrorFunc) {
  return (response) => {
    var result = response.error;
    var ajaxConfig = response.ajaxConfig;
    return processErrorFunc(result, R.assoc("ajaxConfig", ajaxConfig, action), driverConfig);
  };
}

export function endEvent() {
  return new Bacon.End();
}

export function ajaxStream(driverConfig, urlPart, ajaxConfig, abort, timeout) {
  var promise;
  // apiServer may be blank in instances where urlPart is fully qualified (e.g. https://example.com)
  const apiServer = win.globalEnvVariables.connectors[driverConfig.name].apiServer || "";
  ajaxConfig.url = apiServer + urlPart;
  ajaxConfig.timeout = abort && timeout ? win.globalEnvVariables.connectors[driverConfig.name].timeout : null;
  promise = $.ajax(ajaxConfig);
  return Bacon.fromBinder(function createAjaxStream(handler) {
    var bound = promise.then(function ajaxDone(data) {
      return handler({
        "data": data,
        "ajaxConfig": ajaxConfig
      });
    }, function ajaxFail(e) {
      return handler(new Bacon.Error({
        "error": e,
        "ajaxConfig": ajaxConfig
      }));
    });
    if (bound && typeof bound.done === 'function') {
      bound.done();
    }
    //unsubscribe function
    if (abort) {
      return function abortable() {
        if (typeof promise.abort === 'function') {
          return promise.abort();
        }
      };
    }
    return function notAbortable() {};
  }, function valueAndEnd(value) {
    return [
      value,
      endEvent()
    ];
  });
}

export function createResponseStream(requestStream, action, driverConfig, getAjaxConfigFunc,
                                     processResultFunc, processErrorFunc) {
  const getIsAbortable = action.config.handlerRequest.abortable !== false;
  const abortable = R.defaultTo(false, action.config.handlerRequest.abortable);
  const timeout = R.defaultTo(true, action.config.handlerRequest.timeout);
  const parallel = R.defaultTo(false, action.config.handlerRequest.parallel);
  const ajaxRequest = (actionObj) => {
    const ajaxConfig = getAjaxConfigFunc(actionObj, driverConfig);
    const urlPart = ajaxConfig.url;
    let ajaxStreamFn;

    //
    //reset on-timeout the backup remote API server
    //
    if (R.path(["globalEnvVariables", "connectors", driverConfig.name, "timeoutBackup"], win)
      && !R.isNil(win.globalEnvVariables.connectors[driverConfig.name].timeoutBackup)
      && win.globalEnvVariables.connectors[driverConfig.name].timeoutBackup < moment().unix()) {
      win.globalEnvVariables.connectors[driverConfig.name].apiServer =
        win.globalEnvVariables.connectors[driverConfig.name].apiServerPrimary;
      win.globalEnvVariables.connectors[driverConfig.name].timeoutBackup = null;
    }
    win.globalEnvVariables.connectors[driverConfig.name].timeout =
      R.defaultTo(AJAX_DRIVER_CONFIG, driverConfig.ajax).timeout;
    ajaxConfig.url = win.globalEnvVariables.connectors[driverConfig.name].apiServer + urlPart;
    ajaxConfig.timeout = win.globalEnvVariables.connectors[driverConfig.name].timeout;


    //with security
    if (driverConfig.security
      && (
        driverConfig.security.usesSessionToken
        && (
          R.isNil(ajaxConfig.headers[driverConfig.security.sessionTokenHeader])
          || R.contains(R.defaultTo("GET", ajaxConfig.type).toUpperCase(), driverConfig.security.sessionMethods)
        )
      )
    ) {
      //get the session token first
      return retryWrapper(driverConfig, {"type": "GET"}, () => (Bacon.fromPromise(
          $.ajax(R.pipe(
            R.assocPath(["headers", driverConfig.security.accessTokenHeader],
              ajaxConfig.headers[driverConfig.security.accessTokenHeader]),
            R.assocPath(["headers", driverConfig.security.sessionTokenHeader],
              ajaxConfig.headers[driverConfig.security.sessionTokenHeader])
          )({
            "url": win.globalEnvVariables.connectors[driverConfig.name].apiServer + driverConfig.security.sessionUrl,
            "type": "GET",
            "timeout": AJAX_DRIVER_CONFIG.timeoutSession
          })),
          true //can abort
        )
          .flatMapLatest((sessionData) => {
            const isGetMethod = R.defaultTo("GET", ajaxConfig.type).toUpperCase() === "GET";
              ajaxStreamFn = () => (ajaxStream(driverConfig, urlPart, R.pipe(
                R.assocPath(["headers", driverConfig.security.sessionTokenHeader],
                  sessionData[driverConfig.security.sessionTokenResponse]),
                R.assocPath(["headers", driverConfig.security.CSRFTokenHeader],
                  sessionData[driverConfig.security.CSRFTokenResponse])
              )(ajaxConfig), abortable || (isGetMethod && getIsAbortable), isGetMethod));
            if (!isGetMethod) {
              return ajaxStreamFn();
            }
            //do not reset to primary server here if session retry has set apiServer to backup server
            //retry here is about retrying in case of network latency
              return retryWrapper(driverConfig, ajaxConfig, ajaxStreamFn);
            }
          )
      ));
    }
    //without security
    return retryWrapper(driverConfig, ajaxConfig, () => (
      ajaxStream(driverConfig, urlPart, ajaxConfig, true, timeout) //abortable and set timeout
    ));
  };

  if (parallel) {
    //construct ajax request and response handler allowing for multiple simultaneous requests
    return preAjaxConfig(requestStream, action.config.handlerRequest)
      .flatMap(ajaxRequest)
      .map(onResponseSuccess(action, driverConfig, processResultFunc))
      .mapError(onResponseError(action, driverConfig, processErrorFunc));
  }
  //construct ajax request and response handler allowing for only one active request
  return preAjaxConfig(requestStream, action.config.handlerRequest)
    .flatMapLatest(ajaxRequest)
    .map(onResponseSuccess(action, driverConfig, processResultFunc))
    .mapError(onResponseError(action, driverConfig, processErrorFunc));
}
/**
 * Set store property at path provided based on response result data
 * @param {Immutable} model - current model
 * @param {Object} result - the result
 * @param {Object} drivers - map containing drivers for triggering events
 * @param {Array} path - the path to the property on which to store result data
 * @param {Boolean} asImmutable[false] - flag whether to store the result as an immutable
 * @return {Immutable} - the next model with property set based on response result data
 */
export function setStoreProperty(model, result, drivers, path, asImmutable = false) {
  if (asImmutable) {
    return model.setIn(
      R.concat(["stores", result.storeId], path),
      Immutable.fromJS(result.error ? [] : result.data)
    );
  }
  return model.setIn(
    R.concat(["stores", result.storeId], path),
    result.error ? [] : result.data
  );
}
/**
 * Get the response message for the view based on store specific response messages or default to driver configured
 * response message.
 * @param {Object} result - the result
 * @param {Object} actionConfig - the action configuration
 * @param {String} driverConfig - the driver configuration
 * @return {String} - the response message
 */
export function getResponseMessage(result, actionConfig, driverConfig) {
  var actionResponseMessages = R.defaultTo({}, actionConfig.handlerResponse).responseMessages || {};
  var statusCode = result.status + "";
  var message = R.is(Array, actionResponseMessages[statusCode]) && R.path(["responseJSON", "error", "message"], result)
    ? result.responseJSON.error.message
    : R.defaultTo(driverConfig.responseMessages[statusCode], actionResponseMessages[statusCode]);
  return message || "";
}
