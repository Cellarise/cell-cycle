"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import {renderRowCells} from './dataTableLib';

module.exports = createReactClass({
  "displayName": "RowCell",
  "propTypes": {
    "title": PropTypes.string.isRequired,
    "tableModel": PropTypes.array.isRequired,
    "row": PropTypes.object,
    "rowNum": PropTypes.number
  },
  "shouldComponentUpdate": function shouldComponentUpdate(nextProps) {
    return this.props.row !== nextProps.row;
  },
  "render": function _render() {
    const {tableModel, row, rowNum, title, modal, onClick} = this.props;
    return (
      <tr key={"tr" + rowNum}
          data-toggle={modal ? "modal" : null}
          data-target={modal}
          onClick={onClick ? onClick(row) : null}>
        {renderRowCells(tableModel, row, rowNum, title)}
      </tr>
    );
  }
});
