"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import classnames from "classnames";
import {formattedDate, formattedDateTime} from '../utils';
import {updateEventValue} from "../utils/domDriverUtils";
import * as inputBaseLib from './inputBaseLib.js';
import {getFieldHandler, fieldDisabled} from '../utils/viewUtils';

export {
  renderInputGroup, renderWrapper, renderIcon, renderError, renderHelp, renderLabel, renderCharacterCounter,
  inputSizeClass, dataProps, ariaDescribedBy, ariaProps, propsStartsWith,
  getFieldId, getValueClass
} from './inputBaseLib.js';


export function renderInput(props) {
  const inputWhiteList = R.defaultTo(
    props.inputWhiteList,
    R.path(['validation', 'format', 'clean'], props)
  );
  const InputWhiteListRegex = new RegExp(inputWhiteList, "gi");
  const onChangeHandler = getFieldHandler(props.onChange, props.actions, props.storeId, "onChange");

  let valueClass = inputBaseLib.getValueClass(props);

  let value;
  switch (props.type) {
    case "date":
    case "dateStr":
      value = formattedDate(props.value);
      break;
    case "datetime":
      value = formattedDateTime(props.value);
      break;
    default:
      value = props.value;
  }

  const inputProps = R.mergeAll([{
    type: props.type === "string" || props.type === "dateStr" ? "text" : props.type,
    id: inputBaseLib.getFieldId(props),
    className: classnames("form-control", valueClass, inputBaseLib.inputSizeClass(props), props.className),
    style: props.style,
    onChange: (event) => {
      const dirtyValue = event.currentTarget.value;
      if (props.type === "password" || props.type === "number" || props["data-type"] === "number") {
        onChangeHandler(event);
      } else if (!R.isNil(dirtyValue) && R.is(String, dirtyValue) && props.applyInputWhiteList) {
        const cleanValue = !R.isNil(dirtyValue) && R.is(String, dirtyValue) && props.applyInputWhiteList
          ? dirtyValue.replace(InputWhiteListRegex, "")
          : dirtyValue;
        onChangeHandler(updateEventValue(event, cleanValue));
      } else {
        onChangeHandler(event);
      }
    },
    onBlur: getFieldHandler(props.onBlur, props.actions, props.storeId, "onBlur"),
    onFocus: props.onFocus,
    onKeyDown: props.onKeyDown,
    name: props.name,
    disabled: fieldDisabled(props),
    readOnly: props.readOnly,
    value: R.defaultTo("", value),
    min: props.min,
    max: props.max,
    step: props.step,
    autoComplete: props.type === "password" ? "off" : props.autoComplete,
    autoFocus: props.autoFocus,
    placeholder: props.placeholder,
    "aria-invalid": props.showError ? true : null,
    "aria-describedby": inputBaseLib.ariaDescribedBy(props),
    "data-embedded-path": props.embeddedPath ? JSON.stringify(props.embeddedPath) : null,
    "data-type": props.validation.type === "JSON" ? "JSON" : null
  }, inputBaseLib.dataProps(props), inputBaseLib.ariaProps(props)]);

  return <input key="input" {...inputProps}/>;
}


export function render(props, base) {
  const _base = R.merge(inputBaseLib, R.merge({
    "renderInput": renderInput
  }, R.defaultTo({}, base)));

  if (props.hide) {
    return <span></span>;
  }

  let groupClasses = {
    "form-group": !props.standalone || (props.showLabel && props.label.length > 0),
    "floating-label": props.floatingLabel && (!props.standalone || (props.label && props.label.length > 0)),
    "has-feedback": props.hasFeedback && !props.disabled && (props.help || props.showError),
    "has-success": props.bsStyle === "success",
    "has-warning": props.bsStyle === "warning",
    "has-error": props.bsStyle === "error" || props.showError
  };

  return (
    <div className={classnames(groupClasses, props.groupClassName)}>
      {
        _base.renderWrapper(props, [
          _base.renderInputGroup(props, [
            _base.renderInput(props),
            _base.renderLabel(props),
            _base.renderError(props),
            _base.renderCharacterCounter(props),
            _base.renderHelp(props)
          ])
        ])
      }
    </div>
  );
}


export let propTypes = R.merge(inputBaseLib.propTypes, {
  className: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array
  ]),
  storeId: PropTypes.string,
  actions: PropTypes.object,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  onFocus: PropTypes.func,
  onKeyDown: PropTypes.func,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
  type: PropTypes.oneOf(["date", "datetime", "dateStr", "email", "password", "text", "string"]),
  readOnly: PropTypes.bool,
  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
    PropTypes.instanceOf(Date)
  ]),
  autoComplete: PropTypes.oneOf(["on", "off"]),
  placeholder: PropTypes.string,
  // Whether the component should be rendered
  hide: PropTypes.bool,
  showLabel: PropTypes.bool,
  floatingLabel: PropTypes.bool,
  // Indicates whether the control should not be part of a form-group (standalone=true)
  standalone: PropTypes.bool,
  groupClassName: PropTypes.string,
  bsStyle: PropTypes.string,
  embeddedPath: PropTypes.array,
  validation: PropTypes.object
});

export let defaultProps = R.merge(inputBaseLib.defaultProps, {
  type: "string",
  showLabel: true,
  floatingLabel: true,
  validation: {}
});
