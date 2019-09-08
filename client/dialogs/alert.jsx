"use strict";
import React from 'react'; //eslint-disable-line
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
var toastrWidget = require('./toastr');


/**
 * Alert component
 */
module.exports = createReactClass({
  "displayName": "Alert",
  "contextTypes": {
    "model": PropTypes.object.isRequired,
    "actions": PropTypes.object.isRequired
  },
  "componentDidMount": function componentDidMount() {
    var modelStream = this.context.model;
    toastrWidget.mixin.componentDidMount();
    this._boundModelStream = modelStream
      .skipDuplicates(
        (oldModel, newModel) => {
          var result = oldModel.getIn(["toastMessages", "counter"]) === newModel.getIn(["toastMessages", "counter"])
            || newModel.getIn(["toastMessages", "label"]) === ""
            || newModel.getIn(["toastMessages", "label"]) === null;
          return result;
        }
      )
      .onValue((model) => {
        var toastOptions = model.get("toastMessages").toJS();
        if (toastOptions.label !== "") { //need for the first value which skips the skipDuplicates function
          delete toastOptions.counter;
          toastrWidget[toastOptions.type](toastOptions.label, null, toastOptions);
        }
      });
  },
  "componentWillUnmount": function componentWillUnmount() {
    this._boundModelStream();
    toastrWidget.mixin.componentWillUnmount();
  },
  "render": function _render() {
    return null;
  }
});

