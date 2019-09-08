"use strict";
import R from 'ramda';
import React from 'react';
import Immutable from 'immutable';
import {getRecordValidationErrors} from '../utils/recordUtils';
import {modelPassesFilters, shallowEqual} from '../utils';
import {logger} from '../globals';


/**
 * Helper method to render react children passed to a class via props.children
 * @param {React.Children} children - single child object or array of children
 * @param {Object} props - the properties to pass to each child
 * @return {Array} array of children
 */
export function renderChildren(children, props) {
  return React.Children.map(children, child => {
    return React.cloneElement(child, props);
  });
}

/**
 * Get modelSubscriptions from page specification
 * @param {Object} props - map of page specification
 * @return {Array} modelSubscriptions
 */
export function getModelSubscriptions(props) {
  return props && props.modelSubscriptions ? props.modelSubscriptions : [];
}

/**
 * Get find model subcription from page specification based on name
 * @param {Object} props - map of page specification
 * @param {String} name - the model subscription name
 * @return {Array} model subscriptions names
 */
export function findModelSubscriptionByName(props, name) {
  return R.find((modelSubscription) => {
    var modelSubscriptionName = modelSubscription.name || R.last(modelSubscription.path);
    return modelSubscriptionName === name;
  }, getModelSubscriptions(props));
}

/**
 * Get modelSubscriptions names from page specification
 * @param {Object} props - map of page specification
 * @return {Array} model subscriptions names
 */
export function getModelSubscriptionNames(props) {
  return R.pipe(
    getModelSubscriptions,
    R.map(getModelSubscriptionName)
  )(props);
}

/**
 * Get modelSubscription name
 * @param {Object} modelSubscription - the modelSubscription
 * @return {String} modelSubscription name
 */
export function getModelSubscriptionName(modelSubscription) {
  return modelSubscription.name || R.last(modelSubscription.path);
}

/**
 * Get modelSubscriptions paths from page specification
 * @param {Object} props - map of page specification
 * @return {Array} model subscriptions paths
 */
export function getModelSubscriptionPaths(props) {
  return R.pipe(
    getModelSubscriptions,
    R.filter(R.propEq("path")),
    R.map(R.prop("path"))
  )(props);
}

/**
 * Get modelSubscriptions store names from the page specification
 * @param {Object} props - map of page specification
 * @return {Array} model subscriptions store names
 */
export function getModelSubscriptionStores(props) {
  return R.pipe(
    getModelSubscriptionPaths,
    R.filter(path => (R.length(path) > 1 && R.head(path) === "stores")),
    R.map(R.nth(1)),
    R.uniq
  )(props);
}


export function bindModelSubscriptions(actions, modelStream, props, displayName, replaceState) {
  const modelSubscriptions = getModelSubscriptions(props);
  const _boundModelStream = modelStream.skipDuplicates((oldModel, newModel) => (
    //if all subscriptions haven't changed then skip
    R.all(modelSubscription => {
        const changePath = modelSubscription.changePath ? modelSubscription.changePath : modelSubscription.path;
        if (R.is(Array, changePath[0])) {
          //array of change paths provided
          return R.filter(
            (changePathItem) => (oldModel.getIn(changePathItem) === newModel.getIn(changePathItem)),
            changePath
          ).length === changePath.length
        }
        return oldModel.getIn(changePath) === newModel.getIn(changePath);
      },
      modelSubscriptions
    ))
  ).onValue(model => {
    const nextState = R.pipe(
      R.reduce((acc, modelSubscription) => {
          let validationConfig;
          if (R.is(Array, modelSubscription.path) && modelSubscription.path.length > 0) {
            acc[getModelSubscriptionName(modelSubscription)] = model.getIn(modelSubscription.path);
          } else {
            logger.error(displayName + " - component setState error " + JSON.stringify(modelSubscription));
          }
          //check if attempting to subscribe to pageSpec
          if (R.equals(modelSubscription.path, ["stores", "routerUI", "props", "pageSpec"])
            && displayName !== "__MS_pageFactory") {
            logger.error(displayName + " - component setState error: pageSpec subscription attempted");
          }
          //get validation config
          //@todo move validation config onto feature based stores
          if (R.is(Array, modelSubscription.path)
            && modelSubscription.path.length > 1
            && modelSubscription.path[0] === "stores"
            && R.isNil(R.path(["validationConfig", "ignore"], modelSubscription))) {
            validationConfig = R.defaultTo({}, modelSubscription.validationConfig);
            validationConfig.storeId = modelSubscription.path[1];
            //only add if an active record exists
            if (model.hasIn(["stores", validationConfig.storeId, "records",
                model.getIn(["stores", validationConfig.storeId, "props", "activeRecordIndex"])])) {
              validationConfig.activeRecord = model
                .getIn(["stores", validationConfig.storeId, "records",
                  model.getIn(["stores", validationConfig.storeId, "props", "activeRecordIndex"])]);
              validationConfig.activeRecord = getRecordValidationErrors(validationConfig.activeRecord);
              acc.validationConfig = acc.validationConfig.push(Immutable.fromJS(validationConfig));
            }
          }
          return acc;
        },
        //The overall state sent to page.  Will always have a validationConfig list.
        //_model used internally and removed before sending state to client
        {
          "validationConfig": Immutable.List(),
          "_model": model
        }
      )
    )(modelSubscriptions);
    replaceState(nextState);
    // if (R.keys(nextState).length > 0) {
    //   if (isMounted()) {
    //     logger.info("%s - component setState", displayName);
    //     replaceState(nextState);
    //   } else {
    //     logger.warn("%s - component setState attempted when unmounted", displayName);
    //     replaceState(nextState);
    //   }
    // }
  });
  logger.info("%s - component SUBSCRIBED to model", displayName);
  return _boundModelStream;
}

export function dissocCommonState(state) {
  return R.pipe(
    R.dissoc("_model"),
    R.dissoc("validationConfig")
  )(state);
}

export function hasSubscribedState(props, state) {
  const subscribedStateProperties = getModelSubscriptionNames(props);
  const definedState = R.pipe(
    R.toPairs,
    //Pass only properties from state containing expectedStateProperties
    //NB: the modelSubscription.state accumulates state added by setState
    //Also filter out state that has not been defined or fails modelSubscriptionLoadingConditions
    R.filter((stateItemPair) => {
      //check subscribed properties exist or have content (i.e. not null or undefined)
      const modelSubscription = findModelSubscriptionByName(props, stateItemPair[0]);
      if (!R.contains(stateItemPair[0], subscribedStateProperties)
        || (!R.defaultTo(false, modelSubscription.allowNull) && R.isNil(stateItemPair[1]))) {
        return false;
      }
      const loadingConditions = R.defaultTo([], modelSubscription.loadingConditions);
      //@todo need to pass model to allow for filters on any paths from the root of the model
      return modelPassesFilters(loadingConditions, stateItemPair[1]);
    })
  )(state || {});
  //All state must be defined before rendering.
  return definedState.length === subscribedStateProperties.length;
}

export function pageStoreHasChangesToSave(model) {
  const onPageUnload = model.getIn(["stores", "routerUI", "props", "pageSpec", "onPageUnload"]);
  if (R.isNil(onPageUnload)) {
    return false;
  }
  const saveOnPageUnloadIndex = onPageUnload.findIndex(
    (action) => (action.get('checkSave') === true)
  );
  if (saveOnPageUnloadIndex > -1) {
    const saveStoreId = onPageUnload.getIn([saveOnPageUnloadIndex, "storeId"]);
    return model.getIn(["stores", saveStoreId, "props", "save", "hasChangesToSave"]);
  }
  return false;
}

export function getPageSaveAction(model) {
  const onPageUnload = model.getIn(["stores", "routerUI", "props", "pageSpec", "onPageUnload"]);
  if (R.isNil(onPageUnload)) {
    return null;
  }
  const saveOnPageUnloadIndex = onPageUnload.findIndex(
    (action) => (action.get('checkSave') === true)
  );
  if (saveOnPageUnloadIndex > -1) {
    return onPageUnload.get(saveOnPageUnloadIndex).toJS();
  }
  return null;
}

export function pageStoreHasIncrementedSaveCounter(model) {
  const onPageUnload = model.getIn(["stores", "routerUI", "props", "pageSpec", "onPageUnload"]);
  if (R.isNil(onPageUnload)) {
    return false;
  }
  const saveOnPageUnloadIndex = onPageUnload.findIndex(
    (action) => (action.get('checkSave') === true)
  );
  if (saveOnPageUnloadIndex > -1) {
    const saveStoreId = onPageUnload.getIn([saveOnPageUnloadIndex, "storeId"]);
    return model.getIn(["stores", saveStoreId, "props", "save", "saveCounter"]) > 0;
  }
  return false;
}

export function resetHasChangesToSaveOnPageStore(model) {
  const onPageUnload = model.getIn(["stores", "routerUI", "props", "pageSpec", "onPageUnload"]);
  if (R.isNil(onPageUnload)) {
    return model;
  }
  const saveOnPageUnloadIndex = onPageUnload.findIndex(
    (action) => (action.get('checkSave') === true)
  );
  if (saveOnPageUnloadIndex > -1) {
    const saveStoreId = onPageUnload.getIn([saveOnPageUnloadIndex, "storeId"]);
    return model
      .setIn(["stores", saveStoreId, "props", "save", "hasChangesToSave"], false)
      .setIn(["stores", saveStoreId, "props", "save", "saveCounter"], 0);
  }
  return model;
}

export function pageStoreIncrementSaveCounter(model) {
  let nextModel = model;
  const onPageUnload = model.getIn(["stores", "routerUI", "props", "pageSpec", "onPageUnload"]);
  const saveOnPageUnloadIndex = onPageUnload.findIndex(
    (action) => (action.get('checkSave') === true)
  );
  if (saveOnPageUnloadIndex > -1) {
    const saveStoreId = onPageUnload.getIn([saveOnPageUnloadIndex, "storeId"]);
    return nextModel.setIn(
      ["stores", saveStoreId, "props", "save", "saveCounter"],
      nextModel.getIn(["stores", saveStoreId, "props", "save", "saveCounter"]) + 1
    );
  }
  return nextModel;
}

//@todo move to domDriverUtils
export function shouldFieldComponentUpdate(component, nextProps, nextState) {
  const props = component.props;
  const state = component.state;
  let shouldUpdate = true;
  if (props.field){
    shouldUpdate = props.field !== nextProps.field;
  }
  if (!shouldUpdate && !R.isNil(nextProps.value)) {
    shouldUpdate = props.value !== nextProps.value;
  }
  if (!shouldUpdate && !R.isNil(nextProps.disabled)) {
    shouldUpdate = props.disabled !== nextProps.disabled;
  }
  if (!shouldUpdate && !R.isNil(nextProps.showValidating)) {
    shouldUpdate = props.showValidating !== nextProps.showValidating;
  }
  if (!shouldUpdate) {
    shouldUpdate = !shallowEqual(state, nextState);
  }
  return shouldUpdate;
}
