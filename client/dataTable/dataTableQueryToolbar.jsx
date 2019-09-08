"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import Button from '../forms/button.jsx';
import DropdownBox from '../collection/dropdownBox.jsx';
import DownloadHelper from '../widgets/downloadHelper.jsx';
import {createSyntheticEvent} from '../utils/domDriverUtils';
import ConfirmModal from '../dialogs/confirmModal.jsx';
import ExportModal from '../dialogs/exportModal.jsx';
import {$} from '../globals';
import {renderBulkActions} from './dataTableQueryLib';


/**
 * Constructor
 * @param {object} props - component properties
 * @return {React.Element} react element
 */
function DataTableToolbar(props) {
  //hide toolbar if editing filter
  if (props.collection.get('editFilterFlag')) {
    return null;
  }
  return (
    <div className="btn-toolbar" role="toolbar">
      {!R.isNil(props.allowCustomisation) && props.allowCustomisation === false ? null :
        <React.Fragment>
          {props.showToolbar &&
          <div className="btn-group pull-left" role="group" aria-label="Filter management">
            {renderToggleButton(props)}
          </div>
          }
          {props.showCustomeExport &&
          <div className="btn-group pull-right" style={props.showCustomeExportStyle}
               role="group" aria-label="Export management">
            {renderToggleButton(props, props.showCustomeExport)}
          </div>
          }
        </React.Fragment>
      }
      <div className="btn-group pull-left" role="group" aria-label="Bulk actions">
        {renderBulkActions(props)}
      </div>
      {renderActionsBar(props)}
      {props.customToolbar}
    </div>
  );
}


/**
 * Render display mode toggle button
 * @param {object} props - component properties
 * @return {React.Element} react element
 */
function renderToggleButton(props, showCustomeExport) {
  const onCollectionPropChange = props.onCollectionPropChange;
  const collection = props.collection;
  const displayMode = collection.get('view');
  const views = collection.get('views');
  const recordCount = R.defaultTo(0, collection.get('recordCount'));
  const exportable = R.defaultTo({}, collection.get('exportable'));
  const editableFilter = collection.get('editableFilter');
  const editableAccountFilter = collection.get('editableAccountFilter');
  const editableSystemFilter = collection.get('editableSystemFilter');
  const hasMultipleViews = R.defaultTo([], collection.get('views')).length > 1;
  const hasPDFExportModel = !R.isNil(collection.getIn(['exportModel']));
  const selectedQuerySpec = collection.get('selectedQuerySpec');
  const level = selectedQuerySpec.level;
  const locked = selectedQuerySpec.locked;
  const hasParent = selectedQuerySpec.hasParent;
  let deleteTitle, deleteLabel, revertTitle, revertLabel;
  let filterHeaderLabel = "Filter";
  let isDeleteable = false;
  let isRevertable = false;
  if (level === "system" && editableSystemFilter) {
    isDeleteable = true;
    deleteTitle = "Delete system tab";
    deleteLabel = "Are you sure you want to delete this system level tab?";
    filterHeaderLabel = "Filter (system level tab)";
  } else if (level === "account" && editableAccountFilter) {
    isDeleteable = true;
    deleteTitle = "Delete account tab";
    deleteLabel = "Are you sure you want to delete this account level tab?";
    if (hasParent) {
      isRevertable = true;
      revertTitle = "Revert to system level tab";
      revertLabel = "Are you sure you want to revert to the system level defaults for this tab?";
    }
    filterHeaderLabel = "Filter (account level tab)";
  } else if (level === "user" && editableFilter) {
    isDeleteable = true;
    deleteTitle = "Delete personal tab";
    deleteLabel = "Are you sure you want to delete this personal tab?";
    if (hasParent) {
      isRevertable = true;
      revertTitle = "Revert to account level tab";
      revertLabel = "Are you sure you want to revert to the account level defaults for this tab?";
    }
    filterHeaderLabel = "Filter (personal tab)";
  } else if (level === "account" && editableFilter) {
    filterHeaderLabel = "Filter (account default tab)";
  } else if (level === "system" && editableFilter) {
    filterHeaderLabel = "Filter (system default tab)";
  }
  if (!editableFilter) {
    if (level === "system") {
      filterHeaderLabel = "Filter (locked by system administrator)";
    } else {
      filterHeaderLabel = "Filter (locked by account administrator)";
    }
  } else if (level === "system" && !editableSystemFilter && editableAccountFilter) {
    //filterHeaderLabel = "Filter (account level tab)";
  }
  let records = [
    {
      "header": filterHeaderLabel,
      "disabled": !editableFilter
    },
    {
      "label": "Change columns",
      "disabled": !editableFilter,
      "action": () => {
        onCollectionPropChange(createSyntheticEvent("editFilter"));
      }
    },
    {
      "label": "Clear all filters",
      "hideIfDisabled": true,
      "disabled": !editableFilter,
      "action": () => {
        $("#clearFilterConfirmModal").modal('show');
      }
    },
    {
      "label": locked === true
        ? "Allow users to personalise tab"
        : "Prevent users personalising tab",
      "hideIfDisabled": true,
      "disabled": !editableAccountFilter || level === "user",
      "action": () => {
        if (locked === true) {
          onCollectionPropChange(createSyntheticEvent("unlockFilter"));
        } else {
          onCollectionPropChange(createSyntheticEvent("lockFilter"));
        }
      }
    },
    {
      "label": revertTitle,
      "hideIfDisabled": true,
      "disabled": !isRevertable,
      "action": () => {
        $("#revertFilterConfirmModal").modal('show');
      }
    },
    {
      "label": deleteTitle,
      "hideIfDisabled": true,
      "disabled": !isDeleteable || isRevertable,
      "action": () => {
        $("#deleteFilterConfirmModal").modal('show');
      }
    },
    {
      "label": "Save as account level tab",
      "hideIfDisabled": true,
      "disabled": !editableAccountFilter || locked || level !== "user",
      "action": () => {
        onCollectionPropChange(createSyntheticEvent("applyAccountFilter"));
      }
    },
    {
      "header": "Display",
      "hideIfDisabled": true,
      "disabled": !hasMultipleViews
    },
    {
      "label": "Table mode",
      "hideIfDisabled": true,
      "disabled": !hasMultipleViews || R.isNil(displayMode) || displayMode === "" || displayMode === "Table",
      "action": () => {
        onCollectionPropChange(createSyntheticEvent("view", "Table"));
      }
    },
    {
      "label": "Picture mode",
      "hideIfDisabled": true,
      "disabled": !hasMultipleViews || displayMode === "Picture" || !R.contains("Picture", views),
      "action": () => {
        onCollectionPropChange(createSyntheticEvent("view", "Picture"));
      }
    },
    {
      "label": "Chart mode",
      "hideIfDisabled": true,
      "disabled": !hasMultipleViews || displayMode === "Chart" || !R.contains("Chart", views),
      "action": () => {
        onCollectionPropChange(createSyntheticEvent("view", "Chart"));
      }
    }
  ];
  const exportTabs = [
    {
      "label": "Export current view",
      "action": () => {
        onCollectionPropChange(createSyntheticEvent("exportPage"));
      }
    },
    {
      "label": "Export to CSV (all rows)",
      "disabled": !exportable,
      "hideIfDisabled": true,
      "action": () => {
        $("#csvExportModal").modal('show');
      }
    },
    {
      "label": "Export to PDF (with options)",
      "hideIfDisabled": true,
      "disabled": !hasPDFExportModel || !exportable,
      "action": () => {
        onCollectionPropChange(createSyntheticEvent("exportPdf"));
        $("#pdfExportModal").modal('show');
      }
    }
  ];
  if (!R.isNil(showCustomeExport) && showCustomeExport) {
    records = exportTabs;
  } else if (R.isNil(props.showCustomeExport) || !props.showCustomeExport) {
    records.push({"header": "Export"})
    records = R.concat(records, exportTabs);
  }
  if (!R.isNil(collection.get('views'))) {
    return (
      <div>
        <ConfirmModal
          title={deleteTitle}
          label={deleteLabel}
          id="deleteFilterConfirmModal"
          onClick={(event, hide) => {
            if (level === "user") {
              //delete personal tab
              onCollectionPropChange(createSyntheticEvent("deleteFilter"));
            } else if (level === "account") {
              //delete account tab
              onCollectionPropChange(createSyntheticEvent("deleteAccountFilter"));
            } else if (level === "system") {
              //delete system tab
              onCollectionPropChange(createSyntheticEvent("deleteAccountFilter"));
            }
            hide();
          }}
          classNameOk="btn-danger btn-flat"
          cancelText="No"
          okText="Yes"
        />
        <ConfirmModal
          title={revertTitle}
          label={revertLabel}
          id="revertFilterConfirmModal"
          onClick={(event, hide) => {
            if (level === "user") {
              //revert to account level
              onCollectionPropChange(createSyntheticEvent("deleteFilter"));
            } else if (level === "account") {
              //revert to system level
              onCollectionPropChange(createSyntheticEvent("deleteAccountFilter"));
            }
            hide();
          }}
          classNameOk="btn-danger btn-flat"
          cancelText="No"
          okText="Yes"
        />
        <ConfirmModal
          title="Clear filters"
          label="Are you sure you want to clear all filters?"
          id="clearFilterConfirmModal"
          onClick={(event, hide) => {
            onCollectionPropChange(createSyntheticEvent("clearFilters"));
            hide();
          }}
          classNameOk="btn-danger btn-flat"
          cancelText="No"
          okText="Yes"
        />
        {exportable ?
          <ExportModal
            title="Export to CSV"
            id="csvExportModal"
            onCollectionPropChange={onCollectionPropChange}
            eventName={"requestCSVExportAll"}
            recordCount={recordCount}
          />
          : null}
        {hasPDFExportModel ?
          <ExportModal
            title="Export to PDF"
            id="pdfExportModal"
            activeRecord={collection.get('exportModel')}
            onCollectionPropChange={onCollectionPropChange}
            eventName={"requestPDFExportAll"}
            recordCount={recordCount}
          />
        : null}
        <DownloadHelper
          counter={collection.getIn(['exportCounter'])}
          parser="jsonTocsv"
          fileContent={collection.getIn(['downloadRecords'])}
          fileName={collection.getIn(['name']) + "-" + collection.getIn(['filterName']) + ".csv"}
          fileMime="text/csv"
        />
        {props.hideTabOptions !== true ?
          <DropdownBox
            id="bulkActions-dropdownBox"
            label="bulkAction"
            value={showCustomeExport ? "Export options" : "Tab options"}
            className="btn-sm btn-primary"
            menuContent={true}
            records={records}
            disabled={collection.get('loading')}
          />
          : null
        }
      </div>
    );
  }
}


/**
 * Render action buttons
 * @param {object} props - component properties
 * @return {React.Element} react element
 */
function renderActionsBar(props) {
  const {onCreateLabel} = props;

  let actions = [];

  if (props.onCreate) {
    actions.push(
      <Button
        key="onCreate"
        name="onCreate"
        onClick={props.onCreate}
        className="btn-sm btn-primary hidden-xs"
        label={onCreateLabel}
      />
    );
    actions.push(
      <Button
        key="onCreateFloat"
        name="onCreateFloat"
        onClick={props.onCreate}
        title={onCreateLabel}
        data-toggle-tooltip="tooltip"
        data-placement="left"
        className="btn-sm btn-primary btn-floating-action hidden-sm hidden-md hidden-lg"
        label={<span className="glyphicon mdi-plus mdi-2x"/>}
      />
    );
  }

  if (props.customAction) {
    actions.push(props.customAction);
  }
  return (
    <div className="btn-group pull-right" role="group" aria-label="Table actions">
      {actions}
    </div>
  );
}


DataTableToolbar.displayName = "DataTableToolbar";
DataTableToolbar.propTypes = {
  "onCreate": PropTypes.func,
  "onUpdate": PropTypes.func,
  "onDelete": PropTypes.func,
  "actionBar": PropTypes.object,
  "customAction": PropTypes.object,
  "showDisplayMode": PropTypes.bool,
  "onCreateLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "onViewLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "onEditTabLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ])
};
DataTableToolbar.defaultProps = {
  "showDisplayMode": false
};

/**
 * @ignore
 */
module.exports = DataTableToolbar;
