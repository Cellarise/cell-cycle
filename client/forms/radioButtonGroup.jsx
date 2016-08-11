"use strict";
import React from "react";
import R from 'ramda';
import classnames from 'classnames';
import RadioButton from './radioButton';
import Label from './label.jsx';
import ErrorMessage from './errorMessage.jsx';

function RadioButtonGroup(props) {
  const {activeField, className} = props;
  return (
    <fieldset className={classnames("radio-group", className)}>
      <Label legend={true} className="standalone-label-wrap" {...activeField}/>
      <div className="row">
        {renderRadioButtons(props)}
      </div>
        <ErrorMessage className="standalone-label-wrap" {...activeField}/>
    </fieldset>
  );
}

RadioButtonGroup.displayName = "RadioButtonGroup";
RadioButtonGroup.propTypes = {
  activeField: React.PropTypes.object.isRequired,
  actions: React.PropTypes.object.isRequired,
  className: React.PropTypes.string,
  colSpacingClassName: React.PropTypes.string,
  labels: React.PropTypes.array,
  values: React.PropTypes.array,
  idPrefix: React.PropTypes.string
};
RadioButtonGroup.defaultProps = {
  className: "col-xs-12",
  idPrefix: ""
};

function renderRadioButtons(props) {
  const {activeField, actions, labels, values, colSpacingClassName, idPrefix} = props;
  if (R.isNil(labels) && R.isNil(R.path(["validation", "inclusion", "in"], activeField))) {
    return null;
  }
  const radioButtonLabels = R.isNil(labels) ? activeField.validation.inclusion.in : labels;
  const colSpacingClass = R.isNil(colSpacingClassName) ? getColSpacingClass(radioButtonLabels) : colSpacingClassName;
  return R.addIndex(R.map)(
    (label, idx) => {
      let value = values ? values[idx] : label;
      return (
        <div key={idx} className={colSpacingClass}>
          <RadioButton
            standalone={true}
            {...activeField} {...actions}
            id={idPrefix + activeField.name + "-" + idx}
            label={label}
            inputValue={value}
          />
        </div>
      );
    },
    radioButtonLabels
  );
}

function getColSpacingClass(radioButtonLabels) {
  const radioButtonLabelsLength = radioButtonLabels.length;
  switch (radioButtonLabelsLength) {
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
module.exports = RadioButtonGroup;
