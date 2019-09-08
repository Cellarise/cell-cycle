/* eslint dot-notation:0 */ // Required because 'in' is a keyword in ie8
"use strict";
import React from "react";
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import classnames from "classnames";
import R from "ramda";
import * as textBoxBaseLib from './textBoxBaseLib.js';
import {getFieldHandler, fieldDisabled} from '../utils/viewUtils';
import {shouldFieldComponentUpdate} from '../libraries/viewV2';

let BLANK_TEXT = "...";


module.exports = createReactClass({
  displayName: "forms/selectBox",
  propTypes: R.merge(textBoxBaseLib.propTypes, {
    className: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.array
    ]),
    multiple: PropTypes.bool,
    type: PropTypes.string,
    readOnly: PropTypes.bool,

    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.bool
    ]),
    items: PropTypes.any,
    valueField: PropTypes.string,
    textField: PropTypes.string,
    includeBlank: PropTypes.bool
  }),
  shouldComponentUpdate: function shouldComponentUpdate(nextProps, nextState) {
    const props = this.props;
    if (props.itemsCanChange === true) {
      if (!R.isNil(props.items) && !R.isNil(nextProps.items) && !R.equals(props.items, nextProps.items)) {
        return true;
      }
    }
    return shouldFieldComponentUpdate(this, nextProps, nextState);
  },
  render: function _render() {
    const {field, ...props} = this.props;
    const defaultProps = R.merge(textBoxBaseLib.defaultProps, {
      type: "text",
      valueField: "id",
      displayField: "name",
      showLabel: true,
      floatingLabel: true,
      validation: {}
    });
    return textBoxBaseLib.render(R.mergeAll([defaultProps, field ? field.toJS() : {}, props]), {
      "renderInput": renderInput
    });
  }
});

function renderInput(props) {
  let valueClass = textBoxBaseLib.getValueClass(props);
  let inputValue, selectedValue;
  let {validation, items, displayField, valueField, value} = props;
  let defaultTo = {}, defaultSelectedItem = null;
  if (validation.inclusion && R.is(Array, validation.inclusion["in"])) {
    inputValue = JSON.stringify(value);
    selectedValue = value;
  } else if (items && items.length > 0 && displayField && items[0].hasOwnProperty(valueField)) {
    defaultTo[valueField] = null;
    inputValue = JSON.stringify(R.defaultTo(defaultTo, R.find(R.propEq(valueField, value), items))[valueField]);
    defaultSelectedItem = R.find(R.propEq(valueField, value), items);
    selectedValue = R.isNil(defaultSelectedItem) ? null : defaultSelectedItem[displayField];
  } else if (items && items.length > 0 && displayField && R.is(Number, value)) {
    inputValue = JSON.stringify(value);
    selectedValue = R.isNil(items[value]) ? null : items[value][displayField];
  }

  let _props = R.mergeAll([{
    id: textBoxBaseLib.getFieldId(props),
    className: classnames("form-control", valueClass, textBoxBaseLib.inputSizeClass(props), props.className),
    style: props.style,
    onBlur: getFieldHandler(props.onBlur, props.actions, props.storeId, "onBlur"),
    onChange: getFieldHandler(props.onChange, props.actions, props.storeId, "onChange"),
    onFocus: props.onFocus,
    onKeyDown: props.onKeyDown,
    name: props.name,
    disabled: fieldDisabled(props),
    multiple: props.multiple,
    autoFocus: props.autoFocus,
    value: inputValue,
    "aria-invalid": props.showError ? true : null,
    "aria-describedby": textBoxBaseLib.ariaDescribedBy(props),
    "data-embedded-path": props.embeddedPath ? JSON.stringify(props.embeddedPath) : null,
    "data-type": validation.type === "JSON" ? "JSON" : null,
    "data-selected": selectedValue
  }, textBoxBaseLib.dataProps(props), textBoxBaseLib.ariaProps(props)]);

  return (
    // We set type="select" to indicate to domDriverUtils to parse JSON values
    <select type="select" key="input" {..._props}>
      {renderOptions(props)}
    </select>
  );
}

function renderOptions(props) {
  let {validation, items, displayField, valueField} = props;
  const blankOption = props.includeBlank ? [<option key={-1} value={JSON.stringify(null)}>{BLANK_TEXT}</option>] : [];
  if (validation.inclusion && R.is(Array, validation.inclusion["in"])) {
    const options = validation.inclusion["in"].map((val, idx) => {
      let value;
      if (val === BLANK_TEXT) {
        value = null;
      } else {
        value = val;
      }
      return <option key={idx} value={JSON.stringify(value)}>{val}</option>;
    });
    return blankOption.concat(options);
  } else if (items && displayField) {
    const options = items.map((item, idx) => {
      const optionValue = item.hasOwnProperty(valueField) ? JSON.stringify(item[valueField]) : JSON.stringify(idx);
      return <option key={idx} value={optionValue}>{item[displayField]}</option>;
    });
    return blankOption.concat(options);
  }
  return null;
}
