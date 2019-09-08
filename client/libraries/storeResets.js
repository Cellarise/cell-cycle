"use strict";
import Immutable from 'immutable';
import R from 'ramda';


/**
 * A remote API post request handler for resetting the records in a store
 * @param {Immutable} model - current model
 * @param {Object} action - the request trigger action
 * @return {Immutable} - the next model with records reset in store
 */
export function resetRecords(model, action) {
  const storeId = action.storeId;
  const defaultStores = model.get('configCompiled').stores;
  return model
    .setIn(["stores", storeId, "records"],
      Immutable.List().push(model.getIn(["stores", storeId, "recordTemplate"]))) //maintains authorisation
    .setIn(["stores", storeId, "props", "validationError"],
      model.getIn(["stores", storeId, "props", "validationError"]))
    .setIn(["stores", storeId, "props", "tabs"],
      Immutable.fromJS(R.path([storeId, "props", "tabs"], defaultStores)))
    .setIn(["stores", storeId, "props", "pageState"],
      Immutable.fromJS(R.path([storeId, "props", "pageState"], defaultStores)))
    .setIn(["stores", storeId, "props", "activeRecordIndex"],
      Immutable.fromJS(R.path([storeId, "props", "activeRecordIndex"], defaultStores)));
}


/**
 * A remote API post request handler for resetting the records and properties in a store
 * @param {Immutable} model - current model
 * @param {Object} action - the request trigger action
 * @return {Immutable} - the next model with records and properties reset in store
 */
export function resetRecordsAndProps(model, action) {
  const storeId = action.storeId;
  const defaultStores = model.get('configCompiled').stores;
  return resetRecords(model, action)
    .setIn(["stores", storeId, "props"], Immutable.fromJS(R.path([storeId, "props"], defaultStores)))
    //used to retrieve results of last created record
    .setIn(["stores", storeId, "props", "createdRecord"], model.getIn(["stores", storeId, "props", "createdRecord"]))
    .setIn(["stores", storeId, "props", "error"], model.getIn(["stores", storeId, "props", "error"]))
    .setIn(["stores", storeId, "props", "success"], model.getIn(["stores", storeId, "props", "success"]));
}


/**
 * Reset the collection, props.id and store records.
 * @param {Immutable} model - current model
 * @param {Object} action - the action
 * param {Object} drivers - map containing drivers for triggering events
 * @returns {Immutable} - the next model with the collection, props.id and store records reset.
 */
export function resetCollection(model, action) {
  const defaultStores = model.get('configCompiled').stores;
  //empty collection
  return resetRecordsAndProps(model, action)
    .setIn(
      ["stores", action.storeId, "collection"],
      Immutable.fromJS(R.path([action.storeId, "collection"], defaultStores))
    );
}
