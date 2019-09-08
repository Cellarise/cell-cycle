"use strict";
import {win} from '../globals';

var toastr = {
  "mixin": {
    "componentDidMount": function componentDidMount() {
      if (!win.toastr) {
        win.toastr = require('toastr');
      }
    },
    "componentWillUnmount": function componentWillUnmount() {
      //win.toastr.remove();
    }
  },
  "options": function options(opts) {
    win.toastr.options = opts;
  },
  "warning": function warning(message, title, optionsOverride) {
    win.toastr.warning(message, title, optionsOverride);
  },
  "success": function success(message, title, optionsOverride) {
    win.toastr.success(message, title, optionsOverride);
  },
  "info": function info(message, title, optionsOverride) {
    win.toastr.info(message, title, optionsOverride);
  },
  "error": function error(message, title, optionsOverride) {
    win.toastr.error(message, title, optionsOverride);
  },
  "clear": function clear() {
    // Remove current toasts using animation
    win.toastr.clear();
  }
};

module.exports = toastr;
