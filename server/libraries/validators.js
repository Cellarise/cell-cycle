"use strict";
/* eslint dot-notation:0 */
//Based on validations.js in loopback-datasource-juggler
var R = require('ramda');
var moment = require('moment');
var Immutable = require('immutable');

var validators = {
  "defaultMessages": {
    "presence": "can't be blank",
    "absence": "can't be set",
    "length": {
      "min": "too short",
      "max": "too long",
      "is": "length is wrong"
    },
    "range": {
      "min": "too low",
      "max": "too high",
      "is": "out of range"
    },
    "common": {
      "blank": "is blank",
      "null": "is null"
    },
    "numericality": {
      "int": "is not an integer",
      "number": "is not a number"
    },
    "type": {
      "string": "is not a string",
      "number": "is not a number",
      "boolean": "is not a true or false",
      "date": "is not a date",
      "array": "is not a table",
      "object": "is not an object"
    },
    "multiInclusion": "is not included in the list",
    "inclusion": "is not included in the list",
    "suggestion": "",
    "exclusion": "is reserved",
    "uniqueness": "is not unique",
    "format": "is not valid",
    "required": "is required",
    "requiredNotes": "are required",
    "arrayLength": "should have at least one item",
    "passwordCheck": {
      "min": "must be greater than 6 characters",
      "max": "must be lower than 25 characters",
      "number": "must contain at least 1 number",
      "lowerCase": "must contain at least 1 lower case character",
      "upperCase": "must contain at least 1 upper case character",
      "invalid": "may only contain letters, numbers and the special characters !@#$%^&*()_+/.,;:"
    },
    "newPasswordConfirm": "is not comparable to partner field",
    "changePasswordConfirm": "is not comparable to partner field",
    "inputWhiteList": "should not contain ",
    "abn": {
      "common": "ABN is required",
      "length": "should be 11 digits",
      "check": "is not valid",
      "ABR": "is not valid on the ABR"
    },
    "acn": {
      "common": "ACN is required",
      "length": "should be 9 digits"
    }
  },
  "normaliseValidationConfig": function normaliseValidationConfig(valObjPair) {
    return R.merge({
      "allowBlank": true,
      "allowNull": true,
      "type": valObjPair[1]
    }, R.is(Object, valObjPair[1]) ? valObjPair[1] : {
      "_value": valObjPair[1]
    });
  },
  // Returns a validator function based on the configuration name.
  // For example, `getValidator("required")` returns the function `validateRequired`.
  "getValidator": function getValidator(type) {
    var functionName = "validate" + type.charAt(0).toUpperCase() + type.slice(1);
    return validators[functionName];
  },
  "nullCheck": function nullCheck(attr, conf, err) {
    if (this[attr] === null) {
      if (!conf.allowNull) {
        err('null');
      }
      return true;
    }
    if (validators.blank(this[attr])) {
      if (!conf.allowBlank) {
        err('blank');
      }
      return true;
    }
    return false;
  },
  /*!
   * Return true when v is undefined, blank array, null or empty string
   * otherwise returns false
   *
   * @param {Mix} v
   * Returns true if `v` is blank.
   */
  "blank": function blank(v) {
    return typeof v === 'undefined'
      || v instanceof Array && v.length === 0
      || v === null
      || typeof v === 'number' && isNaN(v)
      || typeof v == 'string' && v === '';
  },
  "validateType": function validateType(attr, conf, err) {
    var value;
    if (validators.nullCheck.call(this, attr, conf, err)) {
      return null;
    }
    value = this[attr];
    switch (conf.type) {
      case "string":
        return R.is(String, value) ? null : err('string');
      case "number":
        return R.is(Number, value) ? null : err('number');
      case "boolean":
        return R.is(Boolean, value) ? null : err('boolean');
      case "date":
        return R.is(Date, value) ? null : err('date');
      //@todo add type checks for fields with embedded models
      //case "array":
      //  return R.is(Array, value) ? null : err('array');
      //case "JSON":
      //case "object":
      //  return R.is(Object, value) ? null : err('object');
      default:
        return null;
    }
  },
  "validateRequired": function validateRequired(attr, conf, err) {
    var value = this[attr];
    if (conf._value === true && (R.isNil(value) || R.is(String, value) && R.trim(value) === "")) {
      err("required");
    }
  },
  "validateRequiredNotes": function validateRequiredNotes(attr, conf, err) {
    var value = this[attr];
    if (conf._value === true && (R.isNil(value) || R.is(String, value) && R.trim(value) === "")) {
      err("requiredNotes");
    }
  },
  "validateLength": function validateLength(attr, conf, err) {
    var value, len;
    if (validators.nullCheck.call(this, attr, conf, err)) {
      return;
    }
    value = this[attr];
    if (R.is(Number, value)) {
      len = value.toString().length;
    } else if (Immutable.List.isList(value)) {
      len = value.size;
    } else {
      len = value.length;
    }
    if (R.has("min", conf) && len < conf.min) {
      err('min');
    }
    if (R.has("max", conf) && len > conf.max) {
      err('max');
    }
    if (R.has("is", conf) && len !== conf.is) {
      err('is');
    }
  },
  "validateRange": function validateRange(attr, conf, err) {
    var value;
    if (validators.nullCheck.call(this, attr, conf, err)) {
      return;
    }
    value = this[attr];
    if (R.has("min", conf) && value < conf.min) {
      err('min');
    }
    if (R.has("max", conf) && value > conf.max) {
      err('max');
    }
    if (R.has("is", conf) && value !== conf.is) {
      err('is');
    }
  },
  "validateNumericality": function validateNumericality(attr, conf, err) {
    var value;
    if (validators.nullCheck.call(this, attr, conf, err)) {
      return null;
    }
    value = this[attr];
    if (!R.is(Number, value)) {
      return err('number');
    }
    if (value !== Math.round(value)) {
      return err('int');
    }
  },
  "validatePasswordCheck": function validatePasswordCheck(attr, conf, err) {
    var value;
    if (validators.nullCheck.call(this, attr, conf, err)) {
      return null;
    }
    value = this[attr];
    if (value.length < 7) {
      return err('min');
    } else if (value.length > 24) {
      return err('max');
    } else if (value.search(/\d/) === -1) {
      return err('number');
    } else if (value.search(/[a-z]/) === -1) {
      return err('lowerCase');
    } else if (value.search(/[A-Z]/) === -1) {
      return err('upperCase');
    } else if (value.search(/[^a-zA-Z0-9!@#$%^&*()_+.,;:/]/) !== -1) {
      return err('invalid');
    }
    return null;
  },
  "validateSuggestion": function validateSuggestion() {
    //any value allowed
    return null;
  },
  "validateMultiInclusion": function validateMultiInclusion(attr, conf, err) {
    var value;
    if (validators.nullCheck.call(this, attr, conf, err)) {
      return null;
    }
    value = this[attr];
    if (value.length > 0 && !R.all(
      function eachValue(val) {
        return R.contains(val, R.defaultTo([], conf["in"]));
      }, value
    )) {
      err();
    }
  },
  "validateInclusion": function validateInclusion(attr, conf, err) {
    var value;
    if (validators.nullCheck.call(this, attr, conf, err)) {
      return null;
    }
    value = this[attr];
    if (value !== "" && !R.contains(value, R.defaultTo([], conf["in"]))) {
      err();
    }
  },
  "validateExclusion": function validateExclusion(attr, conf, err) {
    var value;
    if (validators.nullCheck.call(this, attr, conf, err)) {
      return null;
    }
    value = this[attr];
    if (value !== "" && R.contains(value, R.defaultTo([], conf["in"]))) {
      err();
    }
  },
  "validateFormat": function validateFormat(attr, conf, err) {
    var value;
    if (validators.nullCheck.call(this, attr, conf, err)) {
      return null;
    }
    if (R.isNil(conf["with"])) {
      return null;
    }
    value = this[attr];
    if (R.is(String, value)) {
      if (!value.match(new RegExp(conf["with"]))) {
        err();
      }
    } else {
      err();
    }
  },
  // Validates that one or more fields within records in an array are not all null.
  //
  // The configuration structure is:
  //
  // arrayGroupNullCheck: {
  //   "fields": [
  //     "moduleMass",
  //     "moduleMaintenance"
  //   ],
  //   "message": "Vehicle must be added to at least one module"
  // }
  //
  "validateGroupNullCheck": function validateArrayGroupNullCheck(attr, conf, err) {
    if (validators.nullCheck.call(this, attr, conf, err)) {
      return;
    }
    const fields = conf.fields;
    if (R.isNil(fields) || fields.length === 0) {
      return;
    }
    const fieldsLength = fields.length;
    const filteredFields = R.filter(function eachField(field) {
      const fieldToCheck = this[field];
      return R.isNil(fieldToCheck) || fieldToCheck !== true;
    }.bind(this), fields);
    if (fieldsLength === filteredFields.length) {
      err(conf.message);
    }
  },
  // Validates that a field within records in an array are not all null.
  //
  // The configuration structure is:
  //
  // arrayAllNullCheck: {
  //   "field": "moduleMass",
  //   "field2": "moduleMaintenance",
  //   "message": "At least one vehicle must be added to module Mass",
  //   "message2": "At least one vehicle must be added to module Maintenance"
  // }
  //
  "validateArrayAllNullOrFalseCheck": function validateArrayAllNullOrFalseCheck(attr, conf, err) {
    const valueArr = this[attr];
    const field = conf.field;
    const field2 = conf.field2;
    if (validators.blank(valueArr)) {
      return;
    }

    const isImmutableRecord = valueArr.hasOwnProperty("size");

    if (R.isNil(field)) {
      return;
    }
    const firstFoundNotNullRow = isImmutableRecord
      ? valueArr.find(function eachField(row) {
        const match = !R.isNil(row) && !R.isNil(row.getIn([field, 'value'])) && row.getIn([field, 'value']) !== false;
        // if (match && fieldStatus && row.getIn([fieldStatus, 'value']) === "Deleted") {
        //   return false;
        // }
        return match;
      })
      : R.find(function eachField(row) {
        const match = !R.isNil(row) && !R.isNil(row[field]) && row[field] !== false;
        // if (match && fieldStatus && row[fieldStatus] === "Deleted") {
        //   return false;
        // }
        return match;
      }, valueArr);
    if (R.isNil(firstFoundNotNullRow)) {
      err("field");
      return;
    }
    if (R.isNil(field2)) {
      return;
    }
    const firstFoundNotNullRow2 = isImmutableRecord
      ? valueArr.find(function eachField(row) {
        const match = !R.isNil(row) && !R.isNil(row.getIn([field2, 'value'])) && row.getIn([field2, 'value']) !== false;
        // if (match && fieldStatus && row.getIn([fieldStatus, 'value']) === "Deleted") {
        //   return false;
        // }
        return match;
      })
      : R.find(function eachField(row) {
        const match = !R.isNil(row) && !R.isNil(row[field2]) && row[field2] !== false;
        // if (match && fieldStatus && row[fieldStatus] === "Deleted") {
        //   return false;
        // }
        return match;
      }, valueArr);
    if (R.isNil(firstFoundNotNullRow2)) {
      err("field2");
      return;
    }
  },
  // Checks duplicates in the field of records
  // Checks combination between two field for the unique records

  "validateFieldUniqueness": function validateFieldUniqueness(attr, conf, err) {
    const valueArr = this[attr];
    const field = conf.field;
    const combinationField1 = conf.combinationField1;
    const combinationField2 = conf.combinationField2;
    const fieldStatus = conf.fieldStatus;
    const ignoreStatus = conf.ignoreStatus;
    if (validators.blank(valueArr)) {
      return;
    }

    if (R.isNil(valueArr)) {
      return;
    }
    const isImmutableRecord = valueArr.hasOwnProperty("size");

    if (isImmutableRecord) {
      if (!R.isNil(field)) {
        const fieldUniquenessArray = valueArr.reduce(function eachField(accArr, row) {
            if (!R.isNil(fieldStatus) && row.getIn([fieldStatus, "value"]) === ignoreStatus) {
              return accArr;
            }
            accArr.push(row.getIn([field, "value"]));
            return accArr;
          },
          []
        );
        if (fieldUniquenessArray.length !== R.uniq(fieldUniquenessArray).length) {
          err("field");
          return;
        }
      }
      if (R.isNil(combinationField1) || R.isNil(combinationField2)) {
        return;
      }
      const combinationRecords = valueArr.reduce(function eachField(accArr, row) {
          if (!R.isNil(fieldStatus) && row.getIn([fieldStatus, "value"]) === ignoreStatus) {
            return accArr;
          }
          const value1 = row.getIn([combinationField1, "value"]);
          const value2 = row.getIn([combinationField2, "value"]);
          if (R.isNil(value1) || R.isNil(value2)) {
            return accArr;
          }
          accArr.push(R.join('|', [value1, value2]));
          return accArr;
        },
        []
      );
      if (combinationRecords.length !== R.uniq(combinationRecords).length) {
        err("combination");
      }
    }
    return;
  },
  // Compares the value of the field to a primitive value or value of another field using a
  // specified operator.
  // The model is NOT valid if the comparison returns false.
  //
  // The configuration structure is:
  //
  // comparison: {
  //   op: "<=",
  //   testValue: 6
  // }
  //
  // or for comparison against a field:
  //
  // comparison: {
  //   op: "<",
  //   testField: "dateTo"
  // }
  //
  // or for comparison against current date:
  //
  // comparison: {
  //   op: "<",
  //   testDate: true
  // }
  //
  // or for comparison against current date +/- offset:
  //
  // comparison: {
  //   op: "<",
  //   testDate: true,
  //   offset: -1,
  //   unit: "days"
  // }
  //
  // Supported operators are:
  //   ==, ===, <, <=, >, >=
  //
  // When the `onlyWhenBothFieldsAreTruthy` configuration item is set to `true`, a validation comparison is only
  // performed if both items are truthy.
  "validateComparison": function validateComparison(attr, conf, err) {
    var value = this[attr];
    var test, comparator;
    var hasMultipleTests = R.reject(R.isNil, [conf.testValue, conf.testField, conf.testJS]).length > 1;

    if (validators.nullCheck.call(this, attr, conf, err)) {
      return;
    }

    if (hasMultipleTests) {
      throw new Error("Only one of testValue, testField or testJS can be specified for " + attr + ": " + conf);
    }
    if (conf.testValue) {
      test = conf.testValue;
    } else if (conf.testField) {
      test = this[conf.testField];
    } else if (conf.testDate && conf.offset && conf.unit) {
      test = moment(new Date()).add(conf.offset, conf.unit).toDate();
    } else if (!validators.blank(value) && conf.compareDateValue && conf.offset && conf.unit) {
      test = moment(conf.compareDateValue).add(conf.offset, conf.unit).startOf('day');
      value = moment(value).startOf('day');
    } else if (conf.testDate) {
      test = new Date();
    }

    if (conf.onlyWhenBothFieldsAreTruthy && (validators.blank(value) || validators.blank(test))) {
      return;
    }

    comparator = validators.comparator.call(this);
    if (!comparator[conf.op](value, test)) {
      err();
    }
  },
  "validateComparison2": function validateComparison2(attr, conf, err) {
    var value = this[attr];
    var test, comparator;
    var hasMultipleTests = R.reject(R.isNil, [conf.testValue, conf.testField, conf.testJS]).length > 1;

    if (validators.nullCheck.call(this, attr, conf, err)) {
      return;
    }

    if (hasMultipleTests) {
      throw new Error("Only one of testValue, testField or testJS can be specified for " + attr + ": " + conf);
    }
    if (conf.testValue) {
      test = conf.testValue;
    } else if (conf.testField) {
      test = this[conf.testField];
    } else if (conf.testDate && conf.offset && conf.unit) {
      test = moment(new Date()).add(conf.offset, conf.unit).toDate();
    } else if (conf.testDate) {
      test = new Date();
    }

    if (conf.onlyWhenBothFieldsAreTruthy && (validators.blank(value) || validators.blank(test))) {
      return;
    }

    comparator = validators.comparator.call(this);
    if (!comparator[conf.op](value, test)) {
      err();
    }
  },
  // Compares the value of the field to a primitive value or value of another field using a
  // specified operator.
  // The model is NOT valid if the comparison returns false.
  //
  // The configuration structure is:
  //
  // comparison: {
  //   minOp: ">=",
  //   minTestValue: 4,
  //   maxOp: "<=",
  //   maxTestValue: 6
  // }
  //
  // or for comparison against a field:
  //
  // comparison: {
  //   minOp: ">=",
  //   minTestField: "dateFrom",
  //   maxOp: "<=",
  //   maxTestValue: "dateTo"
  // }
  //
  // or for comparison against current date:
  //
  // comparison: {
  //   minOp: ">=",
  //   minTestDate: true,
  //   maxOp: "<=",
  //   maxTestValue: "dateTo"
  // }
  //
  // or for comparison against current date +/- offset:
  //
  // comparison: {
  //   unit: "days"
  //   minOp: ">=",
  //   minTestDate: true,
  //   minOffset: -1,
  //   minUnit: "days"
  //   maxOp: "<=",
  //   maxTestValue: "dateTo"
  // }
  //
  // Supported operators are:
  //   ==, ===, <, <=, >, >=
  //
  // When the `onlyWhenBothFieldsAreTruthy` configuration item is set to `true`, a validation comparison is only
  // performed if both items are truthy.
  "validateBetweenComparison": function validateBetweenComparison(attr, conf, err) {
    var value = this[attr];
    var minTest, maxTest, comparator;

    if (validators.nullCheck.call(this, attr, conf, err)) {
      return;
    }

    if (conf.minTestValue) {
      minTest = conf.minTestValue;
    } else if (conf.minTestField) {
      minTest = this[conf.minTestField];
    } else if (conf.compareDateValue && conf.minOffset && conf.minUnit) {
      minTest = moment(conf.compareDateValue).add(conf.minOffset, conf.minUnit).toDate();
    } else if (conf.minTestDate && conf.minOffset && conf.minUnit) {
      minTest = moment(new Date()).add(conf.minOffset, conf.minUnit).toDate();
    } else if (conf.minTestDate) {
      minTest = new Date();
    }

    if (conf.maxTestValue) {
      maxTest = conf.maxTestValue;
    } else if (conf.maxTestField) {
      maxTest = this[conf.maxTestField];
    } else if (conf.compareDateValue && conf.maxOffset && conf.maxUnit) {
      maxTest = moment(conf.compareDateValue).add(conf.maxOffset, conf.maxUnit).toDate();
    } else if (conf.maxTestDate && conf.maxOffset && conf.maxUnit) {
      maxTest = moment(new Date()).add(conf.maxOffset, conf.maxUnit).toDate();
    } else if (conf.maxTestDate) {
      maxTest = new Date();
    }

    if (conf.onlyWhenBothFieldsAreTruthy &&
      (validators.blank(value) || validators.blank(minTest) || validators.blank(maxTest))
    ) {
      return;
    }

    comparator = validators.comparator.call(this);
    if (!comparator[conf.minOp](value, minTest)) {
      err("min");
    }
    if (!comparator[conf.maxOp](value, maxTest)) {
      err("max");
    }
  },
  // Compares the difference between the value of this field and another field.
  // The field is NOT valid if the comparison returns false.
  //
  // The configuration structure is:
  //
  // differenceComparison: {
  //   field: "dateFrom"
  //   op: "<"
  //   test: 365
  // }
  //
  // Supported operators are:
  //   ==, ===, <, <=, >, >=
  //
  // When the `onlyWhenBothFieldsAreTruthy` configuration item is set to `true`, a comparison is only
  // performed if both items are truthy.
  "validateDifferenceComparison": function validateDifferenceComparison(attr, conf, err) {
    var value = this[attr];
    var otherValue = this[conf.field];
    var test, comparator;

    if (validators.nullCheck.call(this, attr, conf, err)) {
      return;
    }

    if (conf.onlyWhenBothFieldsAreTruthy && (validators.blank(value) || validators.blank(otherValue))) {
      return;
    }

    if (conf.unit) {
      test = moment(value).diff(moment(otherValue), conf.unit);
    } else {
      test = value - otherValue;
    }

    comparator = validators.comparator.call(this);
    if (!comparator[conf.op](test, conf.test)) {
      err();
    }
  },
  // Test the length of an embedded array.
  // If received from client then the value will be an Immutable and test will be made using .size.
  // The field is NOT valid if the test returns false.
  //
  // The configuration structure is:
  //
  // arrayLength: {
  //   op: ">"
  //   test: 0
  // }
  //
  // Supported operators are:
  //   ==, ===, <, <=, >, >=
  //
  "validateArrayLength": function validateArrayLength(attr, conf, err) {
    var valueArr = this[attr];
    var comparator, valueArrLength;

    if (validators.blank(valueArr)) {
      return;
    }

    valueArrLength = valueArr.hasOwnProperty("size") ? valueArr.size : valueArr.length;
    comparator = validators.comparator.call(this);
    if (!comparator[conf.op](valueArrLength, conf.test)) {
      err();
    }
  },
  // Test whether any field within the rows of an embedded array pass test.
  // If received from client then the value will be an Immutable and it will be converted to an array using toJS().
  // The field is NOT valid if the test returns false.
  //
  // The configuration structure is:
  //
  // arrayContains: {
  //   field: "item"
  //   op: "==="
  //   test: true
  // }
  //
  // Supported operators are:
  //   ==, ===, <, <=, >, >=
  //
  "validateArrayAny": function validateArrayAny(attr, conf, err) {
    var valueArr = this[attr];
    var field = conf.field;
    var comparator, valueArrJS, isImmutableRecord, isValid;

    if (validators.blank(valueArr) || R.isNil(field)) {
      return;
    }

    isImmutableRecord = valueArr.hasOwnProperty("size");
    valueArrJS = isImmutableRecord ? valueArr.toJS() : valueArr;
    comparator = validators.comparator.call(this);
    isValid = R.any(
      function validateRow(row) {
        var result = false;
        if (isImmutableRecord) {
          result = comparator[conf.op](row[field].value, conf.test);
          if (conf.field2) {
            result = result || comparator[conf.op](row[conf.field2].value, conf.test);
          }
          if (conf.field3) {
            result = result || comparator[conf.op](row[conf.field3].value, conf.test);
          }
          if (conf.field4) {
            result = result || comparator[conf.op](row[conf.field4].value, conf.test);
          }
        } else {
          result = comparator[conf.op](row[field], conf.test);
          if (conf.field2) {
            result = result || comparator[conf.op](row[conf.field2], conf.test);
          }
          if (conf.field3) {
            result = result || comparator[conf.op](row[conf.field3], conf.test);
          }
          if (conf.field4) {
            result = result || comparator[conf.op](row[conf.field4], conf.test);
          }
        }
        return result;
      },
      valueArrJS
    );
    if (!isValid) {
      err();
    }
  },
  // Test whether a one or more files in the file list have a prefix
  // If received from client then the value will be an Immutable and it will be converted to an array using toJS().
  // The field is NOT valid if the test returns false.
  //
  // The configuration structure is:
  //
  // fileList: {
  //   field: "fileList"
  //   pattern: "^(pbs|third)"
  //   flags: "g",
  // }
  //
  "validateFileList": function validateFileList(attr, conf, err) {
    var valueArr = this[attr];
    var patterns = conf.pattern.split("|");
    var regexTestArr = R.map(function eachRegex(pattern) {
      return new RegExp(pattern, conf.flags);
    }, patterns);
    var regexPassArr = R.map(function eachRegex() {
      return false;
    }, patterns);

    if (R.isNil(valueArr)) {
      return;
    }

    if (valueArr.hasOwnProperty("size") && !R.isNil(valueArr.forEach)) {
      valueArr.forEach(
        function testEachFile(file) {
          R.addIndex(R.forEach)(
            function testFile(regexObj, idx) {
              if (!regexPassArr[idx]) {
                if (regexObj.test(file.name)) {
                  regexPassArr[idx] = true;
                }
              }
            },
            regexTestArr
          );
        });
    } else if (R.is(Array, valueArr)) {
      R.forEach(
        function testEachFile(file) {
          R.addIndex(R.forEach)(
            function testFile(regexObj, idx) {
              if (!regexPassArr[idx]) {
                if (regexObj.test(file.name)) {
                  regexPassArr[idx] = true;
                }
              }
            },
            regexTestArr
          );
        },
        valueArr
      );
    }
    if (!R.all(function (regexPass) {
      return regexPass;
    }, regexPassArr)) {
      err();
    }
  },
  // Validates a field if the value of another field satisfies a condition.
  //
  // The configuration structure is:
  //
  // ifFieldComparison: {
  //   field: "numberOfAxles",
  //   op: "==="
  //   testValue: 6,
  //   validation: {
  //     required: true,
  //     length: {
  //       min: 18
  //     }
  //   }
  // }
  //
  // Instead of testing against a value using `testValue`, the test can be done against another
  // field using `testField`:
  //
  // ifFieldComparison: {
  //   field: "dateFrom",
  //   op: "<"
  //   testField: "dateTo",
  //   validation: {
  //     required: true
  //   }
  // }
  "validateIfFieldComparison": function validateIfFieldComparison(attr, conf, err) {
    var fieldValue = this[conf.field];
    var test, comparator;

    if (conf.validateNull !== true && validators.nullCheck.call(this, attr, conf, err)) {
      return null;
    }

    if (conf.testValue && conf.testField) {
      throw new Error("Only one of testValue or testField can be specified for " + attr + ": " + conf);
    }
    test = conf.testValue || this[conf.testField];
    comparator = validators.comparator.call(this);

    if (comparator[conf.op](fieldValue, test)) {
      validators.processValidation(this, attr, conf.validation, err);
    }
  },
  // Validates a field if the value of another field satisfies a regex test.
  //
  // The configuration structure is:
  //
  // ifFieldRegexMatches: {
  //   field: "applicationType",
  //   pattern: "^Class 1 - Oversize"
  //   flags: "g",
  //   validation: {
  //     required: true,
  //     inclusion: {
  //       in: ["Oversize", "Overmass", "Oversize/Overmass"]
  //     }
  //   }
  // }
  "validateIfFieldRegexMatches": function validateIfFieldRegexMatches(attr, conf, err) {
    var fieldValue = this[conf.field];
    var regex = new RegExp(conf.pattern, conf.flags);

    if (conf.validateNull !== true && validators.nullCheck.call(this, attr, conf, err)) {
      return null;
    }

    if (regex.test(fieldValue)) {
      validators.processValidation(this, attr, conf.validation, err);
    }
  },
  "validateNewPasswordConfirm": function validateNewPasswordConfirm() {
    var value, compareValue, err = arguments[0];
    if (arguments.length === 3) {
      err = arguments[2];
    }
    value = this.password;
    compareValue = this.passwordConfirm;
    if (value !== compareValue) {
      err();
    }
  },
  "validateChangePasswordConfirm": function validateChangePasswordConfirm() {
    var value, compareValue, err = arguments[0];
    if (arguments.length === 3) {
      err = arguments[2];
    }
    value = this.changePassword;
    compareValue = this.changePasswordConfirm;
    if (value !== compareValue) {
      err();
    }
  },
  "validateAbn": function validateAbn() {
    var value = R.is(Number, this.ABN) ? this.ABN.toString() : this.ABN;
    var err = arguments[0], done = arguments[1], abnlookup = arguments[2];
    var abnRequired = R.isNil(this.noABN) ? true : !this.noABN;


    if (arguments.length === 3) {
      //Client side
      err = arguments[2];
      if (abnRequired) {
        if (R.isNil(value)) {
          err('common');
        } else if (value.length !== 11) {
          err('length');
        } else if (!validators.checkABN(value)) {
          err('check');
        }
      }
    } else if (arguments.length === 4) {
      //Server side
      //only check abn if the synchronous validations pass
      if (abnRequired) {
        if (R.isNil(value)) {
          err('common');
          process.nextTick(done);
          return;
        }
        if (value.length !== 11) {
          err('length');
          process.nextTick(done);
          return;
        }
        if (!validators.checkABN(value)) {
          err('check');
          process.nextTick(done);
          return;
        }
        if (process.env.SQL_DATA_LOAD === "true") {
          process.nextTick(done);
          return;
        }
        abnlookup(value, function cb(error) {
          if (error) {
            err('ABR');
          }
          done();
        });
        return;
      }
      process.nextTick(done);
      return;
    }
  },
  "validateAcn": function validateAcn(attr, conf, err) {
    var value = this.ACN;
    var acnRequired = R.isNil(this.entityTypeBasic) ? false : this.entityTypeBasic === "Company";
    if (acnRequired) {
      if (R.isNil(value)) {
        err('common');
      } else if (value.length !== 9) {
        err('length');
      }
    }
  },
  "checkABN": function checkABN(str) {
    var weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
    var checksum;
    if (!str || str.length !== 11) {
      return false;
    }
    checksum = R.pipe(
      R.split(''),
      R.map(function toNumber(digitStr) {
        return Number(digitStr);
      }),
      R.addIndex(R.reduce)(function reduceTo(total, digit, index) {
        if (index === 0) {
          digit = digit - 1;
        }
        return total + digit * weights[index];
      }, 0)
    )(str);
    return checksum && checksum % 89 === 0;
  },
  "validateGeocodedWaypoint": function geocodedWaypoint(attr, conf, err) {
    if (this.waypoint && (!this.lat || !this.lng)) {
      err();
    }
  },
  // Synchronously process validation for a field given a validation config.
  //
  // It is expected that the keys of validationConf correspond to the validators. For example:
  // {
  //   required: true,
  //   length: {
  //     max: 20
  //   }
  // }
  "processValidation": function processValidation(model, attr, validationConf, err) {
    R.pipe(
      R.toPairs(), // [validationKey, validationConfig]
      R.forEach(function executeValidation(valObjPair) {
        var validationType = valObjPair[0];
        var validator = validators.getValidator(validationType);
        var normalisedConfig = validators.normaliseValidationConfig(valObjPair);
        if (validator) {
          validator.call(model, attr, normalisedConfig, err);
        } else {
          console.warn("Could not find a " + validationType + " validator for " + attr);//eslint-disable-line no-console
        }
      })
    )(validationConf);
  },
  // Returns a comparator object that will compare two values.
  // For example `comparator()["<"](3, 6)` returns `true`.
  "comparator": function comparator() {
    return {
      "===": function eq(x, y) {
        return x === y;
      },
      "!==": function eq(x, y) {
        return x !== y;
      },
      "<": function lt(x, y) {
        return x < y;
      },
      "<=": function lte(x, y) {
        return x <= y;
      },
      ">": function gt(x, y) {
        return x > y;
      },
      ">=": function gte(x, y) {
        return x >= y;
      }
    };
  },
  //check weather value contains between two paramerters
  "validateContains": function validateRequired(attr, conf, err) {
    var value = this[attr];
    if (!R.isNil(value) && !R.isNil(conf._value) && R.contains(value, conf._value)) {
      err(conf.message);
    }
  }
};

module.exports = validators;
