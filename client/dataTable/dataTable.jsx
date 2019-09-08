"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import {lowerCaseFirstLetter, toCamelCase} from '../utils';
import DataTableToolbar from './dataTableToolbar.jsx';
import DataTableFooter from './dataTableFooter.jsx';
import ViewQueryTable from './viewQueryTable.jsx';
import {renderQueryFilterBar, renderQueryToolbar} from './dataTableQueryLib';
import ViewTable from './viewTable.jsx';
import ConfirmModal from '../dialogs/confirmModal.jsx';
import {showEmptyScreen} from './dataTableLib';

/**
 * DataTable component
 * @param {object} props - component properties
 * @param {string} props.title - the table title (should  be plural)
 * @param {string} props.titleSingular - the singular table title (used in single row action messages)
 * @param {array} props.tableModel - an array of objects - object represents the configuration for each column of the
 * table
 * @param {object} props.collection - the collection properties (from store)
 * @param {string} props.modal - the is of a modal to be shown when clicking on a row
 * @param {React.Class} [props.emptyScreen] - the element to render if the record count is 0
 * @param {object} [props.storeRecord] - used by viewList and viewTable for field properties
 * @param {array} [props.records] - if records available then records will be used instead of collection.records
 * @param {boolean} [props.showToolbar=true] - a flag to show the table toolbar
 * @param {boolean} [props.showDisplayMode=true] - a flag to show the display mode toggle button (will only show if
 * compatible tableModel supplied)
 * @param {boolean} [props.showNewRow=false] - a flag to show new rows in the table
 * @param {string} [props.cellAlign=middle] - the alignment of table cells in rows (one of top|middle|bottom)
 * @param {function(event: object)} props.onCollectionRefresh - the on collection property change event handler
 * @param {function(event: object)} props.onCollectionPropChange - the on collection property change event handler
 * @param {?function(event: object)} [props.onCreate] - the on create event handler
 * @param {?function(event: object)} [props.onUpdate] - the on update event handler
 * @param {?function(event: object)} [props.onSelect] - the on select event handler
 * @param {?function(event: object)} [props.onDelete] - the on delete event handler
 * @param {?function(event: object)} [props.onSearch] - the on search event handler
 * @return {React.Element} react element
 */
function DataTable(props) {
  let {
    title, titleSingular, tableModel, storeRecord, records, modal, //eslint-disable-line no-unused-vars
    showFooter, showFilterBar, filterBar,
    onDeleteLabel, undoDeleteLabel, onCustomTitle, //eslint-disable-line no-unused-vars
    onCustomMessage, onCustomLabel, onCustomOkClassName, classNameFilterbar,
    ...otherProps
  } = props;
  let recordSchema, mergedTableModel = [], collectionFilter;
  let _showFilterBar, _filterBar;
  let _showToolbar, _toolbar;
  let _showFooter;
  let horizintalRuleNoMarginClass = "";

  if (R.isNil(otherProps.collection) || otherProps.collection.get('displayMode') !== "query") {
    //For legacy dataTables
    //Get the record schema from the storeRecord or record
    if (storeRecord) {
      recordSchema = storeRecord.toJS();
    } else if (records && records.size > 0 && records.hasIn([0, 'id']) && records.hasIn([0, 'id', 'value'])) {
      recordSchema = records.get(0).toJS();
    }
    if (recordSchema) {
      mergedTableModel = R.map(
        (col) => (R.merge(recordSchema[col.column] || {}, col)),
        tableModel
      );
    } else {
      mergedTableModel = tableModel;
    }
    _showFilterBar = R.defaultTo(false, showFilterBar);
    _filterBar = filterBar;
    _showToolbar = otherProps.showToolbar || otherProps.showCustomeExport;
    _toolbar = R.isNil(_showToolbar) ? null : renderDataTableToolbar(otherProps);
    _showFooter = showFooter && !_showEmptyScreen;
  } else {
    //For query dataTables
    collectionFilter = otherProps.collection.get('filter');
    if (tableModel && collectionFilter) {
      mergedTableModel = R.concat(collectionFilter.toJS(), tableModel);
      _showFilterBar = R.defaultTo(true, showFilterBar);
      _filterBar = renderQueryFilterBar(
        otherProps, props.allowCustomisation, mergedTableModel
      );
      _showToolbar = otherProps.showToolbar || otherProps.showCustomeExport;
      _toolbar = renderQueryToolbar(otherProps);
      if (otherProps.collection.get('editFilterFlag')) {
        horizintalRuleNoMarginClass = " no-margin";
      } else {
        _showFooter = !otherProps.collection.get('editFilterFlag');
      }
    }
  }


  //Determine whether to show empty screen component
  const _showEmptyScreen = showEmptyScreen(otherProps.collection, records);

  if (R.isNil(titleSingular)) {
    titleSingular = R.defaultTo("", title);
  }

  return (
    <div className="row">
      <div className="col-xs-12">
        {collectionFilter || R.isNil(onCustomLabel) ? null : getModal(
            mergedTableModel,
            "custom",
            "customModal" + toCamelCase(titleSingular),
            onCustomMessage,
            onCustomLabel,
            onCustomOkClassName
          )}
        {collectionFilter || R.isNil(onDeleteLabel) ? null : getModal(
            mergedTableModel,
            "delete",
            "deleteModal" + toCamelCase(titleSingular),
            "Are you sure you want to " + lowerCaseFirstLetter(onDeleteLabel) + " this "
            + lowerCaseFirstLetter(titleSingular) + "?",
            onDeleteLabel,
            "btn-danger btn-flat"
          )}
        {collectionFilter || R.isNil(undoDeleteLabel) ? null : getModal(
            mergedTableModel,
            "undoDelete",
            "undoDeleteModal" + toCamelCase(titleSingular),
            "Are you sure you want to " + lowerCaseFirstLetter(undoDeleteLabel) + " this "
            + lowerCaseFirstLetter(titleSingular) + "?",
            undoDeleteLabel,
            "btn-default btn-flat"
          )}
        {_showFilterBar && _filterBar ? _filterBar : null}
        {_showFilterBar ?
          <hr className={"table-filterbar-hr " + R.defaultTo("", classNameFilterbar) + horizintalRuleNoMarginClass}/>
          : null}
        {_showToolbar ? _toolbar : null}
        {_showToolbar ? <hr className={"table-toolbar-hr" + horizintalRuleNoMarginClass}/> : null}
        {renderDataTable(props, mergedTableModel)}
        {_showFooter
          ? <hr className={"table-footerbar-hr " + R.defaultTo("", classNameFilterbar)} />
          : null}
        {_showFooter ? renderDataTableFooter(otherProps) : null}
      </div>
    </div>
  );
}


function renderDataTableToolbar(otherProps) {
  return (
    <div className="row">
      <div className="col-sm-12">
        <DataTableToolbar
          {...otherProps}
        />
      </div>
    </div>
  );
}

function renderDataTableFooter(otherProps) {
  return (
    <div className="row">
      <div className="col-sm-12">
        <DataTableFooter
          {...otherProps}
        />
      </div>
    </div>
  );
}

function renderDataTable(props, mergedTableModel) {
  if (props.collection && props.collection.get('displayMode') === "query") {
    return (
      <ViewQueryTable
        {...props}
        tableModel={mergedTableModel}
      />
    );
  }
  return (
    <ViewTable
      {...props}
      tableModel={mergedTableModel}
    />
  );
}


function getModal(mergedTableModel, modalAction, id, label, okText, classNameOk) {
  var selectActionColumnIdx = R.findIndex(R.path(["actions", "select"]), mergedTableModel);
  var modalActionColumnIdx = R.findIndex(R.path(["actions", modalAction]), mergedTableModel);
  var origAction, newAction, selectAction, modal;

  //Hijack the action onClick if passed down. Required because bootstrap modal cannot receive props.
  if (modalActionColumnIdx > -1 && selectActionColumnIdx > -1) {
    origAction = mergedTableModel[modalActionColumnIdx].actions[modalAction];
    selectAction = mergedTableModel[selectActionColumnIdx].actions.select;
    mergedTableModel[modalActionColumnIdx].actions[modalAction] = selectAction;
    mergedTableModel[modalActionColumnIdx].actions[modalAction].authorised = origAction.authorised;
    newAction = (event, hide) => {
      origAction(event); //wrapper for orig action
      hide();
    };
    modal = (
      <ConfirmModal
        title={okText}
        classNameOk={classNameOk}
        label={label}
        id={id}
        onClick={newAction}
        okText={okText}
      />
    );
  }
  return modal;
}

DataTable.displayName = "DataTable";
DataTable.propTypes = {
  "id": PropTypes.string,
  "title": PropTypes.string.isRequired,
  "titleSingular": PropTypes.string,
  "collection": PropTypes.object,
  "tableModel": PropTypes.array.isRequired,
  "modal": PropTypes.string,
  "emptyScreen": PropTypes.object,
  "loadingScreen": PropTypes.object,
  "storeRecord": PropTypes.object,
  "records": PropTypes.object,
  "showToolbar": PropTypes.bool,
  "showFooter": PropTypes.bool,
  "showPageSize": PropTypes.bool,
  "showFilterBar": PropTypes.bool,
  "filterBar": PropTypes.object,
  "showDisplayMode": PropTypes.bool,
  "showNewRow": PropTypes.bool,
  "cellAlign": PropTypes.oneOf(["middle", "top", "bottom"]),
  "actionBar": PropTypes.object,
  "searchBarClassName": PropTypes.string,
  "onCollectionRefresh": PropTypes.func,
  "onCollectionPropChange": PropTypes.func,
  "onClick": PropTypes.func,
  "onCreate": PropTypes.func,
  "onUpdate": PropTypes.func,
  "onSelect": PropTypes.func,
  "onView": PropTypes.func,
  "onDelete": PropTypes.func,
  "onSearch": PropTypes.func,
  "onCreateLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "onDeleteLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "onUndoDeleteLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "onViewLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "onUpdateLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "onSearchLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "onCustomLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "onPaginate": PropTypes.func,
  "onCustom": PropTypes.func,
  "onCustomTitle": PropTypes.string,
  "onCustomMessage": PropTypes.string,
  "onCustomOkClassName": PropTypes.string
};
DataTable.defaultProps = {
  "id": "dt1",
  "showToolbar": true,
  "showFooter": true,
  "showPageSize": true,
  "showNewRow": false,
  "cellAlign": "middle",
  "onCreateLabel": "Add",
  "onDeleteLabel": "Delete",
  "undoDeleteLabel": "Undo delete",
  "onViewLabel": "View",
  "onUpdateLabel": "Edit",
  "onSearchLabel": "Search",
  "loadingScreen": (
    <div className="row">
      <div className="col-sm-12 text-center">
        <div className="height-5">
          <span><span className="text-info glyphicon mdi-refresh mdi-spin mdi-2x"/>&nbsp;Loading</span>
        </div>
      </div>
    </div>
  )
};

/**
 * @ignore
 */
module.exports = DataTable;
