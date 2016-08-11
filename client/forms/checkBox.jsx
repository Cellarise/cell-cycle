"use strict";
import React from "react";
import classnames from "classnames";
import R from "ramda";
import * as toggleBaseLib from "./toggleBaseLib.jsx";


function CheckBox(props)  {
  return toggleBaseLib.render(props, {
    "renderLabelWrapper": renderLabelWrapper,
    "renderLabel": toggleBaseLib.renderLabel,
    "renderInput": renderInput
  });
}


function renderLabelWrapper(props, children) {
  return (
    <div className={classnames("checkbox-styled checkbox", props.labelWrapperClassName)} key="labelWrapper">
      {children}
    </div>
  );
}


function renderInput(props) {
  let labelPositionClass = {
    "checkbox-left": props.labelPos !== "right",
    "checkbox-right": props.labelPos === "right"
  };

  let inputProps = R.mergeAll([{
    id: toggleBaseLib.getFieldId(props),
    className: classnames(labelPositionClass, toggleBaseLib.inputSizeClass(props), props.className),
    style: props.style,
    onBlur: props.onBlur,
    onChange: props.onChange,
    onFocus: props.onFocus,
    name: props.name,
    disabled: props.disabled || !props.access[props.accessMode] || props.accessMode === "read",
    checked: props.checked || props.value,
    autoFocus: props.autoFocus,
    "aria-invalid": props.showError ? true : null,
    "aria-describedby": toggleBaseLib.ariaDescribedBy(props),
    "data-embedded-path": props.embeddedPath ? JSON.stringify(props.embeddedPath) : null
  }, toggleBaseLib.dataProps(props), toggleBaseLib.ariaProps(props)]);

  return <input type="checkbox" key="input" {...inputProps}/>;
}

CheckBox.displayName = "CheckBox";
CheckBox.propTypes = R.merge(toggleBaseLib.propTypes, {
  autoFocus: React.PropTypes.bool,
  value: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.number,
    React.PropTypes.bool
  ])
});
CheckBox.defaultProps =  R.merge(
  toggleBaseLib.defaultProps,
  {
    "type": "checkbox"
  }
);

export default CheckBox;
