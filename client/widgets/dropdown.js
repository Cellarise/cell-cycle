"use strict";
import {$} from '../globals';

export let dropdown = {
  "mixin": {
    "componentDidMount": function componentDidMount() {
      if (!$.fn.dropdown) {
        require('../../vendor/bootstrap/js/dropdown');
      }
      //$('[data-toggle="dropdown"]').dropdown();
    },
    "componentDidUpdate": function componentDidUpdate () {
      //$('[data-toggle="dropdown"]').dropdown();
    },
    "componentWillUnmount": function componentWillUnmount() {
      //@todo check if anything is left by not disposing - causing issue with react-hot-loader
      //$('[data-toggle="dropdown"]').dropdown('dispose');
    }
  }
};
