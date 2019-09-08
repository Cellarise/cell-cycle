"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import {logger, win} from '../globals';
import {createSyntheticEvent} from "../utils/domDriverUtils";

//Highest order component to set the react context with the modelStream and Dom actions
module.exports = createReactClass({
  displayName: "__context",
  contextTypes: {},
  childContextTypes: {
    model: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired
  },
  getChildContext: function getChildContext() {
    return {
      model: this.props.model,
      actions: this.props.actions
    };
  },
  propTypes: {
    model: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
    rootComponent: PropTypes.func.isRequired
  },
  componentDidMount: function componentDidMount() {
    if (win.addEventListener) {
      win.addEventListener('resize', this.onResize);
      win.addEventListener('beforeprint', this.onBeforePrint);
      win.addEventListener('afterprint', this.onAfterPrint);
    }
  },
  componentWillUnmount : function componentWillUnmount () {
    if (win.removeEventListener) {
      win.removeEventListener('resize', this.onResize);
      win.removeEventListener('beforeprint', this.onBeforePrint);
      win.removeEventListener('afterprint', this.onAfterPrint);
    }
  },
  onResize: function onResize(event) {
    this.getChildContext().actions.push({
      "storeId": "routerUI",
      "id": "onWindow",
      "event": event
    });
  },
  onBeforePrint: function onBeforePrint(event) {
    this.getChildContext().actions.push({
      "storeId": "routerUI",
      "id": "onWindowPrintEvent",
      "event": createSyntheticEvent("printMode")
    });
  },
  onAfterPrint: function onAfterPrint(event) {
    this.getChildContext().actions.push({
      "storeId": "routerUI",
      "id": "onWindowPrintEvent",
      "event": createSyntheticEvent("normalMode")
    });
  },
  render: function render() {
    //Keep at least one open subscription to ensure actions trigger (override lazy evaluation)
    const _boundModelStream = this.getChildContext().model.onValue(() => {});  //eslint-disable-line no-unused-vars
    //calling _boundModelStream will remove subscription

    //Call refresh
    this.getChildContext().actions.push({
      "storeId": "authenticationUI",
      "id": "refresh"
    });
    logger.log("Context render root component");
    return React.createElement(this.props.rootComponent);
  }
});
