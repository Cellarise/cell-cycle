"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import {isImmutable} from '../utils';
import {labelWithUom} from '../utils/uomHelpers';
import {showEmptyScreen, getTableClassNames, renderSortIcon, renderRowCells, getPaginatedRecords} from './dataTableLib';
import {createSyntheticEvent} from '../utils/domDriverUtils';
import CheckBox from '../forms/checkBox.jsx';
import ReactTableContainer from "react-table-container";
import FilterBox from "cell-cycle/client/collection/filterBox";
import Immutable from 'immutable';
// import Row from './Row.jsx';


/**
 * ViewTable component
 * @param {Object} props - component properties
 * @return {React.Element} react element
 */
function ViewTable(props) {
  const {
    title, titleSingular, tableModel, collection, loadingScreen, emptyScreen, storeRecord, showNewRow,
    cellAlign, tableHeight, maxTableHeight, id, fixedHeader, noFixedHeight
  } = props;
  let {records} = props;
  if (collection ? collection.get('loading') : false) {
    return loadingScreen;
  }

  //add new row
  if (records) {
    if (showNewRow) {
      if (!R.isNil(props.onPaginate) && !R.isNil(props.store) && !R.isNil(props.embeddedModelName)) {
        records = records.push(storeRecord.setIn(['id', 'value'], records.size));
        records = R.filter((row) => !R.isNil(row) && row.getIn(['id', 'showRecord']) !== false, records);
        records = getPaginatedRecords(props.store, props.embeddedModelName, records, props.pageSize);
      } else {
        if (props.showEditableTableFilter) {
          records = R.filter(
            (row) => {
              return !R.isNil(row) && row.getIn(['id', 'showRecord']) !== false;
            },
            records
          );
        }
        records = records.push(storeRecord);
      }
    }
  }

  if (showEmptyScreen(collection, records)) {
    if (emptyScreen) {
      return emptyScreen;
    }
    return (<div></div>);
  }

  return (
    <div className="table-responsive"
         style={{"minHeight": R.defaultTo(400, tableHeight), "height": maxTableHeight}}>
      {R.isNil(fixedHeader) ?
        renderTable(props, collection, tableModel, records, titleSingular, title, id, cellAlign,  false)
      :
      <ReactTableContainer width="100%" height={noFixedHeight ? null : "400px"}
                           customTable={renderTable(props, collection, tableModel, records,
                             titleSingular, title, id, cellAlign,  true)}
      >
        {renderTable(props, collection, tableModel, records, titleSingular, title, id, cellAlign,  false)}
      </ReactTableContainer>
      }
    </div>
  );
}

function renderTable(props, collection, tableModel, records, titleSingular, title, id, cellAlign, noRows) {
  return (
    <table id={"table-" + title.replace(/s/g, '')}
           aria-label={title}
           className={getTableClassNames(cellAlign)} summary={"This is a table for " + title}>
      <caption className="sr-only">{title}</caption>
      <thead style={{"backgroundColor":"#FFF"}}>
      <tr style={{"height": "39px"}}>
        {R.isNil(props.bulkActionHandlers) ? null :
          <th style={{"width": "40px", "verticalAlign": "middle", "backgroundColor":"#FFF"}}>
            <CheckBox
              id={"selectedAll" + id}
              name="selectedAll"
              standalone={true}
              showLabel={false}
              hasFeedback={false}
              value={collection.get('selectedAll')}
              onChange={() => {
                props.onCollectionPropChange(createSyntheticEvent("selectedAll", props.filterValue));
              }}
            />
          </th>
        }
        {renderHeader(tableModel, collection ? collection.get('sort') : null, props.onCollectionPropChange)}
      </tr>
      {props.showEditableTableFilter ?
        <tr style={{"height": "39px"}}>
          {renderFilterHeader(tableModel, props)}
        </tr>
        : null
      }
      </thead>
      <tbody>
      {
        noRows !== true ?
        renderRows(props, tableModel, collection ? collection.get('records') : null, records, titleSingular || title)
        : null
      }
      </tbody>
    </table>
  );
}

function renderHeader(tableModel, sort, onCollectionPropChange) {
  return R.addIndex(R.map)((col, colNum) => {
    const colHead = col.hasOwnProperty("columnHeader") ? col.columnHeader : labelWithUom(col);
    const sortColumn = R.isNil(col.sortColumn) ? col.column : col.sortColumn;
    let sortItem;
    if (col.sortable && sortColumn && sort) {
      sortItem = sort.find(_sortItem => (_sortItem.get('field') === sortColumn));
    }
    return renderHeaderCell(colHead, col, colNum, sortColumn, sortItem, onCollectionPropChange);
  }, tableModel);
}

function renderFilterHeader(tableModel, props) {
  if (tableModel.length > 0) {
    return R.addIndex(R.map)((col, colNum) => {
      return renderFilterHeaderCell(col, colNum, props);
    }, tableModel);
  }
}

function renderFilterHeaderCell(col, colNum, props) {
  if (!R.isNil(col) && R.is(Object, col) && !R.isNil(col.validation) && !R.isNil(col.validation.type)) {
    const colType = col.validation.type
    const editableTableFilterFields = props.editableTableFilterFields;
    return (
      <th
        key={"th" + colNum}
        style={{"verticalAlign": "middle"}}
        className="table-cell-overflow-visible"
        name="field">
        {R.isNil(editableTableFilterFields) || editableTableFilterFields.length === 0 ||
        R.contains(col.column, editableTableFilterFields) &&
        R.contains(colType, ["number", "string", "boolean"]) ?
          <FilterBox
            id={colNum + col.field + "filterRptHdr"}
            onBlur={() => (null)}
            standalone={true}
            showLabel={false}
            localCache={props.localCache}
            disabled={false}
            name={col.column}
            activeFilter={col.column}
            field={Immutable.fromJS(col)}
            editableTable={true}
            filterValue={R.isNil(props.filterValues) ? null : props.filterValues.getIn([col.column])}
            type={col.validation.type}
            embededPath={props.embededPath}
            onChange={props.onCollectionEditableTableFilterChange}
            column={col}
          />
          : null
        }
      </th>
    );
  }
  /* eslint-enable dot-notation */
}


function renderHeaderCell(colHead, col, colNum, sortColumn, sortItem, onCollectionPropChange) {
  /* eslint-disable dot-notation */
  return (
    <th
      key={"th" + colNum}
      name="sort"
      data-type="JSON"
      data-value={JSON.stringify([{
        "field": sortColumn,
        "direction": sortItem ? (-1 * sortItem.get('direction')) : 1
      }])}
      style={{"width": col.width, "whiteSpace": "nowrap"}}
      className={col['class'] || col['classNameColumn']}
      title={col.description}
      data-toggle={col.description ? "tooltip" : null}
      data-placement={col.description ? "top" : null}
      onClick={col.sortable ? onCollectionPropChange : null}>
      <span className={col['classNameColumnHeader']}
            title={colHead}>{colHead}</span>
      {renderSortIcon(sortItem)}
    </th>
  );
  /* eslint-enable dot-notation */
}

function renderRows(props, tableModel, collectionRecords, records, title) {
  //render collection based (faster, but non-editable)
  if (records) {
    return records.map(renderRow(props, tableModel, title));
  }
  if (collectionRecords) {
    return R.addIndex(R.map)(renderRow(props, tableModel, title), collectionRecords);
  }
  return null;
}

function renderRow(props, tableModel, title) {
  //check if new row
  const showNewRow = props.showNewRow;
  const dataTableId = props.showNewRow;
  return function(row, rowNum) {
    const rowImmutable = isImmutable(row);
    if (rowImmutable && !showNewRow && row.has("id")
      && (
        (row.hasIn(['id', 'value']) && row.getIn(['id', 'value']) === null)
      )) {
      return null;
    }
    // if (rowImmutable) {
    //   return (
    //     <Row tableModel={tableModel} row={row} rowNum={rowNum} title={title} />
    //   );
    // }
    if (props.onPaginate) {
      rowNum = row.getIn(['id', 'value']);
    }
    if (!R.isNil(props.bulkActionHandlers)) {
      return (
        <tr key={"tr" + rowNum}
            onClick={props.onRowClick ? () => {
              props.onRowClick(
                createSyntheticEvent("selectRowNonToggle", rowNum, null, null, row, rowNum, row.id)
              );
            } : null}>
          <td onClick={(event) => {
            event.stopPropagation();
          }}>
            <CheckBox
              id={"selectRow" + rowNum + dataTableId}
              name={"selectRow" + rowNum}
              standalone={true}
              stickyCheckBox={true}
              showLabel={false}
              hasFeedback={false}
              value={row._selected}
              onChange={() => {
                props.onCollectionPropChange(
                  createSyntheticEvent("selectRow", rowNum, null, null, row, rowNum, row.id)
                );
              }}
            />
          </td>
          {renderRowCells(tableModel, row, rowNum, title)}
        </tr>
      );
    }
    return (
      <tr data-id={rowNum} key={"tr" + rowNum}
          data-toggle={props.modal ? "modal" : null}
          data-target={props.modal}
          onClick={props.onClick ? props.onClick(row, rowNum) : null}>
        {renderRowCells(tableModel, row, rowNum, title)}
      </tr>
    );
  };
}


ViewTable.displayName = "ViewTable";
ViewTable.propTypes = {
  "title": PropTypes.string.isRequired,
  "titleSingular": PropTypes.string,
  "tableModel": PropTypes.array.isRequired,
  "records": PropTypes.object,
  "storeRecord": PropTypes.object,
  "collection": PropTypes.object,
  "onCollectionPropChange": PropTypes.func,
  "emptyScreen": PropTypes.object,
  "modal": PropTypes.string,
  "onClick": PropTypes.func,
  "showNewRow": PropTypes.bool,
  "cellAlign": PropTypes.oneOf(["middle", "top", "bottom"])
};
ViewTable.defaultProps = {
  "showNewRow": false,
  "cellAlign": "middle"
};
/**
 * @ignore
 */
module.exports = ViewTable;
