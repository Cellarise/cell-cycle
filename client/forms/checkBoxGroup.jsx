"use strict";
import React from "react";
import PropTypes from 'prop-types';
import R from 'ramda';
import classnames from 'classnames';
import CheckBox from './checkBox.jsx';
import Label from './label.jsx';
import ErrorMessage from './errorMessage.jsx';

function CheckBoxGroup(props) {
  const {activeRecord, embeddedPath, className} = props;
  const field = activeRecord.get(embeddedPath[0]);
  return (
    <fieldset className={classnames("radio-group", className)}>
      <Label legend={true} className="standalone-label-wrap" field={field}/>
      <div className="row">
        {renderCheckBoxes(props, field.get("name"))}
      </div>
      <ErrorMessage field={field}/>
    </fieldset>
  );
}

CheckBoxGroup.displayName = "CheckBoxGroup";
CheckBoxGroup.propTypes = {
  actions: PropTypes.object.isRequired,
  activeRecord: PropTypes.object.isRequired,
  embeddedPath: PropTypes.array.isRequired,
  className: PropTypes.string,
  colSpacingClassName: PropTypes.string,
  labelFieldName: PropTypes.string,
  valueFieldName: PropTypes.string
};
CheckBoxGroup.defaultProps = {
  className: "col-xs-12",
  labelFieldName: "label",
  valueFieldName: "item"
};

function renderCheckBoxes(props, groupId) {
  const {activeRecord, embeddedPath, actions, labelFieldName, valueFieldName, colSpacingClassName, disabled} = props;
  const valueArr = activeRecord.getIn(embeddedPath);
  if (R.isNil(valueArr) || valueArr.size === 0) {
    return null;
  }
  const colSpacingClass = R.isNil(colSpacingClassName) ? getColSpacingClass(valueArr) : colSpacingClassName;
  return valueArr.map(
    (label, idx) => {
      return (
        <div key={idx} className={colSpacingClass}>
          <CheckBox
            standalone={true}
            field={valueArr.getIn([idx, valueFieldName])}
            actions={actions}
            id={groupId + "-" + valueArr.getIn([idx, labelFieldName, "value"]) + "-" + idx}
            label={valueArr.getIn([idx, labelFieldName, "value"])}
            embeddedPath={R.concat(embeddedPath, [idx])}
            disabled={disabled === true}
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
