"use strict";
import React from "react"; //eslint-disable-line no-unused-vars
import R from 'ramda';
import {getActiveRecord, getEventHandler} from "../utils/viewUtils";
import Pagination from "./pagination";


function SummaryTablePaginate({store, embeddedModelName, actions,
                                showNewRow, hidePagination, pageSize, recordCount, children}) {
  if (hidePagination === true) {
    return [children];
  }
  const activeRecord = getActiveRecord(store);
  let embeddedModelRecords = activeRecord.getIn([embeddedModelName, 'value']);
  //assume only editable tables with showNewRow have editable filter which can filter rows
  if (showNewRow) {
    embeddedModelRecords = R.filter((row) => !R.isNil(row) && row.getIn(['id', 'showRecord']) !== false, embeddedModelRecords);
  }
  const _recordCount = (recordCount ? recordCount : embeddedModelRecords.size) + (showNewRow ? 1 : 0);
  const _pageSize = R.defaultTo(
    R.defaultTo(10, store.getIn(["props", "summaryRecords", embeddedModelName, "pageSize"])),
    pageSize
  );
  const page = R.defaultTo(1, store.getIn(["props", "summaryRecords", embeddedModelName, "page"]));
  return [
    children,
    recordCount > _pageSize ?
    <Pagination
      key={2}
      pageSize={_pageSize}
      page={page}
      recordCount={_recordCount}
      embeddedModel={[embeddedModelName]}
      onClick={getEventHandler(actions, store, 'onViewTablePagination')}
    /> : null
  ];
}

module.exports = SummaryTablePaginate;
