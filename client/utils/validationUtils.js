"use strict";
import Immutable from 'immutable';
import {formattedDate} from '../utils';
import R from 'ramda';

//required can change so update rather than toggle validation
//keys remain the same
export function setValidationRequired(record, field, required) {
  if (R.is(Object, required)) {
    if (!Immutable.Map.isMap(record.getIn([field, "validation", "required"]))) {
      record = record.setIn([field, "validation", "required"], Immutable.fromJS({}));
    }
    R.forEach(
      (key) => {
        record = record.setIn([field, "validation", "required", key], required[key]);
      },
      R.keys(required)
    );
    return record;
  }
  return record.setIn([field, "validation", "required"], required);
}
//range can change so update rather than toggle validation
//keys remain the same
//message may be an object
export function setValidationRange(record, field, range) {
  if (R.isNil(record.getIn([field, "validation", "range"]))) {
    record = record.setIn([field, "validation", "range"], Immutable.fromJS({}));
  }
  R.forEach(
    (key) => {
      if (key === "message" && R.is(Object, range[key])) {
        if (!Immutable.Map.isMap(record.getIn([field, "validation", "range", "message"]))) {
          record = record.setIn([field, "validation", "range", "message"], Immutable.fromJS({}));
        }
        R.forEach(
          (messageKey) => {
            record = record.setIn([field, "validation", "range", key, messageKey], range[key][messageKey]);
          },
          R.keys(range[key])
        );
      } else {
        record = record.setIn([field, "validation", "range", key], range[key]);
      }
    },
    R.keys(range)
  );
  return record;
}
//keys remain the same
export function setValidationArrayAllNullOrFalseCheck(record, field, arrayAllNullOrFalseCheck) {
  if (!Immutable.Map.isMap(record.getIn([field, "validation", "arrayAllNullOrFalseCheck"]))) {
    record = record.setIn([field, "validation", "arrayAllNullOrFalseCheck"], Immutable.fromJS({}));
  }
  R.forEach(
    (key) => {
      record = record.setIn([field, "validation", "arrayAllNullOrFalseCheck", key], arrayAllNullOrFalseCheck[key]);
    },
    R.keys(arrayAllNullOrFalseCheck)
  );
  return record;
}
//keys remain the same
export function setValidationFieldUniqueness(record, field, fieldUniquenessRecord) {
  if (!Immutable.Map.isMap(record.getIn([field, "validation", "fieldUniqueness"]))) {
    record = record.setIn([field, "validation", "fieldUniqueness"], Immutable.fromJS({}));
  }
  R.forEach(
    (key) => {
      record = record.setIn([field, "validation", "fieldUniqueness", key], fieldUniquenessRecord[key]);
    },
    R.keys(fieldUniquenessRecord)
  );
  return record;
}
//keys remain the same
export function setValidationArrayLength(record, field, arrayLength) {
  if (!Immutable.Map.isMap(record.getIn([field, "validation", "arrayLength"]))) {
    record = record.setIn([field, "validation", "arrayLength"], Immutable.fromJS({}));
  }
  R.forEach(
    (key) => {
      record = record.setIn([field, "validation", "arrayLength", key], arrayLength[key]);
    },
    R.keys(arrayLength)
  );
  return record;
}
//keys remain the same
export function setValidationAnyArray(record, field, arrayAny) {
  if (!Immutable.Map.isMap(record.getIn([field, "validation", "arrayAny"]))) {
    record = record.setIn([field, "validation", "arrayAny"], Immutable.fromJS({}));
  }
  R.forEach(
    (key) => {
      record = record.setIn([field, "validation", "arrayAny", key], arrayAny[key]);
    },
    R.keys(arrayAny)
  );
  return record;
}
export function setValidationABN(record, field, abn) {
  if (!Immutable.Map.isMap(record.getIn([field, "validation", "abn"]))) {
    record = record.setIn([field, "validation", "abn"], Immutable.fromJS({}));
  }
  R.forEach(
    (key) => {
      record = record.setIn([field, "validation", "abn", key], abn[key]);
    },
    R.keys(abn)
  );
  return record;
}
//keys remain the same
//message is string only
export function setValidationFileList(record, field, fileList) {
  if (!Immutable.Map.isMap(record.getIn([field, "validation", "fileList"]))) {
    record = record.setIn([field, "validation", "fileList"], Immutable.fromJS({}));
  }
  R.forEach(
    (key) => {
      record = record.setIn([field, "validation", "fileList", key], fileList[key]);
    },
    R.keys(fileList)
  );
  return record;
}
//no message
export function setValidationInclusionIn(record, field, inclusionIn, msg) {
  let InclusionList = record.getIn([field, "validation", "inclusion", "in"]);
  if (!Immutable.List.isList(InclusionList)) {
    InclusionList = Immutable.fromJS([]);
  }
  if (msg) {
    record = record.setIn([field, "validation", "inclusion", "message"], msg);
  }
  if (InclusionList.size !== inclusionIn.length) {
    InclusionList = InclusionList.clear();
    R.forEach(
      (inclusion) => {
        InclusionList = InclusionList.push(inclusion);
      },
      inclusionIn
    );
    return record.setIn([field, "validation", "inclusion", "in"], InclusionList);
  }
  R.addIndex(R.forEach)(
    (inclusion, idx) => {
      record = record.setIn([field, "validation", "inclusion", "in", idx], inclusion);
    },
    inclusionIn
  );
  return record;
}
//no message
export function setValidationInclusionInRaw(record, field, inclusionIn) {
  R.forEach(
    (inclusion, idx) => {
      record = record.setIn([field, "validation", "inclusion", "in", idx], inclusion);
    },
    inclusionIn
  );
  return record;
}
//keys remain the same
//message is string only
export function setValidationComparison(record, field, comparison) {
  if (!Immutable.Map.isMap(record.getIn([field, "validation", "comparison"]))) {
    record = record.setIn([field, "validation", "comparison"], Immutable.fromJS({}));
  }
  R.forEach(
    (key) => {
      record = record.setIn([field, "validation", "comparison", key], comparison[key]);
    },
    R.keys(comparison)
  );
  return record;
}
//betweenComparison can change (e.g. maxDate of permitExpiry) so update rather than toggle validation
export function setValidationBetweenComparison(record, field, betweenComparison) {
  if (!Immutable.Map.isMap(record.getIn([field, "validation", "betweenComparison"]))) {
    record = record.setIn([field, "validation", "betweenComparison"], Immutable.fromJS({}));
  }
  R.forEach(
    (key) => {
      record = record.setIn([field, "validation", "betweenComparison", key], betweenComparison[key]);
    },
    R.keys(betweenComparison)
  );
  return record;
}

export function setValidationRegulerExp(record, field, formatObj) {
  if (!Immutable.Map.isMap(record.getIn([field, "validation", "format"]))) {
    record = record.setIn([field, "validation", "format"], Immutable.fromJS({}));
  }
  R.forEach(
    (key) => {
      record = record.setIn([field, "validation", "format", key], formatObj[key]);
    },
    R.keys(formatObj)
  );
  return record;
}

export function manageRecordAmendStatus(currentRecord, mutableRecord, fieldsArray) {
  let fieldStatus = mutableRecord.getIn(["status", "value"]);
  //if no current record then adding otherwise start as existing
  if (R.isNil(currentRecord)) {
    fieldStatus = "Added";
    mutableRecord.setIn(["status", "value"], fieldStatus);
  }
  if (!R.isNil(currentRecord) && fieldStatus === "Added") {
    fieldStatus = "No change";
    mutableRecord.setIn(["status", "value"], fieldStatus);
  }

  //determine if existing or updated
  if (!R.isNil(currentRecord) && R.contains(fieldStatus, ["No change", "Updated"])) {
    const isUnchanged = R.all(
      fieldConfig => {
        const field = fieldConfig.name;
        const type = fieldConfig.type;
        const currentValue = currentRecord[field];
        const updatedValue = mutableRecord.getIn([field, "value"]);
        if (type === "date") {
          return R.equals(formattedDate(currentValue), formattedDate(updatedValue));
        }
        if (type === "boolean") {
          return R.equals(R.defaultTo(false, currentValue), R.defaultTo(false, updatedValue));
        }
        return R.equals(currentValue, updatedValue);
      },
      fieldsArray
    );
    if (isUnchanged) {
      mutableRecord.setIn(["status", "value"], "No change");
    } else {
      mutableRecord.setIn(["status", "value"], "Updated");
    }
  }
  return mutableRecord;
}

//match value to recived
//keys remain the same
export function setValidationContains(record, field, contains) {
  if (R.is(Object, contains)) {
    if (!Immutable.Map.isMap(record.getIn([field, "validation", "contains"]))) {
      record = record.setIn([field, "validation", "contains"], Immutable.fromJS({}));
    }
    R.forEach(
      (key) => {
        record = record.setIn([field, "validation", "contains", key], contains[key]);
      },
      R.keys(contains)
    );
    return record;
  }
  return record.setIn([field, "validation", "contains"], contains);
}
