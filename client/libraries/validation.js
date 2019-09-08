"use strict";
/* eslint dot-notation:0 */
import R from 'ramda';
import validators from '../../server/libraries/validators';
import {logger} from '../globals';

function _ErrorHandler() {
  this.errors = {};
  this.handler = function handler(validationKey) {
    return function err(errCode) {
      this.errors[validationKey] = this.errors[validationKey] || [];
      if (errCode) {
        this.errors[validationKey].push(errCode);
      }
    }.bind(this);
  }.bind(this);
}

/**
 * Validate the value of a field in a store
 * @param {Immutable} recordField - the record field object containing full meta data and value
 * @param {string|number|boolean|object} value - the value of the field to be validated
 * @param {array} otherModelValues - the value of other fields in the store
 * @returns {array} an array of error messages keyed by field
 */
export function validate(recordField, value, otherModelValues) {
  const fieldName = recordField.get("name");
  const validationConfig = recordField.get("validation").toJS();
  const errorHandler = new _ErrorHandler();
  otherModelValues[fieldName] = value;
  //execute each validation and accumulate errors in errHandler
  R.pipe(
    R.toPairs(), //[validationKey, validationConfig]
    R.forEach(function executeValidation(valObjPair) {
      const validationType = valObjPair[0];
      const validator = validators.getValidator(validationType);
      if (validator) {
        const model = R.merge(otherModelValues, validators);
        const normalisedConfig = validators.normaliseValidationConfig(valObjPair);
        const err = errorHandler.handler(validationType);
        validator.call(model, fieldName, normalisedConfig, err);
      } else {
        logger.warn("Could not find a " + validationType + " validator for " + fieldName);
      }
    })
  )(validationConfig);
  //get error messages for all errors in errorHandler
  return this.getMessages(errorHandler.errors, validationConfig);
}

/**
 * Get the validation message for a single field validation (combines multiple messages)
 * @param {object} errorMap - the validation errors keyed by validation method codes
 * @param {object} validationConfig - the validation method configuration for the store
 * @returns {string} an array of error messages keyed by field
 */
export function getMessages(errorMap, validationConfig) {
  return R.pipe(
    R.mapObjIndexed(function mapToMessage(errors, field) {
      var validationConfigField = validationConfig[field];
      var messages = validators.defaultMessages[field] || "";
      var errorMessages;
      //if validationConfigError is an object that contains messages
      if (R.is(Object, validationConfigField) && validationConfigField.message) {
        if (R.is(String, validationConfigField.message)) {
          messages = validationConfigField.message;
        } else if (R.is(Object, validationConfigField.message)) {
          messages = validationConfigField.message;
        } else if (R.is(Object, messages)) {
          messages = R.merge(messages, validationConfigField.message);
        }
      } else if (R.is(Object, validationConfigField.messages)) {
        messages = validationConfigField.messages;
      }
      if (R.is(String, messages)) {
        //single string message for error so return immediately
        return [messages];
      }
      errorMessages = R.map((errCode) => (messages[errCode] || ""), errors);
      return errorMessages.join(", and ");
    }),
    R.values,
    R.join(", and "),
    R.defaultTo("")
  )(errorMap);
}
