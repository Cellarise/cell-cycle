"use strict";
import React from "react";
import PropTypes from 'prop-types';
import R from 'ramda';
import classnames from 'classnames';
import RadioButton from './radioButton.jsx';
import Label from './label.jsx';
import ErrorMessage from './errorMessage.jsx';


function RadioButtonGroup(props) {
  const {field, className, horizontal, labelSpacing, tableMode} = props;
  if (horizontal) {
    return (
      <div className={tableMode ? "" : "row"}>
        <div className={labelSpacing}>
          <Label className={tableMode ? "standalone-label-wrap text-bold" : "standalone-label-wrap"} field={field}/>
        </div>
        {renderRadioButtons(props)}
        <ErrorMessage field={field}/>
      </div>
    );
  }
  return (
    <fieldset className={classnames("radio-group", className)}>
      <Label legend={true}
             className={tableMode ? "standalone-label-wrap text-bold" : "standalone-label-wrap"} field={field}/>
      <div className={tableMode ? "" : "row"}>
        {renderRadioButtons(props)}
      </div>
        <ErrorMessage field={field}/>
    </fieldset>
  );
}

RadioButtonGroup.displayName = "RadioButtonGroup";
RadioButtonGroup.propTypes = {
  field: PropTypes.object.isRequired,
  actions: PropTypes.object,
  className: PropTypes.string,
  colSpacingClassName: PropTypes.string,
  labels: PropTypes.array,
  values: PropTypes.array,
  labelSpacing: PropTypes.string,
  colSpacings: PropTypes.array,
  idPrefix: PropTypes.string,
  horizontal: PropTypes.bool
};
RadioButtonGroup.defaultProps = {
  className: "col-xs-12",
  idPrefix: "",
  horizontal: false
};

function renderRadioButtons(props) {
  const {field, actions, onChange, onBlur, labels, values, disabled,
    colSpacingClassName, colSpacings, idPrefix, propsByRadioButton, reverse, tableMode, tableConfig} = props;
  if (R.isNil(labels) && R.isNil(field.getIn(["validation", "inclusion", "in"]))) {
    return null;
  }
  const radioButtonLabels = R.isNil(labels) ? field.getIn(["validation", "inclusion", "in"]).toJS() : labels;
  let colSpacingClass = R.isNil(colSpacingClassName) ? getColSpacingClass(radioButtonLabels) : colSpacingClassName;
  if (tableMode && !R.isNil(tableConfig)) {
    return (
      <table className="table">
        <thead>
        <tr>
          {R.addIndex(R.map)((header, idx) => {
            return (
              <th style={{"fontWeight": "300"}} key={idx} scope="col">{header}</th>
            )
          }, tableConfig.headers)}
        </tr>
        </thead>
        {
          R.addIndex(R.map)(
            (label, idx) => {
              let value = values ? values[idx] : label;
              let disabledByIdx = propsByRadioButton && propsByRadioButton[idx] ? propsByRadioButton[idx].disabled : false;
              let helpByIdx = propsByRadioButton && propsByRadioButton[idx] ? propsByRadioButton[idx].help : null;
              if (!R.isNil(colSpacings) && colSpacings.length > idx) {
                colSpacingClass = colSpacings[idx];
              }
              return (
                <tbody key={idx}>
                <tr>
                  <td className={"col-xs-4"}>
                    {renderRadioButton(idx, field, actions, onChange, onBlur, idPrefix, label,
                      value, disabled, disabledByIdx, helpByIdx)}
                  </td>
                  <td className={"col-xs-4 text-sm"} style={{"fontSize": 14, "whiteSpace": "normal"}}>
                    <ul>
                      {
                        R.addIndex(R.map)((info, i) => {
                          return (
                            <li key={i}>{info}</li>
                          )}, R.isNil(tableConfig[field.get("label")]) ? [] :
                          tableConfig[field.get("label")][label].userCan)
                      }
                    </ul>
                  </td>
                  <td className={"col-xs-4"} style={{"fontSize": 14, "whiteSpace": "normal"}}>
                    <ul>
                      {
                        R.addIndex(R.map)((info, i) => {
                          return (
                            <li key={i}>{info}</li>
                          )}, R.isNil(tableConfig[field.get("label")]) ? [] :
                          tableConfig[field.get("label")][label].userCant)
                      }
                    </ul>
                  </td>
                </tr>
                </tbody>
              );
            },
            reverse ? R.reverse(radioButtonLabels) : radioButtonLabels
          )
        }
      </table>
    );
  }
  return R.addIndex(R.map)(
    (label, idx) => {
      let value = values ? values[idx] : label;
      let disabledByIdx = propsByRadioButton && propsByRadioButton[idx] ? propsByRadioButton[idx].disabled : false;
      let helpByIdx = propsByRadioButton && propsByRadioButton[idx] ? propsByRadioButton[idx].help : null;
      if (!R.isNil(colSpacings) && colSpacings.length > idx) {
        colSpacingClass = colSpacings[idx];
      }
      return (
        <div key={idx} className={colSpacingClass}>
          {renderRadioButton(idx, field, actions, onChange, onBlur, idPrefix, label,
            value, disabled, disabledByIdx, helpByIdx)}
        </div>
      );
    },
    reverse ? R.reverse(radioButtonLabels) : radioButtonLabels
  );
}


function renderRadioButton(idx, field, actions, onChange, onBlur, idPrefix, label,
                           value, disabled, disabledByIdx, helpByIdx) {
  return (
    <RadioButton
      standalone={true}
      field={field}
      actions={actions}
      onChange={onChange}
      onBlur={onBlur}
      id={idPrefix + field.get("name") + "-" + idx}
      label={label}
      inputValue={value}
      disabled={R.defaultTo(field.get('disabled'), disabled) || disabledByIdx}
      help={helpByIdx}
    />
  )
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
