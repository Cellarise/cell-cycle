"use strict";
import React from "react"; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from 'ramda';
import {render, defaultProps, propTypes} from './textBoxBaseLib.js';
import {shouldFieldComponentUpdate} from '../libraries/viewV2';


module.exports = createReactClass({
  "displayName": "forms/textBox",
  "propTypes": R.merge(propTypes, {
    "field": PropTypes.object
  }),
  "shouldComponentUpdate": function shouldComponentUpdate(nextProps, nextState) {
    return shouldFieldComponentUpdate(this, nextProps, nextState);
  },
  "render": function _render() {
    const {field, ...props} = this.props;
    return render(R.mergeAll([defaultProps, field ? field.toJS() : {}, props]));
  }
});
