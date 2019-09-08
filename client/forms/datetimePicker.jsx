"use strict";
import React from 'react';
import PropTypes from 'prop-types'; //eslint-disable-line no-unused-vars
import createReactClass from 'create-react-class';
import R from "ramda";
import TextBox from './textBox.jsx';
import {formattedDate, formattedDateTimeAMPM} from '../utils';
import {$} from '../globals';
import * as textBoxBaseLib from './textBoxBaseLib.js';
import {eventHandler} from '../utils/viewUtils';
import {updateEventValue, updateEventName} from '../utils/domDriverUtils';
import {shouldFieldComponentUpdate} from "cell-cycle/client/libraries/viewV2";

require('../../../eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css');


function setupDatePicker(props, onUpdate) {
  if (!$.fn.datetimepicker) {
    require('eonasdan-bootstrap-datetimepicker');
  }
  const defaultOptions = {
    icons: {
      time: 'glyphicon mdi-clock mdi-lg',
      date: 'glyphicon mdi-calendar mdi-lg',
      up: 'glyphicon mdi-chevron-up mdi-lg',
      down: 'glyphicon mdi-chevron-down mdi-lg',
      previous: 'glyphicon mdi-chevron-left mdi-lg',
      next: 'glyphicon mdi-chevron-right mdi-lg',
      today: 'glyphicon mdi-watch-import mdi-sm',
      clear: 'glyphicon mdi-delete mdi-lg',
      close: 'glyphicon mdi-calendar-remove mdi-lg'
    },
    format: 'LT',
  }
  const pickerOptions = R.isNil(props.options) ?
    defaultOptions : R.merge(defaultOptions, props.options)
  if (!R.isNil(props.linkedId) && props.id !== props.toDate) {
    $("#" + props.fromDate).datetimepicker(pickerOptions);
  } else if (R.isNil(props.linkedId)) {
    $("#" + textBoxBaseLib.getFieldId(props))
      .datetimepicker(pickerOptions)
      .on("dp.change", onUpdate);
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
  "shouldComponentUpdate": function shouldComponentUpdate(nextProps, nextState) {
    if (shouldFieldComponentUpdate(this, nextProps, nextState) && !R.isNil(nextProps.linkedId)) {
      setupDatePicker(this.props, this.onUpdate);
    }
    return shouldFieldComponentUpdate(this, nextProps, nextState);
  },
  "componentWillUnmount": function componentWillUnmount() {
    if (!R.isNil(this.props.linkedId)) {
      if (!R.isNil(this.props.toDate.datetimepicker)) {
        $("#" + this.props.toDate).datetimepicker("destroy");
      } else if (!R.isNil(this.props.fromDate.datetimepicker)){
        $("#" + this.props.fromDate).datetimepicker("destroy");
      }
    } else if (R.isNil(this.props.linkedId)) {
      $("#" + textBoxBaseLib.getFieldId(this.props)).datetimepicker("destroy");
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
      eventHandler(props.actions, props.storeId, "onChange", event);
      eventHandler(props.actions, props.storeId, "onBlur", event);
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
      value = R.defaultTo('', props.mode === "date" ? formattedDate(field ? field.get("value") : props.value) :
        formattedDateTimeAMPM(field ? field.get("value") : props.value));
    }
    return (
      <TextBox
        {...this.props}
        onChange={!R.isNil(this.props.rangeId) ? null : this.onTyping}
        onBlur={!R.isNil(this.props.rangeId) ? null : this.onBlur}
        value={value}
        data-provider={props.mode === "date" ? "date" : "datetime"}
        data-date-format={props.mode === "date" ? "DD MMM YYYY" : "DD MMM YYYY hh:mm A"}
        data-type={props.mode === "date" ? "date" : "datetime"}
        type="text"
      />
    );
  }
});
