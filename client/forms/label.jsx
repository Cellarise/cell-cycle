"use strict";
import React from "react";
import PropTypes from 'prop-types';
import R from "ramda";
import classnames from 'classnames';

function Label({field, ...props}) {
  const defaultProps = {
    showLabel: true,
    hasFeedback: true,
    className: "standalone-label",
    legend: false,
    showRequired: true
  };
  return renderLabel(R.mergeAll([defaultProps, field ? field.toJS() : {}, props]));
}

function renderLabel(props) {
  const {legend, validation, className, showLabel, label, showValidating} = props;
  const showError = props.showError && !showValidating;
  const showValid = props.touched
    && props.value
    && !showError
    && !showValidating;
  const classes = {
    "glyphiconSuperScript": showValid || showError || showValidating,
    "text-success": showValid,
    "text-info": showValidating,
    "text-danger": showError,
    "mdi-checkbox-marked-circle": showValid,
    "mdi-alert-circle": showError,
    "mdi-spin": showValidating,
    "mdi-refresh": showValidating
  };
  const _validation = R.defaultTo({}, validation);
  const required = R.path(['required'], _validation) === true
    || R.path(['required', '_value'], _validation) === true;
  const _label = legend
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
      { required && props.showRequired && !showValid && !showError
        ? (<span>&nbsp;<span className="glyphiconSuperScript glyphicon-asterisk text-primary mandatory"
                             title="Mandatory"
                             data-toggle-tooltip="tooltip"
                             data-placement="top" /></span>)
        : (<span>&nbsp;</span>)
      }
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
  showLabel: PropTypes.bool,
  legend: PropTypes.bool,
  label: PropTypes.string,
  id: PropTypes.string,
  name: PropTypes.string,
  className: PropTypes.string,
  hasFeedback: PropTypes.bool,
  showRequired: PropTypes.bool
};

function getValueClass(props) {
  return props.value === "" || props.value === null ? "" : "dirty static";
}

/**
 * @ignore
 */
module.exports = Label;
