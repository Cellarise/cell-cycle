"use strict";
import R from 'ramda';
import {appInsights} from '../globals';


/**
 * Call a request stream for a remoteAPI driver directly and bypass the pre-submission handler
 * @param {Immutable} model - current model
 * @param {Object} action - the action
 * @param {String} action.id - the actions id
 * @param {String} action.storeId - the store containing the action config
 * @param {Object} drivers - map containing drivers for triggering events
 * @return {Immutable} - the next model with the target property set
 */
export function callRequestStream(model, action, drivers) {
  let nextModel = model;
  let nextStore;
  //Add action config if required
  action.config = R.defaultTo(model.getIn(["stores", action.storeId, "actions", action.id]).toJS(), action.config);
  const progressProp = action.config.hasOwnProperty("progressFlag") ?
    action.config.progressFlag : ["props", "inProgress"];
  const progressPropByAction = ["props", "inProgressByAction", action.id];
  if (!model.hasIn(["stores", action.storeId, "actions", action.id])) {
    appInsights.trackException(
      "Could not find the '" + action.id + "' action in the '" + action.storeId + "' store",
      "callRequestStream"
    );
    return model;
  }
  if (action.config.hasOwnProperty("handlerRequest")) {
    nextStore = nextModel.getIn(["stores", action.storeId]);
    //set in progress flag
    nextStore = nextStore
      .setIn(progressPropByAction, true)
      .setIn(progressProp, true);
    nextModel = nextModel.setIn(["stores", action.storeId], nextStore);
    action.config.driver = R.defaultTo("remoteAPI", action.config.driver);
    //NB: Add reference to model for read-only purposes only. This model is not updated by the remote API.
    //The intent handler will by default add model from the current state and not the version received by this
    // function. Use the version received by this function.
    action.model = nextModel;
    // Trigger request to the request stream
    // NB: not to drivers.remoteAPI.push as it calls this method which allows for pre-submission handlers
    // requestStreams is the set of buses for pushing to the remoteAPI driver
    drivers[action.config.driver].requestStreams[action.storeId][action.id].push(action);
  }
  return nextModel;
}
