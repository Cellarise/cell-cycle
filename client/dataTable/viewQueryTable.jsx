"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import CheckBox from '../forms/checkBox.jsx';
import QueryFilterEditor from './dataTableQueryFilterEditor.jsx';
import FilterBox from '../collection/filterBox.jsx';
import {
  showEmptyScreen, getTableClassNames, renderSortIcon, renderFilterIcon, renderRowCells, emptyScreen, fixedLabelLength
}
from './dataTableQueryLib';
import ViewList from './viewList.jsx';
import ViewChart from './viewChart.jsx';
import {createSyntheticEvent} from '../utils/domDriverUtils';
import MassUpdateModal from '../dialogs/massUpdateModal.jsx';
import {labelWithUom} from '../utils/uomHelpers';
import ReactTableContainer from "react-table-container";

/**
 * ViewTable component
 * @param {Object} props - component properties
 * @return {React.Element} react element
 */
function ViewQueryTable(props) {
  const {
    collection, onCollectionPropChange, onCollectionFilterChange, massUpdateStore, actions, validationConfig,
    loadingScreen, classNameTable, localCache, _model, tableHeightOffset
  } = props;
  let rowReplacementView;
  const icon = collection.get('icon');
  const label = collection.get('label');
  const filterName = collection.get('filterName');
  const isPictureView = R.contains(collection.get('view'), ["Picture"]);
  const isChartView = R.contains(collection.get('view'), ["Chart"]);

  const windowDimensions = _model.getIn(['stores', 'routerUI', 'props', 'windowDimensions']);
  let _height = 480;
  if (!R.isNil(windowDimensions)) {
    _height = R.clamp(350, 3000, windowDimensions.get('height') - 370 - R.defaultTo(0, tableHeightOffset));
  }

  if (filterName === "") {
    return null;
  }

  if (collection.get('editFilterFlag')) {
    return (
      <QueryFilterEditor
        collection={collection}
        onCollectionPropChange={onCollectionPropChange}
        onCollectionFilterChange={onCollectionFilterChange}
      />
    );
  }
  if (collection.get('loading')) {
    //_height = _height - 68;
    rowReplacementView = (
      <div style={isPictureView || isChartView ? null :
        {"position": "absolute", "top": "45%", "left": "45%"}}>{loadingScreen}</div>
    );
  } else if (showEmptyScreen(collection)) {
    //_height = _height - 68;
    if (icon && label) {
      rowReplacementView =(
        <div style={isPictureView || isChartView ? null :
          {"position": "absolute", "top": "40%", "left": "40%"}}>{emptyScreen(label, icon)}</div>
      );
    } else {
      rowReplacementView = (<div></div>);
    }
  } else if (isPictureView) {
    _height = "auto";
    rowReplacementView = (<ViewList {...props}/>);
  } else if (isChartView) {
    _height = "auto";
    rowReplacementView = (<ViewChart {...props}/>);
  }

  /**
   * ReactTableContainer v2.0.1 customised with attribute customTable.
   * ReactTableContainer duplicates the header which results in id duplication of filterBox components.
   * CustomTable allows provision of an alternate table which is the table with header filterbox rendered but no rows.
   * The child table rendered for ReactTableContainer contains a header without filterbox rendered.
   */
  return (
    <div className={isChartView ? classNameTable : R.defaultTo("table-responsive", classNameTable)}>
      {R.isNil(massUpdateStore) ? null :
        <MassUpdateModal
          store={massUpdateStore}
          actions={actions}
          validationConfig={validationConfig}
          onClick={props.onCollectionPropChange}
          accountType={props.accountType}
          localCache={localCache}
        />
      }
      {/* @todo the DataTableColumnResizable component introduces styles which adversely impacts formatting of table*/}
      {/*<DataTableColumnResizable*/}
        {/*id={"table-" + title.replace(/s/g,'')}*/}
        {/*onChange={onCollectionFilterChange}*/}
        {/*collection={collection}*/}
      {/*/>*/}
      {isChartView || isPictureView ? null :
        <ReactTableContainer width="100%" height={_height}
                             customTable={renderTable(props, rowReplacementView, true, false)}>
          {renderTable(props, rowReplacementView, false, true)}
        </ReactTableContainer>
      }
      {isPictureView
        ? renderTable(props, null, true)
        : null
      }
      {isChartView || isPictureView
        ? rowReplacementView
        : null
      }
    </div>
  );
}

function renderTable(props, rowReplacementView, noRows, hideFilters) {
  const {
    title, titleSingular, tableModel, collection, cellAlign
  } = props;
  return (
    <table id={"table-" + title.replace(/s/g, '')} aria-label={title}
           className={getTableClassNames(cellAlign)} summary={"This is a query table for " + title}>
      <caption className="sr-only">{title}</caption>
      {renderTableHeader(props, hideFilters)}
      <tbody>
      {R.isNil(rowReplacementView) && noRows !== true
        ? renderRows(props, tableModel, collection, titleSingular || title)
        : null
      }
      {!R.isNil(rowReplacementView) && noRows !== true ?
          <tr>
            <td>{rowReplacementView}</td>
          </tr>
          : null
      }
      </tbody>
    </table>
  );
}

function renderTableHeader(props, hideFilters) {
  const {
    tableModel, collection, bulkActionHandlers
  } = props;
  const editableFilter = collection.get('editableFilter');
  return (
    <thead style={{"backgroundColor":"#FFF"}}>
    <tr>
      {R.isNil(bulkActionHandlers) ? null :
        <th style={{"width": "40px", "verticalAlign": "middle", "backgroundColor":"#FFF"}}>
          {editableFilter ? null :
            <CheckBox
              id="selectedAll"
              name="selectedAll"
              standalone={true}
              showLabel={false}
              hasFeedback={false}
              value={collection.get('selectedAll')}
              onChange={() => {
                props.onCollectionPropChange(createSyntheticEvent("selectedAll"));
              }}
            />
          }
        </th>
      }
      {renderHeader(tableModel, props)}
    </tr>
    {collection.get('loading') || !editableFilter ? null :
      <tr style={{"height": "39px"}}>
        {R.isNil(bulkActionHandlers) || hideFilters === true ? null :
          <th style={{"width": "40px", "verticalAlign": "middle"}}>
            <CheckBox
              id="selectedAll"
              name="selectedAll"
              standalone={true}
              showLabel={false}
              hasFeedback={false}
              value={collection.get('selectedAll')}
              onChange={() => {
                props.onCollectionPropChange(createSyntheticEvent("selectedAll"));
              }}
            />
          </th>
        }
        {renderFilterHeader(tableModel, props, collection, hideFilters)}
      </tr>
    }
    </thead>
  );
}

function renderFilterHeader(tableModel, props, collection, hideFilters) {
  const _tableModel = R.filter(
    (fldMod) => {
      return fldMod.aggregate !== "filter";
    },
    tableModel
  );
  return R.addIndex(R.map)((col, colNum) => {
    return renderFilterHeaderCell(col, colNum, props, collection, hideFilters);
  }, _tableModel);
}

function renderFilterHeaderCell(col, colNum, props, collection, hideFilters) {
  const field = collection.getIn(['filterModel', col.field]);
  return (
    <th
      key={"th" + colNum}
      style={{"width": col.width, "verticalAlign": "middle"}}
      className="table-cell-overflow-visible"
      name="field">
      {hideFilters === true || R.isNil(field) || (
        !R.contains(field.get('type'), ["number", "date", "dateTime", "string", "boolean"]) &&
        R.isNil(field.get('fullTextSearch')) && R.isNil(field.get('wildcardSearch'))) ? null :
        <FilterBox
          id={colNum + col.field + "filterRptHdr"}
          width={col.width - 10}
          onBlur={() => (null)}
          standalone={true}
          showLabel={false}
          localCache={props.localCache}
          disabled={collection.get('customisable') !== true}
          activeFilter={collection.get('activeFilter')}
          field={field}
          onChange={props.onCollectionFilterChange}
          column={col}
        />
      }
    </th>
  );
  /* eslint-enable dot-notation */
}

function renderHeader(tableModel, props) {
  const _tableModel = R.filter(
    (fldMod) => {
      return fldMod.aggregate !== "filter";
    },
    tableModel
  );
  return R.addIndex(R.map)((col, colNum) => {
    return renderHeaderCell(col, colNum, props);
  }, _tableModel);
}

function renderHeaderCell(col, colNum, props) {
  const onCollectionPropChange = props.onCollectionPropChange
  const editableFilter = props.collection.get('editableFilter');
  /* eslint-disable dot-notation */
  return (
    <th
      key={"th" + colNum}
      name="sort"
      data-value={col.field}
      style={{"width": col.width, "whiteSpace": "nowrap"}}
      className={col['classNameHeader']}
      title={col.description}
      data-toggle={col.description ? "tooltip" : null}
      data-placement={col.description ? "bottom" : null}
      onClick={editableFilter === true && col.sortable === true ? onCollectionPropChange : null}>
      <span className={col['className']}
            title={labelWithUom(col)}>{R.isNil(col['className']) ? fixedLabelLength(col) : null}</span>
      {editableFilter === true ? renderSortIcon(col) : null}
      {renderFilterIcon(col)}
    </th>
  );
  /* eslint-enable dot-notation */
}

function renderRows(props, tableModel, collection, title) {
  const collectionRecords = collection.get('records');
  if (collectionRecords) {
    const _tableModel = R.filter(
      (fldMod) => {
        return fldMod.aggregate !== "filter";
      },
      tableModel
    );
    return R.addIndex(R.map)(renderRow(props, _tableModel, title), collectionRecords);
  }
  return null;
}

function renderRow(props, tableModel, title) {
  return function (row, rowNum) {
    return (
      <tr key={"tr" + rowNum}
          data-toggle={props.modal ? "modal" : null}
          data-target={props.modal}
          onClick={props.onClick ? props.onClick(row, rowNum) : null}>
        {R.isNil(props.bulkActionHandlers) ? null :
          <td>
            <CheckBox
              id={"selectRow" + rowNum}
              name={"selectRow" + rowNum}
              standalone={true}
              showLabel={false}
              stickyCheckBox={true}
              hasFeedback={false}
              value={row._selected}
              disabled={row._disabled}
              onChange={() => {
                props.onCollectionPropChange(createSyntheticEvent("selectRow", rowNum));
              }}
            />
          </td>
        }
        {renderRowCells(tableModel, row, rowNum, title, props)}
      </tr>
    );
  };
}


ViewQueryTable.displayName = "ViewQueryTable";
ViewQueryTable.propTypes = {
  "title": PropTypes.string.isRequired,
  "titleSingular": PropTypes.string,
  "tableModel": PropTypes.array.isRequired,
  "collection": PropTypes.object.isRequired,
  "onCollectionPropChange": PropTypes.func,
  "emptyScreen": PropTypes.object,
  "modal": PropTypes.string,
  "onClick": PropTypes.func,
  "cellAlign": PropTypes.oneOf(["middle", "top", "bottom"])
};
ViewQueryTable.defaultProps = {
  "showNewRow": false,
  "cellAlign": "middle"
};
/**
 * @ignore
 */
module.exports = ViewQueryTable;
