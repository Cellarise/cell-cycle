"use strict";
import React from "react"; //eslint-disable-line
import createReactClass from 'create-react-class'
import {createSyntheticEvent} from '../utils/domDriverUtils';
import {$} from 'cell-cycle/client/globals';
import 'cell-cycle/vendor/jquery-ui/jquery-ui';
import 'cell-cycle/vendor/jquery-ui/colResizable';

const DataTableColumnResizable = createReactClass({

  "componentDidMount": function componentDidMount() {
    $("#" + this.props.id).colResizable({
      'liveDrag': true,
      'onResize': this.onSlide,
      'minWidth': 35,
      'resizeMode': 'overflow'
    });
  },
  "componentWillUnmount": function componentWillUnmount() {
    $("#" + this.props.id).colResizable("destroy");
  },
  //callback function
  "onSlide": function onSlide(e) {
    const {onChange} = this.props;
    let max = 0, count = 0;
    $(e.currentTarget).find("tr").each(function () {
      count = $(this).find("td").length;
      if (count > max) {
        max = count;
      }
    });

    var columns = $(e.currentTarget).find("td");
    var ranges = [], i, colWidth;

    for (i = 0; i < count; i++) {
      colWidth = columns.eq(i).width();
      ranges.push(colWidth);
    }

    onChange(createSyntheticEvent("_widthChangeOnDrag", ranges));
  },

  "render": function render() {
    return null;
  }
});

DataTableColumnResizable.displayName = "DataTableColumnResizable";


/**
 * @ignore
 */
module.exports = DataTableColumnResizable;
