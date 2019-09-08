"use strict";
import React from "react";
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import classnames from "classnames";
import R from "ramda";
import * as toggleBaseLib from "./toggleBaseLib.js";
import {getFieldHandler, fieldDisabled} from '../utils/viewUtils';
import {shouldFieldComponentUpdate} from '../libraries/viewV2';


module.exports = createReactClass({
  "displayName": "forms/radioButton",
  "propTypes": R.merge(toggleBaseLib.propTypes, {
    autoFocus: PropTypes.bool,
    // Value of the model property
    value: PropTypes.any,
    type: PropTypes.oneOf(["radio"]),
    // Value of the input. If value === inputValue, this radio button will be checked.
    inputValue: PropTypes.any
  }),
  "shouldComponentUpdate": function shouldComponentUpdate(nextProps, nextState) {
    return shouldFieldComponentUpdate(this, nextProps, nextState);
  },
  "render": function _render() {
    const {field, ...props} = this.props;
    const defaultProps = R.merge(toggleBaseLib.defaultProps, {
      "type": "radio"
    });
    return toggleBaseLib.render(R.mergeAll([defaultProps, field ? field.toJS() : {}, props]), {
      "renderLabelWrapper": renderLabelWrapper,
      "renderLabel": toggleBaseLib.renderLabel,
      "renderInput": renderInput,
      "renderError": renderError
    });
  }
});

function renderLabelWrapper(props, children) {
  return (
    <div className={classnames("radio-styled radio-inline radio", props.wrapperClassName)} key="labelWrapper">
      {children}
    </div>
  );
}

function renderInput(props) {
  const labelPositionClass = {
    "radio-left": props.labelPos !== "right",
    "radio-right": props.labelPos === "right"
  };
  const onChangeHandler = getFieldHandler(props.onChange, props.actions, props.storeId, "onChange");

  const inputProps = R.mergeAll([{
    "type": "radio",
    "id": toggleBaseLib.getFieldId(props),
    className: classnames(labelPositionClass, toggleBaseLib.inputSizeClass(props), props.className),
    style: props.style,
    onBlur: getFieldHandler(props.onBlur, props.actions, props.storeId, "onBlur"),
    onChange: (event) => {
      // By default, e.currentTarget.value will be set to "on". So we intercept the event and change it to the
      // desired value (i.e. inputValue)
      event.currentTarget.value = props.inputValue;
      onChangeHandler(event);
    },
    onFocus: props.onFocus,
    name: props.name,
    disabled: fieldDisabled(props),
    checked: props.checked || props.value === props.inputValue,
    autoFocus: props.autoFocus,
    "aria-invalid": props.showError ? true : null,
    "aria-describedby": toggleBaseLib.ariaDescribedBy(props)
  }, toggleBaseLib.dataProps(props), toggleBaseLib.ariaProps(props)]);

  return <input key="input" {...inputProps}/>;
}

// Error messages are to be rendered by parent component to avoid replicating errors across multiple radio buttons
// within a group
function renderError() {
  return null;
}
