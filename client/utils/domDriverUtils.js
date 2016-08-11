"use strict";
import R from 'ramda';
import Immutable from 'immutable';
import moment from "moment";
import {logger} from '../lib/globals';

/**
 * Create a synthetic event simulating a DOM event
 * @param {String} name - the event name (store property reference)
 * @param {String} value - the event value
 * @param {*} [embeddedPath] - the embedded path converted to a string using JSON.stringify
 * @param {String} [type="text"] - the value type (use to JSON.parse if value is stringified) OR the action type
 * which provides an additional field in addition to the name and value
 * @param {Object} [objectData] - store other object containing data
 * @param {String} [dataRecordIndex] - the data record index
 * @return {DOM.Event} - a synthetic event simulating a DOM event
 */
export function createSyntheticEvent(name, value, embeddedPath, type, objectData, dataRecordIndex) {
  return {
    "currentTarget": {
      "getAttribute": (attr) => {
        switch (attr) {
          case "data-embedded-path":
            return embeddedPath ? JSON.stringify(embeddedPath) : null;
          case "data-value":
            return value;
          case "data-value-object":
            return objectData ? JSON.stringify(objectData) : null;
          case "data-record-idx":
            return dataRecordIndex ? dataRecordIndex : null;
          case "data-type":
          case "type":
            return embeddedPath ? "*" : R.defaultTo("text", type);
          case "name":
          default:
            return name;
        }
      },
      "value": value
    }
  };
}

/**
 * Get the object data value attached to the triggering DOM component
 * @param {DOM.Event} event - the DOM event object
 * @return {Number} - the object data attached to the triggering DOM component
 */
export function getObjectData(event) {
  var value;
  if (!event) {
    logger.warn('domDriverUtils.getObjectData - no event object so returned null');
    return null;
  }
  value = event.currentTarget.getAttribute('data-value-object');
  return !R.isNil(value) ? JSON.parse(value) : null;
}

/**
 * Get the field name attached to the triggering DOM component
 * @param {DOM.Event} event - the DOM event object
 * @return {String} - the field name attached to the triggering DOM component
 */
export function getFieldName(event) {
  if (!event) {
    logger.warn('domDriverUtils.getFieldName - no event object so returned null');
    return null;
  }
  return event.currentTarget.getAttribute('name');
}

/**
 * Get the field type or action type attached to the triggering DOM component
 * @param {DOM.Event} event - the DOM event object
 * @return {String} - the field type or action type attached to the triggering DOM component
 */
export function getType(event) {
  if (!event) {
    logger.warn('domDriverUtils.getType - no event object so returned null');
    return null;
  }
  return event.currentTarget.getAttribute('type');
}

/**
 * Get the record index attached to the triggering DOM component
 * @param {DOM.Event} event - the DOM event object
 * @return {Number} - the record index attached to the triggering DOM component
 */
export function getRecordIndex(event) {
  var value;
  if (!event) {
    logger.warn('domDriverUtils.getRecordIndex - no event object so returned null');
    return null;
  }
  value = event.currentTarget.getAttribute('data-record-idx');
  return !R.isNil(value) && !isNaN(Number(value)) ? Number(value) : null;
}

/**
 * Get the embedded path attached to the triggering DOM component
 * @param {DOM.Event} event - the DOM event object
 * @return {Array} - the embedded path attached to the triggering DOM component
 */
export function getEmbeddedPath(event) {
  if (!event) {
    logger.warn('domDriverUtils.getEmbeddedPath - no event object so returned null');
    return null;
  }
  return JSON.parse(event.currentTarget.getAttribute('data-embedded-path') || JSON.stringify(''));
}

/**
 * Get the value on the triggering DOM component (type dependent on component)
 * @param {DOM.Event} event - the DOM event object
 * @param {Boolean} [raw=false] - flag whether the value should be parsed by type before returning
 * @return {String|Number|Boolean} - the value on the triggering DOM component (type dependent on component)
 */
export function getValue(event, raw) {
  var _raw = R.defaultTo(false, raw);
  //non-standard attributes
  var dataType = event.currentTarget.getAttribute('data-type');
  var dataValue = event.currentTarget.getAttribute('data-value');
  if (!event) {
    logger.warn('domDriverUtils.getValue - no event object so returned null');
    return null;
  }
  if (_raw) {
    return event.currentTarget.value;
  }
  if (R.isNil(dataType)) {
    dataType = event.currentTarget.getAttribute('type');
  }
  if (R.isNil(dataValue)) {
    dataValue = event.currentTarget.value;
  }
  if (dataType === "checkbox") {
    return event.currentTarget.checked;
  }
  if (dataType === "number") {
    // As Number("") returns 0, ensure we pass back no value
    if (dataValue === "") {
      return null;
    }
    if (R.is(String, dataValue)) {
      dataValue = dataValue.replace(/\s/g, "");
    }
    //For strings with '.' at end then add 0
    if (dataValue.endsWith(".")) {
      dataValue += "0";
    }
    dataValue = Number(dataValue);
    return isNaN(dataValue) ? null : dataValue;
  }
  if (dataType === "date") {
    if (dataValue === "") {
      return null;
    }
    return moment(dataValue, ["DD-MMM-YYYY", "DD/M/YYYY"]).toDate();
  }
  if (dataType === "JSON" && R.is(Object, dataValue)) {
    return dataValue;
  }
  if (R.contains(dataType, ["select", "select-one", "JSON"])) {
    return dataValue ? JSON.parse(dataValue) : null;
  }
  return R.defaultTo(null, dataValue);
}

/**
 * Handle the DOM event and set the property
 * @param {Immutable} model - current model
 * @param {Object} action - the action
 * @param {Object} action.event - the DOM event
 * @param {String} action.storeId - the store associated with the event
 * @param {Array} [action.config.path]q - the path to the parent of the property (relative to the store)
 * @param {Object} drivers - map containing drivers for triggering events
 * @param {Array} [path=action.config.path] - the path to the parent of the property (relative to the store)
 * @return {Immutable} - the next model with the target property set
 */
export function setStoreProperty(model, action, drivers, path) {
  var fieldName = getFieldName(action.event);
  var fieldValue = getValue(action.event);
  //set collection property - convert to immutable if the update is an object
  return model.setIn(
    R.pipe(
      R.concat(R.defaultTo(action.config.path, path)),
      R.concat(["stores", action.storeId]),
      R.append(fieldName)
    )([]),
    R.is(Object, fieldValue) ? Immutable.fromJS(fieldValue) : fieldValue
  );
}

/**
 * Update the data value of a DOM event
 * @param {DOM.event} event - the DOM event
 * @param {String} value - the event value to update
 * @return {DOM.Event} - a synthetic event simulating a DOM event with value updated
 */
export function updateEventValue(event, value) {
  return createSyntheticEvent(
    getFieldName(event),
    value,
    getEmbeddedPath(event),
    getType(event)
  );
}
