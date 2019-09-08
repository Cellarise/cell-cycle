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
  "displayName": "forms/checkBox",
  "propTypes": R.merge(toggleBaseLib.propTypes, {
    "field": PropTypes.object,
    "actions": PropTypes.object,
    "autoFocus": PropTypes.bool,
    "value": PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool
    ])
  }),
  "shouldComponentUpdate": function shouldComponentUpdate(nextProps, nextState) {
    return shouldFieldComponentUpdate(this, nextProps, nextState);
  },
  "render": function _render() {
    const {field, ...props} = this.props;
    const defaultProps = R.merge(toggleBaseLib.defaultProps, {
      "type": "checkbox"
    });
    return toggleBaseLib.render(R.mergeAll([defaultProps, field ? field.toJS() : {}, props]), {
      "renderLabelWrapper": renderLabelWrapper,
      "renderLabel": toggleBaseLib.renderLabel,
      "renderInput": renderInput
    });
  }
});

function renderLabelWrapper(props, children) {
  return (
    <div style={!R.isNil(props.stickyCheckBox) && props.stickyCheckBox ? {'position': 'sticky'} : null}
         className={classnames("checkbox-styled checkbox", props.labelWrapperClassName)} key="labelWrapper">
      {children}
    </div>
  );
}

function renderInput(props) {
  const labelPositionClass = {
    "checkbox-left": props.labelPos !== "right",
    "checkbox-right": props.labelPos === "right"
  };

  const inputProps = R.mergeAll([{
    type: "checkbox",
    id: toggleBaseLib.getFieldId(props),
    className: classnames(labelPositionClass, toggleBaseLib.inputSizeClass(props), props.className),
    style: props.style,
    onBlur: getFieldHandler(props.onBlur, props.actions, props.storeId, "onBlur"),
    onChange: getFieldHandler(props.onChange, props.actions, props.storeId, "onChange"),
    onFocus: props.onFocus,
    name: props.name,
    disabled: fieldDisabled(props),
    checked: !R.isNil(props.checked) ? props.checked === true : !R.isNil(props.value) && props.value !== false,
    autoFocus: props.autoFocus,
    "aria-invalid": props.showError ? true : null,
    "aria-describedby": toggleBaseLib.ariaDescribedBy(props),
    "data-embedded-path": props.embeddedPath ? JSON.stringify(props.embeddedPath) : null
  }, toggleBaseLib.dataProps(props), toggleBaseLib.ariaProps(props)]);

  return <input key="input" {...inputProps}/>;
}
