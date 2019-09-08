"use strict";
import React from 'react';
import R from 'ramda';
import defaultRenderers from './dataTableDefaultRenderers.jsx';
import {isImmutable} from '../utils';
import {getActiveRecord} from "cell-cycle/client/utils/viewUtils";


export function showEmptyScreen(collection, records) {
  if (records && records.size > 0) {
    return false;
  }
  if (collection && collection.get('records') && collection.get('records').length > 0) {
    return false;
  }
  return true;
}

export function getTableClassNames(cellAlign) {
  //set table class based on cell alignment
  let tableClassNames = "table table-hover table-condensed";
  if (cellAlign === "bottom") {
    tableClassNames = "table table-hover table-condensed-bottom-align";
  } else if (cellAlign === "top") {
    tableClassNames = "table table-hover table-condensed-top-align";
  }
  return tableClassNames;
}

export function renderSortIcon(sortItem) {
  if (!sortItem) {
    return (
      <span></span>
    );
  }
  return (
    <span className={sortItem.get('direction') === 1 ? "dropup" : ""}>
      <span className="caret"></span>
    </span>
  );
}

export function renderRowCells(tableModel, row, rowNum, title, currentRowIndex) {
  return R.addIndex(R.map)((tableModelCol, colNum) => {
    /* eslint-disable dot-notation */
    return (
      <td key={"tr" + rowNum + "td" + colNum}
          className={tableModelCol['class']}
          style={{"overflow": "unset"}}>
        {renderCell(tableModelCol, row, rowNum, title, tableModelCol.className, currentRowIndex)}
      </td>
    );
    /* eslint-enable dot-notation */
  }, tableModel);
}


export function renderCell(tableModelCol, row, rowKey, title, className, currentRowIndex) {
  const rowImmutable = isImmutable(row);
  if (tableModelCol.renderer) {
    return (
      <tableModelCol.renderer
        {...R.merge({
          "item": row,
          "embeddedPath": tableModelCol.embeddedPath,
          "rowKey": rowKey,
          "title": title,
          "column": tableModelCol.column,
          "columnHeader": tableModelCol.columnHeader,
          "className": className,
          "actions": tableModelCol.actions,
          "onChange": tableModelCol.onChange,
          "onChangeId": tableModelCol.onChangeId,
          "onBlur": tableModelCol.onBlur,
          "currentRowIndex": currentRowIndex
        }, tableModelCol.props)} />
    );
  }
  if (defaultRenderers.hasOwnProperty(tableModelCol.column)) {
    return React.createElement(defaultRenderers[tableModelCol.column], R.merge({
      "item": row,
      "embeddedPath": tableModelCol.embeddedPath,
      "rowKey": rowKey,
      "title": title,
      "column": tableModelCol.column,
      "columnHeader": tableModelCol.columnHeader,
      "className": className,
      "actions": tableModelCol.actions,
      "onChange": tableModelCol.onChange,
      "onChangeId": tableModelCol.onChangeId,
      "onBlur": tableModelCol.onBlur,
      "currentRowIndex": currentRowIndex
    }, tableModelCol.props));
  }
  if (tableModelCol.validation && defaultRenderers.hasOwnProperty(tableModelCol.validation.type)) {
    return React.createElement(defaultRenderers[tableModelCol.validation.type], R.merge({
      "item": row,
      "embeddedPath": tableModelCol.embeddedPath,
      "rowKey": rowKey,
      "title": title,
      "column": tableModelCol.column,
      "columnHeader": tableModelCol.columnHeader,
      "className": className,
      "actions": tableModelCol.actions,
      "onChange": tableModelCol.onChange,
      "onChangeId": tableModelCol.onChangeId,
      "onBlur": tableModelCol.onBlur,
      "currentRowIndex": currentRowIndex
    }, tableModelCol.props));
  }
  if (rowImmutable) {
    if (tableModelCol.column && tableModelCol.className) {
      return <span className={tableModelCol.className}>{row.getIn([tableModelCol.column, 'value'])}</span>;
    }
    if (tableModelCol.column) {
      return <span>{row.getIn([tableModelCol.column, 'value'])}</span>;
    }
  } else {
    if (tableModelCol.column && tableModelCol.className) {
      return <span className={tableModelCol.className}>{row[tableModelCol.column]}</span>;
    }
    if (tableModelCol.column) {
      return <span>{row[tableModelCol.column]}</span>;
    }
  }
  return null;
}

export function getPaginatedRecords(store, embeddedModelName, records, pageSize) {
  const activeRecord = getActiveRecord(store);
  const embeddedRecords = records ? records : R.defaultTo([], activeRecord.getIn([embeddedModelName, 'value']));
  const _pageSize = R.defaultTo(
    R.defaultTo(10, store.getIn(["props", "summaryRecords", embeddedModelName, "pageSize"])),
    pageSize
  );
  const pageNum = R.defaultTo(1, store.getIn(["props", "summaryRecords", embeddedModelName, "page"]));
  return R.slice(pageNum * _pageSize - _pageSize, pageNum * _pageSize, embeddedRecords);
}
