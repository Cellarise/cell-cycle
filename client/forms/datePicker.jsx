"use strict";
import React from 'react'; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from "ramda";
import TextBox from './textBox.jsx';
import {formattedDate, formattedDateMonth} from '../utils';
import {$} from '../globals';
import * as textBoxBaseLib from './textBoxBaseLib.js';
import {eventHandler} from '../utils/viewUtils';
import {updateEventValue, updateEventName} from '../utils/domDriverUtils';

function setupDatePicker(props, onUpdate) {
  if (!$.fn.datepicker) {
    require('bootstrap-datepicker');
  }
  if (!R.isNil(props.rangeId) && props.id !== props.toId) {
    $("#" + props.rangeId)
      .datepicker({
        autoclose: true,
        todayHighlight: true,
        todayBtn: false, //not working in this component
        clearBtn: true,
        enableOnReadonly: false,
        inputs: [$("#" + props.id), $("#" + props.toId)],
        weekStart: 1,
        format: props.monthPicker ? "M-yyyy" : "dd-M-yyyy",
        minViewMode: props.monthPicker ? 1 : 0
      })
      .on("changeDate", onUpdate);
  } else if (R.isNil(props.rangeId)) {
    $("#" + textBoxBaseLib.getFieldId(props))
      .datepicker({
        autoclose: true,
        todayHighlight: true,
        todayBtn: false, //not working in this component
        clearBtn: true,
        enableOnReadonly: false,
        weekStart: 1,
        format: props.monthPicker ? "M-yyyy" : "dd-M-yyyy",
        minViewMode: props.monthPicker ? 1 : 0
      })
      .on("changeDate", onUpdate);
  }
}

module.exports = createReactClass({
  "displayName": "DatePicker",
  "propTypes": R.merge(textBoxBaseLib.propTypes, {
    "actions": PropTypes.object,
    "type": PropTypes.oneOf(["date", "dateTime"]),
    "startDate": PropTypes.string,
    "endDate": PropTypes.string,
    "rangeId": PropTypes.string
  }),
  "getInitialState": function getInitialState() {
    return {
      "value": null,
      "ignoreNext": false
    };
  },
  "componentDidMount": function componentDidMount() {
    setupDatePicker(this.props, this.onUpdate);
  },
  "componentDidUpdate": function componentDidUpdate(prevProps) {
    const props = prevProps;
    const nextProps = this.props;
    if (props.rangeId !== nextProps.rangeId) {
      if (!R.isNil(props.rangeId) && props.id !== props.toId) {
        $("#" + props.rangeId).datepicker("destroy");
      } else if (R.isNil(props.rangeId)) {
        $("#" + textBoxBaseLib.getFieldId(props)).datepicker("destroy");
      }
      setupDatePicker(nextProps, this.onUpdate);
    }
  },
  "componentWillUnmount": function componentWillUnmount() {
    if (!R.isNil(this.props.rangeId) && this.props.id !== this.props.toId) {
      $("#" + this.props.rangeId).datepicker("destroy");
    } else if (R.isNil(this.props.rangeId)) {
      $("#" + textBoxBaseLib.getFieldId(this.props)).datepicker("destroy");
    }
  },
  "componentWillReceiveProps": function UNSAFE_componentWillReceiveProps() {
    const props = this.props;
    if (R.isNil(props.rangeId)) {
      this.setState({
        "value": null,
        "ignoreNext": false
      });
    }
  },
  "onUpdate": function onUpdate(event) {
    if (this.state.ignoreNext) {
      this.setState({"ignoreNext": false});
      return;
    }
    if (!R.isNil(this.props.rangeId)) {
      this.onBlur(updateEventValue(updateEventName(event, event.target.id), event.date));
    } else {
      this.onBlur(event);
    }
  },
  "onBlur": function onBlur(event) {
    const props = this.props;
    const field = props.field;
    if (props.onChange) {
      props.onChange(event);
    } else if (field) {
      eventHandler(props.actions, field.get("storeId"), "onChange", event);
      eventHandler(props.actions, field.get("storeId"), "onBlur", event);
    }
  },
  "onTyping": function onTyping(event) {
    this.setState({
      "value": event.currentTarget.value,
      "ignoreNext": true
    });
    //Need to ignore the next "onUpdate", because this onTyping call seems to trigger an extra event=
  },
  "render": function _render() {
    const props = this.props;
    const field = props.field;
    let value = this.state.value;
    if (R.isNil(value)) {
      value = props.monthPicker
        ? R.defaultTo('', formattedDateMonth(field ? field.get("value") : props.value))
        : R.defaultTo('', formattedDate(field ? field.get("value") : props.value));
    }
    return (
      <TextBox
        {...this.props}
        onChange={!R.isNil(this.props.rangeId) ? null : this.onTyping}
        onBlur={!R.isNil(this.props.rangeId) ? null : this.onBlur}
        value={value}
        data-provider="datepicker"
        data-date-format={props.monthPicker ? "M-yyyy" : "dd-M-yyyy"}
        data-type="date"
        type="text"
      />
    );
  }
});
