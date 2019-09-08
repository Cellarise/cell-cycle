"use strict";
import {doc} from '../globals';
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Entry point for loading react element and rendering (calls ReactDOM.render)
 * @param {Bacon.Property} model - the model
 * @param {React} rootComponent - root components to render in context.jsx
 * @param {Immutable.Map} callback - callback when view rendering completed
 */
export default function load(model, rootComponent, callback) {
  //render application
  ReactDOM.render(
    React.createElement(
      require('../common/context.jsx'),
      {
        "model": model.modelStream,
        "actions": model.drivers.DOM,
        "rootComponent": rootComponent
      }
    ),
    doc.getElementById('react-root')
  );
  callback();
}

