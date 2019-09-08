"use strict";
import React from "react"; //eslint-disable-line
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from "ramda";
import * as textBoxBaseLib from './textBoxBaseLib.js';
import {labelWithUom} from "../utils/uomHelpers";
import {eventHandler} from '../utils/viewUtils';
import {updateEventValue} from '../utils/domDriverUtils';
import {shouldFieldComponentUpdate} from '../libraries/viewV2';
import {toFixed} from '../utils/numberHelpers';


function getStep(validation = {}, step) {
  return step || (validation.range ? validation.range.step : 1);
}

module.exports = createReactClass({
  "displayName": "forms/numberBox",
  "propTypes": R.merge(textBoxBaseLib.propTypes, {
    value: PropTypes.number,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number
  }),
  "getInitialState": function getInitialState() {
    return {
      "value": null
    };
  },
  "shouldComponentUpdate": function shouldComponentUpdate(nextProps, nextState) {
    return shouldFieldComponentUpdate(this, nextProps, nextState);
  },
  UNSAFE_componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    const nextValue = nextProps.field ? nextProps.field.get('value') : nextProps.value;

    this.setState({"value": R.defaultTo("", nextValue) + ""});
  },
  "onTyping": function onTyping(event) {
    const props = this.props;
    const {field, actions} = props;
    const validation = field && field.get('validation') ? field.get('validation').toJS() : props.validation;
    const step = getStep(validation, props.step);
    const triggerOnChange = !(
      (event.currentTarget.value.endsWith(".0") || event.currentTarget.value.endsWith("."))
      && (step === 0.01 || step === 0.1)
    ) && !(event.currentTarget.value.endsWith(".."));
    let currentValue = event.currentTarget.value;
    if (currentValue === "") {
      if (R.isNil(props.onChange)) {
        return eventHandler(actions, field.get("storeId"), "onChange", updateEventValue(event, null));
      }
      return props.onChange(updateEventValue(event, null));
    }
    //force decimal places on input based on validation step
    if (triggerOnChange) {
      if (step === 1) {
        currentValue = toFixed(currentValue, 0);
      } else if (step === 0.1) {
        currentValue = toFixed(currentValue, 2);
      } else if (step === 0.01) {
        currentValue = toFixed(currentValue, 2);
      }
    }
    if (triggerOnChange && field) {
      //*********
      // Check store field for identical currentValue - if so the store will not trigger an update
      // Therefore force an update by calling setState
      //*********
      if (!R.isNil(this.state.value) && this.state.value.endsWith(".") && !event.currentTarget.value.endsWith(".")) {
        this.setState({"value": event.currentTarget.value});
      }
      if (R.isNil(props.onChange)) {
        return eventHandler(actions, field.get("storeId"), "onChange", updateEventValue(event, currentValue));
      }
      return props.onChange(updateEventValue(event, currentValue));
    }
    if (triggerOnChange && !R.isNil(props.onChange)) {
      return props.onChange(updateEventValue(event, currentValue));
    }
    if (!event.currentTarget.value.endsWith("..")) {
      return this.setState({"value": event.currentTarget.value});
    }
    return;
  },
  "render": function _render() {
    const {field, ...props} = this.props;
    const fieldJS = field ? field.toJS() : {};
    let value = this.state.value;
    if (R.isNil(value)) {
      value = R.defaultTo('', fieldJS.value);
    }
    const mergedProps = R.mergeAll([textBoxBaseLib.defaultProps, fieldJS, props, {
      "onChange": this.onTyping,
      "value": value
    }]);
    mergedProps.label = labelWithUom(mergedProps);
    return textBoxBaseLib.render(mergedProps);
  }
});
