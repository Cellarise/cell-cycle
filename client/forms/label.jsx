"use strict";
import React from "react";
import R from "ramda";
import classnames from 'classnames';

function Label(props) {
  var showValidating = props.showValidating;
  var showError = props.showError && !showValidating;
  var showValid = props.touched
    && props.value
    && !showError
    && !showValidating;
  var classes = {
    "glyphiconSuperScript": showValid || showError || showValidating,
    "text-success": showValid,
    "text-info": showValidating,
    "text-danger": showError,
    "mdi-checkbox-marked-circle": showValid,
    "mdi-alert-circle": showError,
    "mdi-spin": showValidating,
    "mdi-refresh": showValidating
  };
  let {legend, validation, className, showLabel, label} = props;
  const _validation = R.defaultTo({}, validation);
  const required = R.path(['required'], _validation) === true
    || R.path(['required', '_value'], _validation) === true;
  let _label = legend
    ? (
    <legend className={classnames(className, getValueClass(props))}>
      <span>{label}</span>
      { required && props.showRequired && !showValid && !showError
        ? (<span>&nbsp;<span className="glyphiconSuperScript glyphicon-asterisk text-primary mandatory"
                             title="Mandatory"
                             data-toggle-tooltip="tooltip"
                             data-placement="top" /></span>)
        : (<span>&nbsp;</span>)
      }
      {props.hasFeedback ? <span className={classnames(classes)}/> : null}
      { props.showLabel && !R.isNil(props.help) && props.help.length > 0
        ? (<span>&nbsp;<span className="glyphiconSuperScript mdi-help-circle text-primary"
                                   title={props.help}
                                   data-toggle-tooltip="tooltip"
                                   data-placement="top"/></span>)
        : null
      }
    </legend>
  )
    : (
    <span className={classnames(className, getValueClass(props))}>
        <span>{label}</span>
        <span className="mandatory">&nbsp;*&nbsp;</span>
      {props.hasFeedback ? <span className={classnames(classes)}/> : null}
      { props.showLabel && !R.isNil(props.help) && props.help.length > 0
        ? (<span>&nbsp;&nbsp;<span className="glyphiconSuperScript mdi-help-circle text-primary"
                                   title={props.help}
                                   data-toggle-tooltip="tooltip"
                                   data-placement="top"/></span>)
        : null
      }
      </span>
  );
  return showLabel ? _label : <span></span>;
}

Label.displayName = "forms/Label";
Label.propTypes = {
  showLabel: React.PropTypes.bool,
  legend: React.PropTypes.bool,
  label: React.PropTypes.string,
  id: React.PropTypes.string,
  name: React.PropTypes.string,
  className: React.PropTypes.string,
  hasFeedback: React.PropTypes.bool,
  showRequired: React.PropTypes.bool
};
Label.defaultProps = {
  showLabel: true,
  hasFeedback: true,
  className: "standalone-label",
  legend: false,
  showRequired: true
};

function getValueClass(props) {
  return props.value === "" || props.value === null ? "" : "dirty static";
}

/**
 * @ignore
 */
module.exports = Label;
