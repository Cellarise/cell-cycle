"use strict";
import React from "react";
import classnames from "classnames";
import R from "ramda";
import * as toggleBaseLib from "./toggleBaseLib.jsx";


function RadioButton(props) {
  return toggleBaseLib.render(props, {
    "renderLabelWrapper": renderLabelWrapper,
    "renderLabel": toggleBaseLib.renderLabel,
    "renderInput": renderInput,
    "renderError": renderError
  });
}


function renderLabelWrapper(props, children) {
  return (
    <div className={classnames("radio-styled radio-inline radio", props.wrapperClassName)} key="labelWrapper">
      {children}
    </div>
  );
}


function renderInput(props) {
  let labelPositionClass = {
    "radio-left": props.labelPos !== "right",
    "radio-right": props.labelPos === "right"
  };

  let _props = R.mergeAll([{
    id: toggleBaseLib.getFieldId(props),
    className: classnames(labelPositionClass, toggleBaseLib.inputSizeClass(props), props.className),
    style: props.style,
    onBlur: props.onBlur,
    onChange: props.onChange,
    onFocus: props.onFocus,
    name: props.name,
    disabled: props.disabled || !props.access[props.accessMode] || props.accessMode === "read",
    checked: props.checked || props.value === props.inputValue,
    autoFocus: props.autoFocus,
    "aria-invalid": props.showError ? true : null,
    "aria-describedby": toggleBaseLib.ariaDescribedBy(props)
  }, toggleBaseLib.dataProps(props), toggleBaseLib.ariaProps(props)]);

  return <input type="radio" key="input" {..._props} onChange={e => onChange(props, e)}/>;
}

// Error messages are to be rendered by parent component to avoid replicating errors across multiple radio buttons
// within a group
function renderError() {
  return null;
}

function onChange(props, event) {
  if (props.onChange) {
    // By default, e.currentTarget.value will be set to "on". So we intercept the event and change it to the
    // desired value (i.e. inputValue)
    event.currentTarget.value = props.inputValue;
    props.onChange(event);
  }
}

RadioButton.displayName = "RadioButton";
RadioButton.propTypes = R.merge(toggleBaseLib.propTypes, {
  autoFocus: React.PropTypes.bool,

  // Value of the model property
  value: React.PropTypes.any,
  type: React.PropTypes.oneOf(["radio"]),
  // Value of the input. If value === inputValue, this radio button will be checked.
  inputValue: React.PropTypes.any
});
RadioButton.defaultProps = R.merge(
  toggleBaseLib.defaultProps,
  {
    "type": "radio"
  }
);

export default RadioButton;
