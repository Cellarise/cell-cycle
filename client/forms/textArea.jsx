"use strict";
import React from "react";
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from "ramda";
import {$} from "../globals";
import classnames from "classnames";
import * as textBoxBaseLib from "./textBoxBaseLib.js";
import {updateEventValue, getValue} from "../utils/domDriverUtils";
import {getFieldHandler, fieldDisabled} from '../utils/viewUtils';
import {shouldFieldComponentUpdate} from '../libraries/viewV2';


function renderInput(props) {
  const inputWhiteList = R.defaultTo(props.inputWhiteList, R.path(['validation', 'format', 'clean'], props));
  const InputWhiteListRegex = new RegExp(inputWhiteList, "gi");
  const onChangeHandler = getFieldHandler(props.onChange, props.actions, props.storeId, "onChange");
  const valueClass = textBoxBaseLib.getValueClass(props);

  const inputProps = R.mergeAll([{
    type: props.type,
    id: props.id ? props.id : props.name + "-input",
    className: classnames(
      "form-control",
      {
        "autosize": props.autoSize,
        ["control-" + props.rows + "-rows"]: !props.autoSize
      },
      valueClass,
      textBoxBaseLib.inputSizeClass(props), props.className
    ),
    style: props.style,
    onBlur: getFieldHandler(props.onBlur, props.actions, props.storeId, "onBlur"),
    onChange: (event) => {
      const dirtyValue = getValue(event);
      const cleanValue = props.applyInputWhiteList ? dirtyValue.replace(InputWhiteListRegex, "") : dirtyValue;
      onChangeHandler(updateEventValue(event, cleanValue));
    },
    onFocus: props.onFocus,
    onKeyDown: props.onKeyDown,
    name: props.name,
    disabled: fieldDisabled(props),
    readOnly: props.readOnly,
    autoFocus: props.autoFocus,
    placeholder: props.placeholder,
    value: props.validation.type === "JSON" ? JSON.stringify(props.value) : R.defaultTo("", props.value),
    rows: props.autoSize ? "1" : null, //required for auto sizing - material admin theme
    "aria-invalid": props.showError ? true : null,
    "aria-describedby": textBoxBaseLib.ariaDescribedBy(props),
    "data-embedded-path": props.embeddedPath ? JSON.stringify(props.embeddedPath) : null,
    "data-type": props.validation.type === "JSON" ? "JSON" : null
  }, textBoxBaseLib.dataProps(props), textBoxBaseLib.ariaProps(props)]);

  return <textarea key="input" {...inputProps}/>;
}


module.exports = createReactClass({
  "displayName": "TextArea",
  "propTypes": R.merge(textBoxBaseLib.propTypes, {
    type: PropTypes.oneOf(["text", "textarea"]),
    rows: PropTypes.number,
    autoSize: PropTypes.bool
  }),
  "shouldComponentUpdate": function shouldComponentUpdate(nextProps, nextState) {
    return shouldFieldComponentUpdate(this, nextProps, nextState);
  },
  "componentDidMount": function componentDidMount() {
    const props = this.props;
    if (!$.fn.autosize) {
      require("jquery-autosize");
    }
    $("#" + textBoxBaseLib.getFieldId(props) + ".autosize").autosize({append:""});
  },
  "componentWillUnmount": function componentWillUnmount() {
    const props = this.props;
    $("#" + textBoxBaseLib.getFieldId(props) + ".autosize").trigger("autosize.destroy");
  },
  "render": function _render() {
    const {field, ...props} = this.props;
    const defaultProps = R.merge(textBoxBaseLib.defaultProps, {
      type: "textarea",
      rows: 2,
      autoSize: true
    });
    return textBoxBaseLib.render(R.mergeAll([defaultProps, field ? field.toJS() : {}, props]), {
      "renderInput": renderInput
    });
  }
});
