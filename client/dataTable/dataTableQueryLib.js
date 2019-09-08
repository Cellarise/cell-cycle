"use strict";
import React from 'react';
import R from 'ramda';
import defaultRenderers from './dataTableDefaultRenderers.jsx';
import DataTableQueryToolbar from './dataTableQueryToolbar.jsx';
import {objectToHash} from "../libraries/router";
import QueryFilterBar from './dataTableQueryTabs';
import {pluralise} from '../utils/stringHelpers';
import {labelWithUom} from '../utils/uomHelpers';
import {$} from '../globals';
import {createSyntheticEvent} from '../utils/domDriverUtils';
import {eventHandler} from '../utils/viewUtils';
import DropdownBox from '../collection/dropdownBox.jsx';


export function fixedLabelLength(col) {
  const label = labelWithUom(col);
  const colwidth = R.defaultTo(1, col.width);
  const str = label.replace(/\s/g, ''); // Remove all space from the label
  const len = Math.round(colwidth / 8) - 2; // Convert the pixel width to charactor length
  if (str.length > len) {
    return label.slice(0, len - 4) + "...";
  }
  return label;
}

export function showEmptyScreen(collection, records) {
  if (records && records.size > 0) {
    return false;
  }
  if (collection && collection.get('records') && collection.get('records').length > 0) {
    return false;
  }
  return true;
}

export function renderQueryFilterBar(otherProps, allowCustomisation, tableModel) {
  const collection = otherProps.collection;
  const customisable = collection.get('customisable');
  const disabled = collection.get('editFilterFlag');
  const highlightSelected = !collection.get('addFilterFlag');
  const querySpecs = R.defaultTo([], collection.get('querySpecs'));

  return (
    <div>
      <QueryFilterBar
        customisable={customisable}
        disabled={disabled}
        highlightSelected={highlightSelected}
        querySpecs={querySpecs}
        onCollectionPropChange={otherProps.onCollectionPropChange}
        onCollectionFilterChange={otherProps.onCollectionFilterChange}
        allowCustomisation={allowCustomisation}
        collection={collection}
        localCache={otherProps.localCache}
        tableModel={tableModel}
      />
    </div>
  );
}

export function renderQueryToolbar(otherProps, listViewCompatible) {
  return (
    <div className="row">
      <div className="col-sm-12">
        <DataTableQueryToolbar
          {...otherProps}
          showDisplayMode={otherProps.showDisplayMode && listViewCompatible}
        />
      </div>
    </div>
  );
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

export function renderFilterIcon(col) {
  if (R.isNil(col.where)) {
    return (
      <span />
    );
  }
  return (
    <span>
      <span>&nbsp;</span>
      <span className="glyphicon mdi-filter-outline" />
    </span>
  );
}

export function renderSortIcon(col) {
  if (col.sortable !== true) {
    return (
      <span />
    );
  }
  if (col.sort !== 1 && col.sort !== -1) {
    return (
      <span />
    );
  }
  return (
    <span>
      <span>&nbsp;</span>
      <span className={col.sort === 1
        ? "glyphicon mdi-sort-ascending"
        : "glyphicon mdi-sort-descending"} />
    </span>
  );
}

export function renderRowCells(tableModel, row, rowNum, title, props) {
  return R.addIndex(R.map)((tableModelCol, colNum) => {
    /* eslint-disable dot-notation */
    return (
      <td key={"tr" + rowNum + "td" + colNum} className={tableModelCol['class'] || tableModelCol['classNameColumn']}>
        {renderCellWithLink(tableModelCol, row, rowNum, title, props)}
      </td>
    );
    /* eslint-enable dot-notation */
  }, tableModel);
}

function renderCellWithLink(tableModelCol, row, rowKey, title, props) {
  if (props.linkHashObject) {
    const linkHashObj = props.linkHashObject(row, tableModelCol);
    if (!R.isNil(linkHashObj) && R.contains(tableModelCol.type, ["string", "number", "date", "boolean"])
      && !R.contains("URLLink", R.defaultTo("", tableModelCol.renderer))) {
      return (
        <a href={objectToHash(linkHashObj)}>
          {renderCell(tableModelCol, row, rowKey, title, props)}
        </a>
      );
    }
  }
  return renderCell(tableModelCol, row, rowKey, title, props);
}


export function renderCell(tableModelCol, row, rowKey, title, props) {
  const currentRowIndex = props.currentRowIndex;
  const fieldRenderers = props.fieldRenderers;
  if (!R.isNil(tableModelCol.renderer) && fieldRenderers.hasOwnProperty(tableModelCol.renderer)) {
    return React.createElement(fieldRenderers[tableModelCol.renderer], R.merge({
      "accessToken": props.accessToken,
      "localCache": props.localCache,
      "dashboard": props.dashboard,
      "accountType": props.accountType,
      "linkHashObject": props.linkHashObject,
      "onCellClick": props.onCellClick,
      "item": row,
      "embeddedPath": tableModelCol.embeddedPath,
      "rowKey": rowKey,
      "title": title,
      "validation": tableModelCol.validation,
      "column": tableModelCol.field,
      "columnHeader": tableModelCol.label,
      "className": tableModelCol.className,
      "actions": tableModelCol.actions,
      "currentRowIndex": currentRowIndex
    }, tableModelCol.props));
  }
  if (fieldRenderers.hasOwnProperty(tableModelCol.field)) {
    return React.createElement(fieldRenderers[tableModelCol.field], R.merge({
      "localCache": props.localCache,
      "item": row,
      "embeddedPath": tableModelCol.embeddedPath,
      "rowKey": rowKey,
      "title": title,
      "validation": tableModelCol.validation,
      "column": tableModelCol.field,
      "columnHeader": tableModelCol.label,
      "className": tableModelCol.className,
      "actions": tableModelCol.actions,
      "currentRowIndex": currentRowIndex
    }, tableModelCol.props));
  }
  if (defaultRenderers.hasOwnProperty(tableModelCol.field)) {
    return React.createElement(defaultRenderers[tableModelCol.field], R.merge({
      "localCache": props.localCache,
      "item": row,
      "embeddedPath": tableModelCol.embeddedPath,
      "rowKey": rowKey,
      "title": title,
      "validation": tableModelCol.validation,
      "column": tableModelCol.field,
      "columnHeader": tableModelCol.label,
      "className": tableModelCol.className,
      "actions": tableModelCol.actions,
      "currentRowIndex": currentRowIndex
    }, tableModelCol.props));
  }
  if (tableModelCol.type && defaultRenderers.hasOwnProperty(tableModelCol.type)) {
    return React.createElement(defaultRenderers[tableModelCol.type], R.merge({
      "localCache": props.localCache,
      "item": row,
      "embeddedPath": tableModelCol.embeddedPath,
      "rowKey": rowKey,
      "title": title,
      "validation": tableModelCol.validation,
      "column": tableModelCol.field,
      "columnHeader": tableModelCol.label,
      "className": tableModelCol.className,
      "actions": tableModelCol.actions,
      "currentRowIndex": currentRowIndex
    }, tableModelCol.props));
  }
  if (tableModelCol.field && tableModelCol.className) {
    return <span className={tableModelCol.className}>{row[tableModelCol.field]}</span>;
  }
  if (tableModelCol.field) {
    return <span>{row[tableModelCol.field]}</span>;
  }
  return null;
}

export function renderActionBar(row, rowNum, actionBarCol, title) {
  return (
    <div className="text-right">
      {<defaultRenderers.actionButtonCell
        {...R.merge({
          "actionButton": "btn-sm btn-icon-toggle btn-primary",
          "modalButton": "btn-sm btn-icon-toggle btn-primary",
          "item": row,
          "embeddedPath": actionBarCol.embeddedPath,
          "rowKey": rowNum,
          "title": title,
          "column": actionBarCol.column,
          "className": actionBarCol.className,
          "actions": actionBarCol.actions
        }, actionBarCol.props)} />}
    </div>
  );
}

export function emptyScreen(label, icon) {
  return (
    <div className="row margin-bottom-10">
      <div className="col-sm-12 text-center">
        <div className="mask height-2-5 text-center-dark">
          <div className="bottom-layer">
              <span className="text-primary-alt text-medium text-xxxxl">
                <span className={"glyphicon " + icon + " text-primary-dark"}/>
              </span>
          </div>
          <div className="top-layer">
              <span className="text-xxl text-primary-dark">
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <span className="glyphicon mdi-numeric-0-box-outline text-primary-dark text-bold"/>
              </span>
          </div>
        </div>
        <div>
          <div>
            <span className="text-primary-dark text-lg">{"No " + pluralise(label) + " found"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function renderBulkActions({
                                    bulkActionHandlers, bulkActionHandlersLabel,
                                    onCollectionPropChange, collection, numberOfActions, modalId,
  actions
}) {
  if (R.isNil(bulkActionHandlers)) {
    return null;
  }
  const _bulkActionHandlers = R.map(
    (bulkActionHandler) => {
      return R.assoc(
        "action",
        () => {
          if (!bulkActionHandler.disabled) {
            if (!R.isNil(bulkActionHandler.onClickHandler)) {
              bulkActionHandler.onClickHandler(bulkActionHandler.onClickId);
            } else if (bulkActionHandler.newActionId) {
              onCollectionPropChange(
                createSyntheticEvent("massUpdate", bulkActionHandler.actionId, bulkActionHandler.title
                )
              );
              eventHandler(actions, "massUpdateModalUI", bulkActionHandler.newActionId);
            } else {
              onCollectionPropChange(
                createSyntheticEvent("massUpdate", bulkActionHandler.actionId, bulkActionHandler.title
                )
              );
            }
            if (bulkActionHandler.abortModal !== true && R.isNil(bulkActionHandler.onClickHandler)) {
              $(R.defaultTo("#massUpdateModal", modalId)).modal('show');
            }
          }
        },
        bulkActionHandler
      );
    },
    bulkActionHandlers
  );
  if (!R.isNil(collection) && R.isNil(numberOfActions)) {
    numberOfActions = R.filter((item) => (item._selected), collection.get('records')).length;
  }
  let label = "Actions";
  if (R.isNil(bulkActionHandlersLabel)) {
    switch (numberOfActions) {
      case 0:
        label = "Actions";
        break
      case 1:
        label = "Actions for " + numberOfActions + " item";
        break
      default:
        label = "Actions for " + numberOfActions + " items";
    }
  } else {
    label = bulkActionHandlersLabel;
  }
  return (
    <DropdownBox
      id="bulkActions-dropdownBox"
      label="bulkAction"
      value={label}
      className="btn-sm btn-primary"
      menuContent={true}
      records={_bulkActionHandlers}
      disabled={R.isNil(collection) ? false : collection.get('loading')}
    />
  );
}
