"use strict";
import Immutable from 'immutable';
import R from 'ramda';
import moment from 'moment';
import * as validation from '../libraries/validation';
import {logger} from '../globals';

export function coerceToFieldType(fieldValue, recordField) {
  //fieldSchema will be undefined for relation fields
  if (R.isNil(fieldValue) || R.isNil(recordField)) {
    return null;
  }
  const fieldType = recordField.getIn(["validation", "type"]) || "__";
  switch (fieldType) {
    case "string":
      return fieldValue + "";
    case "number":
      if (R.is(Number, fieldValue)) {
        return fieldValue;
      }
      if (R.is(Boolean, fieldValue)) {
        return fieldValue ? 1 : 0;
      }
      return Number(fieldValue);
    case "boolean":
      if (R.is(Boolean, fieldValue)) {
        return fieldValue;
      }
      return Boolean(fieldValue);
    default:
      return fieldValue;
  }
}

/**
 * @param {Array} validationConfigJS - the validation configuration consisting of an array of objects each representing
 * a single store. In the object contains a key called pageFields which is an array of objects with each object
 * containing a map of fields with a validation flag. The index of the object represents the page/tab number. The object
 * must also contain the activeRecord key providing an object with the source information to determine the validation
 * status of each field.
 * @returns {Array} validationConfig with valid flags updated
 */
export function validationConfigValidate(validationConfigJS) {
  return R.map(
    (storeValidations) => {
      var activeRecord = storeValidations.activeRecord || {}, embeddedFieldName, embeddedRecords;
      if (R.keys(activeRecord).length === 0) {
        storeValidations.pageFields = [];
      }
      if (storeValidations.hasOwnProperty("pagePerEmbeddedRecord")) {
        embeddedFieldName = storeValidations.pagePerEmbeddedRecord;
        //get records
        embeddedRecords = activeRecord[embeddedFieldName];
        //append page for each record
        storeValidations.pageFields = R.addIndex(R.reduce)(
          (finalPageFields, embeddedRecord, idx) => {
            return R.append(R.assoc(embeddedFieldName, idx, {}), finalPageFields);
          },
          storeValidations.pageFields,
          embeddedRecords
        );
      }
      storeValidations.pageFields = R.map((page) => (R.mapObjIndexed(
          (validFlagOrEmbeddedArrIdx, pageField) => {
            var storeFieldStatus = activeRecord[pageField];
            if (R.is(Number, validFlagOrEmbeddedArrIdx)) {
              //return validation status for record at provided index
              return fieldOrEmbeddedFieldHasValidationError(storeFieldStatus[validFlagOrEmbeddedArrIdx]);
            }
            return fieldOrEmbeddedFieldHasValidationError(storeFieldStatus);
          },
          page)
      ), R.defaultTo([R.map(() => (true), activeRecord)], storeValidations.pageFields)); //R.mapObject
      return storeValidations;
    },
    validationConfigJS
  );
}
export function fieldOrEmbeddedFieldHasValidationError(embeddedStoreField) {
  if (R.is(Object, embeddedStoreField)) {
    return R.pipe(
      R.toPairs,
      R.map((storeFieldPair) => (fieldOrEmbeddedFieldHasValidationError(storeFieldPair[1]))),
      R.any((errorStatus) => (errorStatus))
    )(embeddedStoreField);
  }
  if (R.is(Array, embeddedStoreField)) {
    return R.pipe(
      R.map((storeFields) => (fieldOrEmbeddedFieldHasValidationError(storeFields))),
      R.any((errorStatus) => (errorStatus))
    )(embeddedStoreField);
  }
  return embeddedStoreField; //error status at leaf
}

export function getInvalidPagesFromValidationConfig(validationConfigJS) {
  return R.pipe(
    validationConfigValidate,
    //get array of page field objects arrays containing true/false depending on whether page contains invalid fields
    //return array of page arrays
    R.map(storeValidations => (R.map(
      //find any field with true (invalid) and return true for the entire page or false
      (fieldsOnPage) => {
        return R.pipe(
          R.toPairs,
          R.any(fieldPair => (fieldPair[1]))
        )(fieldsOnPage);
      },
      R.defaultTo([], storeValidations.pageFields)
    ))),
    R.reduce(
      (finalPageFields, pageFields) => {
        const finalPageFieldsLength = finalPageFields.length;
        const pageFieldsLength = pageFields.length;
        if (finalPageFieldsLength > pageFieldsLength) {
          return R.addIndex(R.map)(
            (pageInvalid, pageIdx) => {
              return pageInvalid || (pageIdx < pageFieldsLength ? pageFields[pageIdx] : false);
            },
            finalPageFields
          );
        }
        return R.addIndex(R.map)(
          (pageInvalid, pageIdx) => {
            return pageInvalid || (pageIdx < finalPageFieldsLength ? finalPageFields[pageIdx] : false);
          },
          pageFields
        );
      },
      []
    )
  )(validationConfigJS);
}

export function getFirstPageWithError(validationConfig) {
  return findFirstPageWithError(getInvalidPagesFromValidationConfig(validationConfig));
}

export function findFirstPageWithError(pagesWithErrors) {
  let firstPage = null;
  R.addIndex(R.forEach)(
    (pageHasError, pageIdx) => {
      if (firstPage !== null) {
        return firstPage;
      }
      if (pageHasError) {
        firstPage = pageIdx;
      }
    },
    pagesWithErrors
  );
  return firstPage;
}

/**
 * Indicates if whether the current record or an audit record is active.
 * @param {Immutable} store - current model store
 * @return {boolean} true if the current record is active; false if an audit record is active.
 */
export function isCurrentRecordActive(store) {
  return R.isNil(store.getIn(['auditCollection', 'activeRecordIndex'])) ||
    store.getIn(['auditCollection', 'activeRecordIndex']) === -1;
}

/**
 * @param {Immutable} store - current model store
 * @param {Array} [embeddedPath] - the embedded store model path local to the store
 * @returns {Array} path to the store model or embedded store model (global path)
 */
export function getActiveRecordPath(store, embeddedPath) {
  const isCurrentRecord = isCurrentRecordActive(store);
  const propsPath = isCurrentRecord ? 'props' : 'auditProps';
  const recordsPath = isCurrentRecord ? 'records' : 'auditRecords';

  const activeRecordIndex = store.getIn([propsPath, 'activeRecordIndex']);
  return R.is(Array, embeddedPath) && embeddedPath.length > 0
    ? R.concat([recordsPath, activeRecordIndex], embeddedPath)
    : [recordsPath, activeRecordIndex];
}

export function hasChangesToSave(store) {
  return store.getIn(["props", "save", "hasChangesToSave"]);
}

/**
 * Get the active record from the store or embedded record within active record
 * @param {Immutable} store - current model store
 * @param {Array} [embeddedPath] - the embedded store model path local to the store
 * @returns {Immutable} active record or embedded record within active record
 */
export function getActiveRecord(store, embeddedPath) {
  return store.getIn(getActiveRecordPath(store, embeddedPath));
}

/**
 * Set the active record from the store or embedded record within active record
 * @param {Immutable} store - current store model
 * @param {Array} [embeddedPath] - the embedded store model path local to the store
 * @param {Immutable} record or embedded record
 * @returns {Immutable} store model with active record or embedded record within active record set
 */
export function setActiveRecord(store, embeddedPath, record) {
  return store.setIn(getActiveRecordPath(store, embeddedPath), record);
}

/**
 * @param {Array} [embeddedPath] - the embedded store model path local to the store
 * @returns {Array} path to the store model or embedded store model (global path) when Immutable converted to JS
 */
export function embeddedPathToJS(embeddedPath) {
  return R.pipe(
    R.defaultTo([]),
    R.filter((pathPart) => (pathPart !== 'value'))
  )(embeddedPath);
}

/**
 * @param {Array} [embeddedPath] - the embedded store model path local to the store
 * @returns {String} field name of property containing the last embedded model in embeddedPath
 */
export function getFieldNameFromEmbeddedPath(embeddedPath) {
  var _embeddedPath = R.defaultTo([], embeddedPath);
  if (_embeddedPath.length === 1) {
    return _embeddedPath[0];
  }
  if (_embeddedPath.length > 1
    && _embeddedPath[_embeddedPath.length - 1] === 'value'
    && !R.is(Number, _embeddedPath[_embeddedPath.length - 2])) {
    return _embeddedPath[_embeddedPath.length - 2];
  }
  if (_embeddedPath.length > 2
    && _embeddedPath[_embeddedPath.length - 1] === 'value'
    && R.is(Number, _embeddedPath[_embeddedPath.length - 2])) {
    return _embeddedPath[_embeddedPath.length - 3];
  }
  if (_embeddedPath.length > 2
    && _embeddedPath[_embeddedPath.length - 2] === 'value'
    && R.is(Number, _embeddedPath[_embeddedPath.length - 1])) {
    return _embeddedPath[_embeddedPath.length - 3];
  }
  return null;
}

/**
 * @param {Immutable} store - current store
 * @param {Array} [embeddedPath] - the embedded store model path local to the store
 * @returns {Array} path to the store model or embedded store model (global path)
 */
export function findEmbeddedModelSchemaId(store, embeddedPath) {
  var fieldName = getFieldNameFromEmbeddedPath(embeddedPath);
  if (!fieldName || !store.has("embeddedModelSchema")) {
    return '';
  }
  const embeddedModelSchema = store.get("embeddedModelSchema");
  if (store.has("embeddedModelSchema") && typeof embeddedModelSchema === "undefined") {
    logger.error("An embedded model for the property '" + fieldName + "' is specified but no model schema was found. "
      + "Check the configuration of the model '" + store.getIn(["serverModel", "name"]) + "' "
      + "(referenced by the '" + store.get("name") + "' store).");
  }
  return R.pipe(
    R.toPairs,
    R.filter(pair => {
      return !R.isNil(R.path(['relations', fieldName], R.defaultTo({}, pair[1])));
    }),
    R.ifElse(R.isEmpty,
      () => (''),
      R.pipe(
        R.head,
        R.last,
        R.path(['relations', fieldName, 'model'])
      ))
  )(embeddedModelSchema.toJS());
}


/**
 * Get the store model template for the store model or embedded store model
 * @param {Immutable} store - current store
 * @param {Array} [embeddedPath] - the embedded store model path local to the store
 * @returns {Array} path to the store model schema or embedded store model schema
 */
export function getRecordTemplate(store, embeddedPath) {
  var embeddedModelSchemaId;
  if (R.isNil(embeddedPath) || embeddedPath.length === 0) {
    return store.get("recordTemplate");
  }
  embeddedModelSchemaId = findEmbeddedModelSchemaId(store, embeddedPath);
  if (store.hasIn(["embeddedModels", embeddedModelSchemaId])) {
    return store.getIn(["embeddedModels", embeddedModelSchemaId]);
  }
  logger.warn("recordUtils: Failed to get a record template for " + embeddedPath +
    ". Check the embedded model is declared in embeddedModelSchema->model->relations.");
  return Immutable.fromJS({});
}

export function recordsToJS(store) {
  var _hiddenFields = R.defaultTo([], store.getIn(['hidden', 'record']).toJS());
  var recordsJS = store.get('records')
    .map(
      record => (R.omit(_hiddenFields, getRecordValues(record).toJS()))
    ).toJS();
  return R.filter((record) => (!R.isNil(record.id)), recordsJS);
}

export function recordsFromJS(store, records, freshRecord) {
  return Immutable.List(R.map(record => setRecordValues(store, record, null, freshRecord), R.defaultTo([], records)));
}

/**
 * Get store record consisting of value properties only (deeply parses embedded models)
 * @param {Immutable} storeRecord - the UI store model record
 * @returns {Immutable} storeRecord consisting of value properties only
 */
export function getRecordValues(storeRecord) {
  //NB: Immutable.Map.map function will replace map value and maintain the map (object) key
  return storeRecord.map((prop) => {
    //prop.getIn(['validation', 'type']) seems to return undefined if not found so for embedsMany relations the
    //prop will be returned by prop.get('value') which is the required outcome
    if ((prop.getIn(['validation', 'type']) === 'JSON' || prop.getIn(['validation', 'type']) === 'object')
      && Immutable.Map.isMap(prop.get('value'))) {
      return getRecordValues(prop.get('value'));
    }
    if (prop.getIn(['validation', 'type']) === 'array' && Immutable.List.isList(prop.get('value'))) {
      //NB: Immutable.List.map function will replace list value in list position
      return prop.get('value').map((storeModelInArray) => (getRecordValues.call(this, storeModelInArray)));
    }
    return prop.get('value');
  });
}

/**
 * Get store fields with hasChangesToSave (NB: does not deeply parse embedded models)
 * @param {Immutable} storeRecord - the UI store model record
 * @returns {Array} fields with hasChangesToSave set to true
 */
export function getRecordFieldsHasChangesToSave(storeRecord) {
  return storeRecord
    .filter((prop) => (prop.get('hasChangesToSave') === true))
    .reduce((acc, val, key) => (R.append(key, acc)), []);
}

/**
 * Get store record consisting of value properties only (deeply parses embedded models)
 * @param {Array} storeRecordJS - the UI store model record
 * @returns {Immutable} storeRecord consisting of value properties only
 */
export function getRecordValuesFromJS(storeRecordJS) {
  return R.map(
    (prop) => {
      if (!R.isNil(prop) && !R.isNil(prop.validation)
        && (prop.validation.type === 'JSON' || prop.validation.type === 'object') && R.is(Object, prop.value)) {
        return getRecordValuesFromJS(prop.value);
      }
      if (!R.isNil(prop) && !R.isNil(prop.validation)
        && prop.validation.type === 'array' && R.is(Array, prop.value)) {
        return R.map(
          (storeModelInArray) => (getRecordValuesFromJS(storeModelInArray)),
          prop.value
        );
      }
      if (!R.isNil(prop) && !R.isNil(prop.value) && !R.isNil(prop.validation)
        && prop.validation.type === 'date' && moment(prop.value).isValid()) {
        return moment(prop.value).toDate();
      }
      return !R.isNil(prop) && prop.hasOwnProperty("value") ? prop.value : null;
    },
    storeRecordJS || []
  );
}

/**
 * Get store record validation errors
 * @param {Immutable} storeRecord - the UI store model record
 * @returns {Immutable} storeRecord consisting of value properties only
 */
export function getRecordValidationErrors(storeRecord) {
  let nextStoreRecord = storeRecord;
  //add properties for overall array validation status
  nextStoreRecord.forEach((prop, key) => {
    if (prop.getIn(['validation', 'type']) === 'array' && Immutable.List.isList(prop.get('value'))) {
      nextStoreRecord = nextStoreRecord.set(key + "__ARRAY", prop.setIn(['validation', 'type'], '__ARRAY'));
    }
  });
  //NB: Immutable.Map.map function will replace map value and maintain the map (object) key
  return nextStoreRecord.map((prop) => {
    if (!prop.getIn) { // A value rather than Immutable object
      return false;
    }
    if ((prop.getIn(['validation', 'type']) === 'JSON' || prop.getIn(['validation', 'type']) === 'object')
      && Immutable.Map.isMap(prop.get('value'))) {
      return getRecordValidationErrors(prop.get('value'));
    }
    if (prop.getIn(['validation', 'type']) === 'array' && Immutable.List.isList(prop.get('value'))) {
      //NB: Immutable.List.map function will replace list value in list position
      return prop.get('value').map((storeModelInArray) => (getRecordValidationErrors.call(this, storeModelInArray)));
    }
    return prop.get('error').length > 0 && prop.get('showError');
  });
}

/**
 * Set validation messages on the active record based on server validation (NB: does not deeply parse embedded
 * models). The fields will have their showError and touched flags set to true, and hasChanged flag set to false.
 * @param {Immutable} store - the current model store
 * @param {Object} errorMessages - the server validation messages
 * @param {Array} [fields] - the fields
 * @returns {Immutable} - store consisting of error properties set based on validation
 */
export function serverValidateActiveRecord(store, errorMessages, fields) {
  var nextStore = store;
  var activeRecordPath = getActiveRecordPath(store); //getActiveRecord Path
  var invalidatedFields = R.keys(errorMessages);

  //clear validating flag on provided fields, touch all fields and reset all asyncValidationError flags
  if (fields && fields.length > 0) {
    R.map((field) => {
      var fieldPath = R.concat(activeRecordPath, [field]);
      if (nextStore.hasIn(fieldPath)) {
        nextStore = nextStore
          .setIn(R.concat(fieldPath, ['asyncValidationError']), false)
          .setIn(R.concat(fieldPath, ['showValidating']), false)
          .setIn(R.concat(fieldPath, ['touched']), true);
      }
    }, fields);
  }

  //apply validation error messages from server
  R.mapObjIndexed((errorMessageArr, field) => {
    var fieldPath = R.concat(activeRecordPath, [field]);
    if (nextStore.hasIn(fieldPath)) {
      nextStore = nextStore
        .setIn(R.concat(fieldPath, ['error']), R.join(", and ", errorMessageArr) + ".")
        .setIn(R.concat(fieldPath, ['asyncValidationError']), true)
        .setIn(R.concat(fieldPath, ['showError']), true);
    }
  }, errorMessages);

  //@todo check the tab property changes made by this method
  nextStore = nextStore
    .setIn(["props", "tabs", "storeInvalidFields"], invalidatedFields)
    .setIn(["props", "tabs", "pagesWithErrors"], []);
  return nextStore;
}

/**
 * Validate the fields within the active record from the store or embedded record within active record
 * - sets the touched flag to true to ensure error messages are shown for all fields with an error
 * @param {Immutable} store - current model store
 * @param {Array} [embeddedPath] - the embedded store model path local to the store
 * @param {Array} fields - the fields to validate
 * @param {Boolean} [touched=true] - touch the fields before validation
 * @returns {Immutable} store with fields within active record validated and touched flag set to true or provided value
 */
export function validateStoreActiveRecord(store, embeddedPath, fields, touched) {
  var nextStore = store;
  var nextRecord = getActiveRecord(nextStore, embeddedPath);
  nextRecord = setRecordFields(nextRecord, fields, "touched", R.defaultTo(true, touched));
  nextRecord = setAndValidateRecord(nextRecord, fields);
  return setActiveRecord(nextStore, embeddedPath, nextRecord);
}


/**
 * Validate the fields within the active record from the store or embedded record within active record
 * @param {Immutable} store - current model store
 * @param {Array} [embeddedPath] - the embedded store model path local to the store
 * @param {Array} fields - the fields to validate
 * @param {Boolean} [touched] - flag whether the touched property per field should be set
 * @returns {Immutable} next store with validation for active record reset
 */
export function resetActiveRecordValidation(store, embeddedPath, fields, touched) {
  var nextStore = store;
  var nextRecord = getActiveRecord(nextStore, embeddedPath);
  nextRecord = resetRecordValidation(nextRecord, fields, touched);
  return setActiveRecord(nextStore, embeddedPath, nextRecord);
}

/**
 * Reset the store model properties (deeply parses embedded models)
 * Reset will return the same store model if already reset.
 * @param {Immutable} storeRecord - the current state store model
 * @param {Array} [fields] - the fields to reset
 * @param {Boolean} [touched] - flag whether the touched property per field should be set
 * @returns {Immutable} - store model error properties reset
 */
export function resetRecordValidation(storeRecord, fields, touched) {
  let nextStoreRecord = storeRecord;

  //Reset on array type fields at root of the storeRecord - bypassed by recordUpdateDeep
  nextStoreRecord = recordUpdateArrayFields(
    nextStoreRecord,
    /*Callback for List array values (type=array)*/
    (_field) => (_field
        .set("error", "")
        .set("showError", false)
        .set("touched", R.defaultTo(_field.get("touched"), touched))
    ),
    fields
  );

  return recordUpdateDeep(
    nextStoreRecord,
    /*Callback for Map object values (type=JSON or object)*/
    (_fieldValue) => (resetRecordValidation.call(this, _fieldValue, null, touched)),
    /*Callback for List array values (type=array)*/
    (_embeddedStoreModel) => (resetRecordValidation.call(this, _embeddedStoreModel, null, touched)),
    /*Callback for leaf values*/
    (_field) => (_field
        .set("error", "")
        .set("showError", false)
        .set("touched", R.defaultTo(_field.get("touched"), touched))
    ),
    fields
  );
}

export function resetRecord(storeRecord, fields, touched) {
  let nextStoreRecord = storeRecord;

  //Reset on array type fields at root of the storeRecord - bypassed by recordUpdateDeep
  nextStoreRecord = recordUpdateArrayFields(
    nextStoreRecord,
    /*Callback for List array values (type=array)*/
    (_field) => (resetField(_field)),
    fields
  );

  return recordUpdateDeep(
    nextStoreRecord,
    /*Callback for Map object values (type=JSON or object)*/
    (_fieldValue) => (resetRecord.call(this, _fieldValue, null, touched)),
    /*Callback for List array values (type=array)*/
    (_embeddedStoreModel) => (resetRecord.call(this, _embeddedStoreModel, null, touched)),
    /*Callback for leaf values*/
    (_field) => (resetField(_field)),
    fields
  );
}

/**
 * Update the store model hasChangesToSave property (deeply parses embedded models)
 * @param {Immutable} storeRecord - the current state store model
 * @param {Array} [fields] - the fields to reset
 * @param {Boolean} [hasChangesToSave] - flag whether the hasChangesToSave property per field should be set
 * @returns {Immutable} - store model hasChangesToSave property set
 */
export function updateRecordHasChangesToSave(storeRecord, fields, hasChangesToSave) {
  let nextStoreRecord = storeRecord;

  //Reset on array type fields at root of the storeRecord - bypassed by recordUpdateDeep
  nextStoreRecord = recordUpdateArrayFields(
    nextStoreRecord,
    /*Callback for List array values (type=array)*/
    (_field) => (_field
        .set("hasChangesToSave", R.defaultTo(_field.get("hasChangesToSave"), hasChangesToSave))
    ),
    fields
  );

  return recordUpdateDeep(
    nextStoreRecord,
    /*Callback for Map object values (type=JSON or object)*/
    (_fieldValue) => (resetRecordValidation.call(this, _fieldValue, null, hasChangesToSave)),
    /*Callback for List array values (type=array)*/
    (_embeddedStoreModel) => (resetRecordValidation.call(this, _embeddedStoreModel, null, hasChangesToSave)),
    /*Callback for leaf values*/
    (_field) => (_field
        .set("hasChangesToSave", R.defaultTo(_field.get("hasChangesToSave"), hasChangesToSave))
    ),
    fields
  );
}

/**
 *
 * @param {Immutable.Map} storeRecord
 * @param {Function} callback
 * @param {Array} fields optional specific fields to target
 */
export function updateRecordDeep(storeRecord, callback, fields = []) {
  return updateFieldsDeep(
    storeRecord,
    fieldValue => updateRecordDeep.call(this, fieldValue, callback, fields),
    embeddedStoreModel => updateRecordDeep.call(this, embeddedStoreModel, callback, fields),
    callback,
    fields
  );
}

// @todo can recordUpdateDeep use this implementation? Main difference is that leafCallback is invoked on all fields
// and not just leafs
function updateFieldsDeep(record, mapCallback, listCallback, leafCallback) {
  if (record.size === 0) {
    return record;
  }
  return record.withMutations(mutableStoreModel => {
    record
      .forEach((_field, fieldName) => {
        var _fieldUpdate = _field;
        var _fieldValue = _field.get('value');
        var _fieldValueUpdate = _fieldValue;
        if (!_field.has('value')) {
          //not a record property so return without any changes
          return;
        } else if (_field.getIn(['relation', 'embeddedModel']) === true
          && (_field.getIn(['validation', 'type']) === 'JSON' || _field.getIn(['validation', 'type']) === 'object')
          && Immutable.Map.isMap(_fieldValue)) {
          _fieldValueUpdate = mapCallback(_fieldValue, fieldName);
          _fieldUpdate = leafCallback(_field, fieldName);
        } else if (_field.getIn(['relation', 'embeddedModel']) === true
          && _field.getIn(['validation', 'type']) === 'array'
          && Immutable.List.isList(_fieldValue)) {
          //an embedded array
          _fieldValueUpdate = _fieldValue.withMutations(mutableStoreModelList => {
            _fieldValue
              .forEach((_embeddedStoreModel, idx) => {
                var _embeddedStoreModelUpdate = listCallback(_embeddedStoreModel, idx, fieldName);
                if (_embeddedStoreModelUpdate !== _embeddedStoreModel) {
                  mutableStoreModelList.set(idx, _embeddedStoreModelUpdate);
                }
              });
          });
          _fieldUpdate = leafCallback(_field, fieldName);
        } else {
          _fieldUpdate = leafCallback(_field, fieldName);
        }
        if (_field !== _fieldUpdate) {
          mutableStoreModel.set(fieldName, _fieldUpdate);
          _field = _fieldUpdate;
        }
        if (_fieldValue !== _fieldValueUpdate) {
          mutableStoreModel.set(fieldName, _field.set('value', _fieldValueUpdate));
        }
      });
  });
}

export function resetField(field, value) {
  return field.withMutations(mutableField => {
    mutableField
      .set("hide", false)
      .set("error", "")
      .set("showValidating", false)
      .set("asyncValidationError", false)
      .set("touched", false)
      .set("showError", false)
      .set("value", R.defaultTo(null, value));
  });
}

/**
 * Validate the record and return the validated record and a flag indicating whether any validation errors exist
 * @param {Immutable} storeRecord - the current state store record
 * @param {Array} [fields] - the fields to validate
 * @returns {Object} - consisting of two keys
 * {Immutable} return.validatedRecord - the validated record (with touched flag set on all validated fields)
 * {Boolean} return.validationError - flag indicating whether any validation errors exist
 */
export function validateRecordAndFlagAnyError(storeRecord, fields) {
  var activeRecord = storeRecord;
  //check validation
  var resetActiveRecord = resetRecordValidation(
    activeRecord,
    fields,
    true
  );
  activeRecord = setAndValidateRecord(
    resetActiveRecord, //use this record as base to check for changes
    fields
  );
  return {
    "validatedRecord": activeRecord,
    "validationError": resetActiveRecord !== activeRecord
  };
}

/**
 * Set store model values (if provided) and re-validate the store model (deeply parses embedded models).
 * Store model values are not set on embedded models subordinate to the store model provided.
 * Re-validation is performed on embedded models subordinate to the store model provided.
 * @param {Immutable} storeRecord - the current state store record
 * @param {Array} [fields] - the fields to validate / set (does not apply to embedded models subordinate to the
 * store model provided.
 * @param {Object} [values] - an object map containing field-value pairs containing the values to set
 * @returns {Immutable} - store record consisting of key, value and error properties set based on validation and
 * optional provided values
 */
export function setAndValidateRecord(storeRecord, fields, values) {
  let nextStoreRecord = storeRecord;
  // Get storeModelValues now to prevent multiple invocations in callback for leaf values
  const recordValues = R.defaultTo(getRecordValues(nextStoreRecord).toJS(), values);
  const setValues = !R.isNil(values);
  //run validations on array type fields at root of the storeRecord - bypassed by recordUpdateDeep
  nextStoreRecord = recordUpdateArrayFields(
    nextStoreRecord,
    /*Callback for List array values (type=array)*/
    (_field) => (setAndValidateField(
      _field,
      _field.get('value'),
      recordValues,
      false)), //do not want to set the value of embedded array
    fields
  );

  return recordUpdateDeep(
    nextStoreRecord,
    /*Callback for Map object values (type=JSON or object)*/
    (_embeddedStoreModel) => (setAndValidateRecord.call(
      this,
      _embeddedStoreModel
    )),
    /*Callback for List array values (type=array)*/
    (_embeddedStoreModel) => (setAndValidateRecord.call(
      this,
      _embeddedStoreModel
    )),
    /*Callback for leaf values*/
    (_field, _fieldName) => (setAndValidateField(
      _field,
      setValues ? values[_fieldName] : _field.get('value'),
      recordValues,
      setValues)),
    fields
  );
}

/**
 * Set the store model field and validate
 * @param {Immutable} recordField - the UI store model field
 * @param {String} fieldValue - the field value
 * @param {Object} recordValues - object map of field-value pairs for all values in the store model
 * @param {Boolean} [setValue=true] - set value
 * @returns {Immutable} storeRecord field with selected field value set and validated
 */
export function setAndValidateField(recordField, fieldValue, recordValues, setValue) {
  var _fieldValue = coerceToFieldType(fieldValue, recordField);
  var errorMsg = validation.validate(
    recordField,
    _fieldValue,
    recordValues
  );
  //asyncValidationError takes precedence if field value has not been changed
  if (recordField.get("value") === _fieldValue && recordField.get("asyncValidationError")) {
    return recordField;
  }
  return recordField
    .set("error", errorMsg)
    .set("showError", errorMsg.length > 0 && recordField.get("touched"))
    .set("value", R.defaultTo(true, setValue) ? _fieldValue : recordField.get("value"));
}


/**
 * Set the store model field
 * @param {Immutable} recordField - the UI store model field
 * @param {String} fieldValue - the field value
 * @param {Object} recordValues - object map of field-value pairs for all values in the store model
 * @returns {Immutable} storeRecord field with selected field value set
 */
export function setField(recordField, fieldValue) {
  const _fieldValue = coerceToFieldType(fieldValue, recordField);
  const currentValue = recordField.get("value");
  return recordField
    .set("value", _fieldValue)
    .set("hasChangesToSave", currentValue !== _fieldValue);
}

/**
 * Set the store model record field properties (deeply parses embedded models)
 * @param {Immutable} storeRecord - the current state store model
 * @param {Array} [fields] - the fields to set
 * (root level filtered only - all fields on embedded records will be affected)
 * @param {String} [property] - the field property to be set
 * @param {*} [value] - the field value set on field property
 * @returns {Immutable} - store record with the property of each record field set with supplied value
 */
export function setRecordFields(storeRecord, fields, property, value) {
  return recordUpdateDeep(
    storeRecord,
    /*Callback for Map object values (type=JSON or object)*/
    (_fieldValue) => (setRecordFields.call(this, _fieldValue)),
    /*Callback for List array values (type=array)*/
    (_embeddedStoreModel) => (setRecordFields.call(this, _embeddedStoreModel)),
    /*Callback for leaf values*/
    (_field) => (_field
        .set(property, value)
    ),
    fields
  );
}

/**
 * Add new record to the records in the store (only if the last record does not have an empty id) and return model
 * @param {Immutable} model - the current state model
 * @param {Object} action - the action containing store id
 * @param {Array} [embeddedPath] - the embedded store model path local to the store
 * @return {Immutable} - the next model with the new record added to the end of the records list of action store
 */
export function newRecord(model, action, embeddedPath) {
  var nextStore = addNewRecordToStore(model.getIn(['stores', action.storeId]), embeddedPath);
  var lastIndex = nextStore.get('records').size - 1;
  return model
    .setIn(['stores', action.storeId], nextStore)
    .setIn(['stores', action.storeId, 'props', 'activeRecordIndex'], lastIndex);
}

/**
 * Add new record to the records in the store (only if the last record does not have an empty id)
 * @param {Immutable} store - the current state store model
 * @param {Array} [embeddedPath] - the embedded store model path local to the store
 * @return {Immutable} - the next store with the new record added to the end of the records list
 */
export function addNewRecordToStore(store, embeddedPath) {
  var records, embeddedRecords;

  if (!R.isNil(embeddedPath)) {
    embeddedRecords = getActiveRecord(store, embeddedPath);
    embeddedRecords = addNewRecordToRecords(store, embeddedPath, embeddedRecords);
    return setActiveRecord(store, embeddedPath, embeddedRecords);

  }
  records = store.get('records');
  records = addNewRecordToRecords(store, embeddedPath, records);
  return store.set('records', records);
}


export function addNewRecordToRecords(store, embeddedPath, records) {
  var lastIndex, lastRecordId, nextRecord;
  if (!Immutable.List.isList(records)) {
    return records;
  }
  lastIndex = records.size - 1;
  //only add new record if this is the first record or the last record does not have an empty id
  if (lastIndex > -1) {
    lastRecordId = records.getIn([lastIndex, 'id', 'value']);
    if (R.isNil(lastRecordId)) { // || lastRecordId === ''
      return records;
    }
  }
  nextRecord = getRecordTemplate(store, embeddedPath);
  return records.push(nextRecord);
}


/**
 * Remove record from the records in the store and set active record to previous or last
 * @param {Immutable} store - the current state store model
 * @return {Immutable} - the next store with the new record added to the end of the records list
 */
export function removeActiveRecord(store) {
  var records = store.get('records');
  var activeRecordIndex = store.getIn(['props', 'activeRecordIndex']);
  var nextActiveRecord = activeRecordIndex === 0 ? 0 : activeRecordIndex - 1;
  //only remove record if last record does not have an empty id
  if (activeRecordIndex < 0) {
    return store;
  }
  return store
    .setIn(['props', 'activeRecordIndex'], nextActiveRecord)
    .set('records', records.remove(activeRecordIndex));
}

/**
 * Set a local id (non-server) on the active record (if it doesn't already have an id)
 * @param {Immutable} records - the current records
 * @param {Immutable} storeRecord - a record in the store
 * @return {Immutable} - the next storeRecord with the new local id (if it didn't already have an id)
 */
export function setLocalIdOnRecord(records, storeRecord) {
  var currentRecordId = storeRecord.getIn(['id', 'value']);
  var nextRecordId = getNextLocalId(records, true);
  //only add new record if last record has an empty id
  if (!R.isNil(currentRecordId)) {
    return storeRecord;
  }
  return storeRecord.setIn(['id', 'value'], nextRecordId);
}

/**
 * For temporary storage of records locally generate an id based on the range -1 to -Infinity
 * @param {Object[]} records - an array of records
 * @param {boolean} [immutableRecords=false] - a flag indicating if the provided records are immutable
 * @returns {Integer} next locally generated id (always a negative value) or -1 if collectionRecords undefined
 */
export function getNextLocalId(records, immutableRecords) {
  var _immutableRecords = R.defaultTo(false, immutableRecords);
  let nextLargestId = -1, lastRecordId, lastRecord = null;
  if (_immutableRecords && records && records.size && records.size > 0) {
    nextLargestId = 0 - (records.size + 1);
    lastRecordId = records.getIn([records.size - 1, 'id', 'value']);
    if (R.is(Number, lastRecordId) && lastRecordId <= nextLargestId) {
      nextLargestId = lastRecordId - 1;
    }
  } else if (!_immutableRecords && records && records.length && records.length > 0) {
    nextLargestId = 0 - (records.length + 1);
    lastRecord = records[records.length - 1];
    if (!R.isNil(lastRecord) && R.is(Number, lastRecord.id) && lastRecord.id <= nextLargestId) {
      nextLargestId = lastRecord.id - 1;
    }
  }
  return nextLargestId;
}

/**
 * Set the fields within the active record from the store or embedded record within active record
 * (deeply parses embedded models and also runs field validation)
 * @param {Immutable} store - current model store
 * @param {Object[]} [values] - key-value map for the record at the embeddedPath
 * @param {Array} [embeddedPath] - the embedded store model path local to the store
 * @returns {Immutable} store with field values within active record set/updated
 */
export function setStoreActiveRecordValues(store, values, embeddedPath) {
  var nextStore = store;
  var nextRecord = setRecordValues(nextStore, values, embeddedPath);
  return setActiveRecord(nextStore, embeddedPath, nextRecord);
}


export function hydrateRecordsFromJS(store, values, embeddedPath, freshRecord, recordTemplate) {
  return Immutable.List(
    R.map(
      record => setRecordValues(store, record, embeddedPath, freshRecord, recordTemplate),
      R.defaultTo([], values)
    )
  );
}

/**
 * Update store model with an array of values (deeply parses embedded models and also runs field validation)
 * @param {Immutable} store - the current store
 * @param {Object[]} [values] - key-value map for the record at the embeddedPath
 * @param {Array} [embeddedPath] - path to embedded record
 * @param {Boolean} [freshRecord] - true to derived records from the active store record or false to derive records
 *   from then record template
 * @returns {Immutable} record with provided field values set and validated
 */
export function setRecordValues(store, values, embeddedPath, freshRecord, recordTemplate) {
  var _objValues = R.is(Object, values) ? values : {};
  var _embeddedPath = R.defaultTo([], embeddedPath);
  var recordPath = getActiveRecordPath(store, _embeddedPath);
  var fields = R.keys(_objValues);
  var record;
  //NB: value at record path maybe null
  if (!freshRecord && store.hasIn(recordPath) && store.getIn(recordPath) && store.getIn(recordPath).size > 0) {
    record = store.getIn(recordPath);
  } else if (R.isNil(recordTemplate)) {
    record = getRecordTemplate(store, _embeddedPath); //create record
  } else {
    record = recordTemplate; //create record
  }
  //add place holder records for array properties
  record = record.map((_field, fieldName) => {
    var _fieldValue = _field.get('value');
    var _objFieldValue = _objValues[fieldName];
    var _embeddedPathField = R.concat(_embeddedPath, [fieldName, 'value']);
    var _newRecordTemplate;
    if (Immutable.List.isList(_fieldValue)
      && R.is(Array, _objFieldValue)
      && _fieldValue.size !== _objFieldValue.length) {
      if (_objFieldValue.length > _fieldValue.size) {
        _newRecordTemplate = getRecordTemplate(store, _embeddedPathField);
        R.times(() => {
          _fieldValue = _fieldValue.push(_newRecordTemplate);
        }, _objFieldValue.length - _fieldValue.size);
        _field = _field.set('value', _fieldValue);
      } else {
        _field = _field.set('value', _fieldValue.setSize(_objFieldValue.length));
      }
    }
    return _field;
  });
  store = store.setIn(recordPath, record);
  return recordUpdateDeep(
    record,
    /*Callback for Map object values (type=JSON or object)*/
    (_fieldValue, fieldName) => (setRecordValues.call(
        this,
        store,
        _objValues[fieldName],
        R.concat(_embeddedPath, [fieldName, 'value'])
      )
    ),
    /*Callback for List array values (type=array)*/
    (_embeddedStoreModel, idx, fieldName) => (setRecordValues.call(
        this,
        store,
        R.is(Array, _objValues[fieldName]) && _objValues[fieldName].length > idx ? _objValues[fieldName][idx] : {},
        R.concat(_embeddedPath, [fieldName, 'value', idx])
      )
    ),
    /*Callback for leaf values*/
    (_field, fieldName) => (_field
        .set("value", parseFieldValue(_field, _objValues[fieldName]))
        .set("error", "")
        .set("showError", false)
    ),
    fields
  );
}

export function parseFieldValue(field, value) {
  if (typeof value === 'undefined') {
    return null;
  }
  if (field.getIn(["validation", "type"]) === "date" && moment(value).isValid()) {
    return moment(value).toDate();
  }
  return value;
}


export function recordUpdateDeep(record, mapCallback, listCallback, leafCallback, fields) {
  var _fields = R.defaultTo([], fields);
  var _filterNone = _fields.length === 0;
  if (record.size === 0) {
    return record;
  }
  return record.withMutations(mutableStoreModel => {
    record
      .filter((_field, fieldName) => (_filterNone || R.contains(fieldName, _fields)))
      .forEach((_field, fieldName) => {
        var _fieldUpdate = _field;
        var _fieldValue = _field.get('value');
        var _fieldValueUpdate = _fieldValue;
        if (!_field.has('value')) {
          //not a record property so return without any changes
          return;
        } else if (_field.getIn(['relation', 'embeddedModel']) === true
          && (_field.getIn(['validation', 'type']) === 'JSON' || _field.getIn(['validation', 'type']) === 'object')
          && Immutable.Map.isMap(_fieldValue)) {
          //an embedded object
          _fieldValueUpdate = mapCallback(_fieldValue, fieldName);
        } else if (_field.getIn(['relation', 'embeddedModel']) === true
          && _field.getIn(['validation', 'type']) === 'array'
          && Immutable.List.isList(_fieldValue)) {
          //an embedded array
          _fieldValueUpdate = _fieldValue.withMutations(mutableStoreModelList => {
            _fieldValue
              .forEach((_embeddedStoreModel, idx) => {
                var _embeddedStoreModelUpdate = listCallback(_embeddedStoreModel, idx, fieldName);
                if (_embeddedStoreModelUpdate !== _embeddedStoreModel) {
                  mutableStoreModelList.set(idx, _embeddedStoreModelUpdate);
                }
              });
          });
        } else {
          _fieldUpdate = leafCallback(_field, fieldName);
        }
        if (_fieldValue !== _fieldValueUpdate) {
          mutableStoreModel.set(fieldName, _field.set('value', _fieldValueUpdate));
        } else if (_field !== _fieldUpdate) {
          mutableStoreModel.set(fieldName, _fieldUpdate);
        }
      });
  });
}

export function recordUpdateArrayFields(record, listCallback, fields) {
  var _fields = R.defaultTo([], fields);
  var _filterNone = _fields.length === 0;
  if (record.size === 0) {
    return record;
  }
  return record.withMutations(mutableStoreModel => {
    record
      .filter((_field, fieldName) => (_filterNone || R.contains(fieldName, _fields)))
      .forEach((_field, fieldName) => {
        var _fieldUpdate = _field;
        var _fieldValue = _field.get('value');
        if (_field.getIn(['relation', 'embeddedModel']) === true
          && _field.getIn(['validation', 'type']) === 'array'
          && Immutable.List.isList(_fieldValue)) {
          //an embedded array
          _fieldUpdate = listCallback(_field);
        } else {
          //not an array record property so return without any changes
          return;
        }
        if (_field !== _fieldUpdate) {
          mutableStoreModel.set(fieldName, _fieldUpdate);
        }
      });
  });
}
