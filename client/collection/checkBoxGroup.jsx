"use strict";
import React from "react";
import PropTypes from 'prop-types';
import R from 'ramda';
import classnames from 'classnames';
import CheckBox from '../forms/checkBox.jsx';
// import Label from '../forms/label.jsx';
import ErrorMessage from '../forms/errorMessage.jsx';
import {getValue, getFieldName, createSyntheticEvent} from '../utils/domDriverUtils';

function CheckBoxGroup(props) {
  const {field, className} = props;
  return (
    <fieldset className={classnames("radio-group", className)}>
      {renderCheckBoxGroups(props)}
      <ErrorMessage field={field}/>
    </fieldset>
  );
}

CheckBoxGroup.displayName = "CheckBoxGroup";
CheckBoxGroup.propTypes = {
  onChange: PropTypes.func.isRequired,
  field: PropTypes.object.isRequired,
  className: PropTypes.string,
  colSpacingClassName: PropTypes.string,
  groupFieldName: PropTypes.string,
  labelFieldName: PropTypes.string,
  valueFieldName: PropTypes.string,
  minSelected: PropTypes.number
};
CheckBoxGroup.defaultProps = {
  className: "col-xs-12",
  groupFieldName: "groupName",
  labelFieldName: "label",
  valueFieldName: "id",
  minSelected: 1
};

function renderCheckBoxGroups(props) {
  const {field} = props;
  const groups = field.get('groups');
  const allRecords = field.get('records');

  return groups.map(
    (group, idx) => {
      const records = allRecords.filter((record) => (record.get('group') === idx));
      if (R.isNil(records) || records.size === 0) {
        return null;
      }
      return (
        <div className="row" key={idx}>
          <div className="col-xs-12">
            <h4>{group}</h4>
          </div>
          {renderCheckBoxes(props, records)}
        </div>
      );
    }
  );
}

function renderCheckBoxes(props, records) {
  const {field, onChange, labelFieldName, valueFieldName, colSpacingClassName, helpFieldName} = props;
  const fieldName = field.get('name');
  const valueArr = field.get('value');
  if (R.isNil(records) || records.size === 0) {
    return null;
  }
  const colSpacingClass = R.isNil(colSpacingClassName) ? getColSpacingClass(records) : colSpacingClassName;
  return records.map(
    (record, idx) => {
      const recordLabel = record.get(labelFieldName);
      const recordValue = record.get(valueFieldName);
      let recordValueSelected = valueArr.findIndex((value) => (value.get(valueFieldName) === recordValue)) > -1;
      return (
        <div key={idx} className={colSpacingClass}>
          <CheckBox
            standalone={true}
            id={recordValue + "-" + idx}
            label={recordLabel}
            name={recordValue}
            value={recordValueSelected}
            help={!R.isNil(helpFieldName) ? R.defaultTo(null, record.get(helpFieldName)) : null}
            onChange={(event) => {
              const value = getFieldName(event);
              const checked = getValue(event);
              let updatedArray = valueArr.filter((val) => (val.get(valueFieldName) !== value));
              if (checked) {
                updatedArray = updatedArray.push(record);
              }
              if (updatedArray.size >= props.minSelected) {
                onChange(createSyntheticEvent(fieldName, updatedArray, null, "object"));
              }
            }}
          />
        </div>
      );
    });
}

function getColSpacingClass(valueArr) {
  switch (valueArr.size) {
    case 1:
      return "col-xs-12";
    case 2:
      return "col-xs-6";
    case 3:
      return "col-xs-4";
    case 4:
      return "col-xs-3";
    default:
      return "col-xs-3";
  }
}

/**
 * @ignore
 */
module.exports = CheckBoxGroup;
