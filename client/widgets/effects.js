"use strict";
import {$, win} from '../globals';

export let effects = {
  "SCREEN_XS": 480,
  "SCREEN_SM": 768,
  "SCREEN_MD": 992,
  "SCREEN_LG": 1200,
  "inkOnClickEvent": function inkOnClickEvent(e) {
    var domNode = e.currentTarget;
    var color = effects.getBackground($(domNode));
    var inverse = (effects.getLuma(color) > 183) ? ' inverse' : '';
    var ink = $('<div class="ink' + inverse + '"></div>');
    var btnOffset = $(domNode).offset();
    var xPos = e.pageX - btnOffset.left;
    var yPos = e.pageY - btnOffset.top;

    ink.css({
      "top": yPos,
      "left": xPos
    }).appendTo($(domNode));

    win.setTimeout(function inkEffectTimeoutRemove() {
      ink.remove();
    }, 1500);
  },
  "getLuma": function getLuma(color) {
    var rgba = color.substring(4, color.length - 1).split(',');
    var r = rgba[0];
    var g = rgba[1];
    var b = rgba[2];
    return 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709
  },
  "getBackground": function getBackground(item) {
    // Is current element's background color set?
    var color = item.css("background-color");
    var alpha = parseFloat(color.split(',')[3], 10);
    if ((isNaN(alpha) || alpha > 0.8) && color !== 'transparent') {
      // if so then return that color if it isn't transparent
      return color;
    }
    // if not: are you at the body element?
    if (item.is("body")) {
      // return known 'false' value
      return false;
    }
    // call getBackground with parent item
    return this.getBackground(item.parent());
  },
  "isBreakpoint": function isBreakpoint(alias) {
    return $('.device-' + alias).is(':visible');
  },
  "minBreakpoint": function minBreakpoint(alias) {
    var breakpoints = ['xs', 'sm', 'md', 'lg'];
    var breakpoint = $('#device-breakpoints div:visible').data('breakpoint');
    return $.inArray(alias, breakpoints) < $.inArray(breakpoint, breakpoints);
  }
};
