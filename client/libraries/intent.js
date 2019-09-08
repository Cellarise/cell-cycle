"use strict";
import R from 'ramda';
import {win, appInsights} from '../globals';

/**
 * Install the intent handlers
 * @param {Object} driverConfig - driver configuration
 * @param {Object} drivers - map containing drivers for triggering events
 * @param {Object} actionLoader - map containing requireAction function
 * @return {Array} an array of triggering events (action observers) and corresponding action handlers
 */
export function getDriverIntentHandler(driverConfig, drivers, actionLoader) {
  if (driverConfig.API && driverConfig.sampleProperties) {
    return R.concat([
        [drivers[driverConfig.name].request, /*NB: the bus for an API driver is always available on .request*/
          drivers[driverConfig.sampleProperties[0]]],
        (model, action, diff) => (
          callActionHandler(model, R.merge(diff, action), drivers, driverConfig, actionLoader, "remoteAPIRequest"))
      ],
      getAPIResponseHandlers(driverConfig, drivers, actionLoader)
    );
  }
  if (driverConfig.API) {
    return R.concat([
        drivers[driverConfig.name].request, /*NB: the bus for an API driver is always available on .request*/
        (model, action) => (callActionHandler(model, action, drivers, driverConfig, actionLoader, "remoteAPIRequest"))
      ],
      getAPIResponseHandlers(driverConfig, drivers, actionLoader)
    );
  }
  if (driverConfig.sampleProperties) {
    return [
      [drivers[driverConfig.name], drivers[driverConfig.sampleProperties[0]]],
      (model, action, diff) => (
        callActionHandler(model, R.merge(diff, action), drivers, driverConfig, actionLoader, "nonAPI")
      )
    ];
  }
  return [
    drivers[driverConfig.name],
    (model, action) => (callActionHandler(model, action, drivers, driverConfig, actionLoader, "nonAPI"))
  ];
}

/**
 * Update handlers for responses received from remoteAPI driver
 * @param {Object} driverConfig - driver configuration
 * @param {Object} drivers - map containing drivers for triggering events
 * @param {Object} actionLoader - map containing requireAction function
 * @return {Array} an array of triggering events (action observers) and corresponding action handlers
 */
export function getAPIResponseHandlers(driverConfig, drivers, actionLoader) {
  if (driverConfig.sampleProperties) {
    return R.pipe(
      R.values, //get stores
      R.map(R.values), //get responseStream actions
      R.unnest,
      R.map(responseStream => ([
      /**
       * Update on remoteAPIStream responses
       */
        [responseStream,
          drivers[driverConfig.sampleProperties[0]]],
        (model, action, diff) => (
          callActionHandler(model, R.merge(diff, action), drivers, driverConfig, actionLoader, "remoteAPIResponse"))
      ])),
      R.unnest
    )(drivers[driverConfig.name].responseStreams);
  }
  return R.pipe(
    R.values, //get stores
    R.map(R.values), //get responseStream actions
    R.unnest,
    R.map(responseStream => ([
    /**
     * Update on remoteAPIStream responses
     */
      responseStream,
      (model, action) => (callActionHandler(model, action, drivers, driverConfig, actionLoader, "remoteAPIResponse"))
    ])),
    R.unnest
  )(drivers[driverConfig.name].responseStreams);
}

/**
 * The intent action handlers
 * @param {Immutable} model - current model
 * @param {Object} action - the action from the triggering event
 * @param {Object} drivers - map containing drivers for triggering events
 * @param {Object} driverConfig - driver configuration
 * @param {Object} actionLoader - map containing requireAction function
 * @param {String} driverType - driver configuration
 * @return {Array} an array of triggering events (action observers) and corresponding action handlers
 */
export function callActionHandler(model, action, drivers, driverConfig, actionLoader, driverType) {
  const DEFAULT_LIBRARY = "globalHandlers";
  const PRESUBMIT_API_LIBRARY = "remoteAPIHandlers";
  //NB: Using the action configuration stored in the record
  if (model.hasIn(['stores', action.storeId, 'actions', action.id])) {
    action.config = R.defaultTo(model.getIn(['stores', action.storeId, 'actions', action.id]).toJS(), action.config);
    //NB: Add reference to model for read-only purposes only. This model is not updated by the remote API.
    action.model = R.defaultTo(model, action.model);
    action.driverConfig = driverConfig; //source event trigger driverConfig
    if (driverType === 'remoteAPIResponse') {
      return callActionHandlerChain(model, action, drivers, driverConfig, actionLoader,
        "handlerResponse", PRESUBMIT_API_LIBRARY, "response");
    }
    if (action.config.hasOwnProperty("handlerRequest")) {
      return callActionHandlerChain(model, action, drivers, driverConfig, actionLoader,
        "handlerRequest", PRESUBMIT_API_LIBRARY, "request");
    }
    if (action.config.hasOwnProperty("handler")) {
      return callActionHandlerChain(model, action, drivers, driverConfig, actionLoader,
        "handler", DEFAULT_LIBRARY, action.id/*default function name*/);
    }
  }
  appInsights.trackException(
    "Could not find the '" + action.id + "' action in the '" + action.storeId + "' store",
    "callActionHandler"
  );
  return model;
}

export function callActionHandlerChain(model, action, drivers, driverConfig, actionLoader, handlerType,
                                       defaultLibrary, defaultFunction) {
  const PRE_UPDATE_HANDLER_NAME = "preUpdate";
  const POST_UPDATE_HANDLER_NAME = "postUpdate";
  let nextModel = model;
  nextModel = getActionHandler(nextModel, {"storeId": action.storeId, "id": PRE_UPDATE_HANDLER_NAME},
    drivers, actionLoader, 'handler', defaultLibrary, PRE_UPDATE_HANDLER_NAME);
  nextModel = getActionHandler(nextModel, action, drivers, actionLoader, handlerType, defaultLibrary, defaultFunction);
  nextModel = getActionHandler(nextModel, {"storeId": action.storeId, "id": POST_UPDATE_HANDLER_NAME},
    drivers, actionLoader, 'handler', defaultLibrary, POST_UPDATE_HANDLER_NAME);
  //if in development mode
  if (process.env.NODE_ENV !== "production") {
    win.model = nextModel;
  }
  return nextModel;
}

export function getActionHandler(model, action, drivers, actionLoader, handlerType, defaultLibrary, defaultFunction) {
  let actionHandlerLib, actionHandlerStr, actionConfig;
  if (model.hasIn(['stores', action.storeId, 'actions', action.id, handlerType])) {
    actionConfig = model.getIn(['stores', action.storeId, 'actions', action.id]).toJS();
    actionHandlerLib = actionLoader(R.defaultTo(defaultLibrary, actionConfig[handlerType].lib));
    //actionHandlerLib = require('../action/' + R.defaultTo(defaultLibrary, actionConfig[handlerType].lib));
    actionHandlerStr = R.defaultTo(defaultFunction, actionConfig[handlerType].fn);
    if (actionHandlerLib.hasOwnProperty(actionHandlerStr)) {
      return actionHandlerLib[actionHandlerStr].bind(actionHandlerLib)(model, action, drivers);
    }
    appInsights.trackException(
      "Could not find the '" + actionHandlerStr + "' action in the '" + action.storeId + "' store",
      "getActionHandler"
    );
  }
  return model;
}

