"use strict";
import React from "react";
import R from 'ramda';
import classnames from 'classnames';
import CheckBox from './checkBox.jsx';
import Label from './label.jsx';
import ErrorMessage from './errorMessage.jsx';

function CheckBoxGroup(props) {
  const {activeRecord, embeddedPath, className} = props;
  const activeField = activeRecord[embeddedPath[0]];
  return (
    <fieldset className={classnames("radio-group", className)}>
      <Label legend={true} className="standalone-label-wrap" {...activeField}/>
      <div className="row">
        {renderCheckBoxes(props, activeField.name)}
      </div>
      <ErrorMessage className="standalone-label-wrap" {...activeField}/>
    </fieldset>
  );
}

CheckBoxGroup.displayName = "CheckBoxGroup";
CheckBoxGroup.propTypes = {
  activeRecord: React.PropTypes.object.isRequired,
  embeddedPath: React.PropTypes.array.isRequired,
  actions: React.PropTypes.object.isRequired,
  className: React.PropTypes.string,
  colSpacingClassName: React.PropTypes.string,
  labelFieldName: React.PropTypes.string,
  valueFieldName: React.PropTypes.string
};
CheckBoxGroup.defaultProps = {
  className: "col-xs-12",
  labelFieldName: "label",
  valueFieldName: "item"
};

function renderCheckBoxes(props, groupId) {
  const {activeRecord, embeddedPath, actions, labelFieldName, valueFieldName, colSpacingClassName} = props;
  const activeField = R.path(embeddedPath, activeRecord);
  if (R.isNil(activeField) || !R.is(Array, activeField)) {
    return null;
  }
  const colSpacingClass = R.isNil(colSpacingClassName) ? getColSpacingClass(activeField) : colSpacingClassName;
  return R.addIndex(R.map)(
    (label, idx) => {
      return (
        <div key={idx} className={colSpacingClass}>
          <CheckBox
            standalone={true}
            {...activeField[idx][valueFieldName]} {...actions}
            id={groupId + "-" + activeField[idx][labelFieldName].value + "-" + idx}
            label={activeField[idx][labelFieldName].value}
            embeddedPath={R.concat(embeddedPath, [idx])}
          />
        </div>
      );
    },
    activeField
  );
}

function getColSpacingClass(valueArr) {
  switch (valueArr.length) {
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
