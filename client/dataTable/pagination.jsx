"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import Button from '../forms/button.jsx';

const PAGE_SET_SIZE = 5;


function Pagination(props) {
  const {pageSize, onClick, selectedRecords, hasNext, hasPrev, embeddedModel} = props;
  const recordCount = R.defaultTo(0, props.recordCount);
  const page = R.defaultTo(1, props.page);
  const numPages = getNumberOfPages(recordCount, pageSize);
  const selectedRecordsLength = R.defaultTo([], selectedRecords).length;

  if (!R.isNil(hasPrev) || !R.isNil(hasNext)) {
    return (
      <div>
        <div className="text-center hidden-xs" role="group" aria-label="Table pagination">
          <Button key={1}
                  name="page"
                  className="btn btn-default btn-flat btn-sm"
                  disabled={page === 1}
                  title="Go to first page"
                  data-toggle="tooltip"
                  data-placement="top"
                  data-type="number"
                  data-value={1}
                  onClick={onClick}
                  label={<span className="glyphicon mdi-lg mdi-page-first"/>}
          />
          <Button key={2}
                  name="page"
                  className="btn btn-default btn-flat btn-sm"
                  disabled={!hasPrev}
                  title="Go to previous page"
                  data-toggle="tooltip"
                  data-placement="top"
                  data-type="number"
                  data-value={page - 1}
                  onClick={onClick}
                  label={<span className="glyphicon mdi-lg mdi-chevron-left"/>}
          />
          <Button key={3}
                  name="page"
                  className="btn btn-default btn-flat btn-sm"
                  disabled={!hasNext}
                  title="Go to next page"
                  data-toggle="tooltip"
                  data-placement="top"
                  data-type="number"
                  data-value={page + 1}
                  onClick={onClick}
                  label={<span className="glyphicon mdi-lg mdi-chevron-right"/>}
          />
          <Button key={4}
                  name="page"
                  className="btn btn-default btn-flat btn-sm"
                  disabled={true}
                  title="Go to last page not available"
                  data-toggle="tooltip"
                  data-placement="top"
                  data-type="number"
                  data-value={page + 2}
                  onClick={onClick}
                  label={<span className="glyphicon mdi-lg mdi-page-last"/>}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {selectedRecordsLength === 0 ? null :
        <div className="btn-group pull-left hidden-xs table-control-spacer" role="group" aria-label="Table pagination">
          <Button key={0}
                  name="recordsSelected"
                  className="btn btn-flat btn-sm"
                  label={selectedRecordsLength + (selectedRecordsLength === 1 ? " record" : " records") + " selected"}
          />
          <Button key={1}
                  name="clearSelected"
                  className="btn btn-default btn-flat btn-sm"
                  data-embedded-path={!R.isNil(embeddedModel) ? JSON.stringify(embeddedModel) : null}
                  onClick={onClick}
                  label="Clear selected"
          />
        </div>
      }
      <div className="btn-group pull-right hidden-xs table-control-spacer" role="group" aria-label="Table pagination">
        <Button key={1}
                name="page"
                className="btn btn-default btn-flat btn-sm"
                disabled={page === 1}
                title="Go to first page"
                data-toggle="tooltip"
                data-placement="top"
                data-type="number"
                data-value={1}
                data-embedded-path={!R.isNil(embeddedModel) ? JSON.stringify(embeddedModel) : null}
                onClick={onClick}
                label={<span className="glyphicon mdi-lg mdi-page-first"/>}
        />
        <Button key={2}
                name="page"
                className="btn btn-default btn-flat btn-sm"
                disabled={page === 1}
                title="Go to previous page"
                data-toggle="tooltip"
                data-placement="top"
                data-type="number"
                data-value={page - 1}
                data-embedded-path={!R.isNil(embeddedModel) ? JSON.stringify(embeddedModel) : null}
                onClick={onClick}
                label={<span className="glyphicon mdi-lg mdi-chevron-left"/>}
        />
        <Button key={3}
                name="page"
                className="btn btn-default btn-flat btn-sm"
                disabled={page >= numPages}
                title="Go to next page"
                data-toggle="tooltip"
                data-placement="top"
                data-type="number"
                data-value={page + 1}
                data-embedded-path={!R.isNil(embeddedModel) ? JSON.stringify(embeddedModel) : null}
                onClick={onClick}
                label={<span className="glyphicon mdi-lg mdi-chevron-right"/>}
        />
        <Button key={4}
                name="page"
                className="btn btn-default btn-flat btn-sm"
                disabled={page >= numPages}
                title="Go to last page"
                data-toggle="tooltip"
                data-placement="top"
                data-type="number"
                data-value={numPages}
                data-embedded-path={!R.isNil(embeddedModel) ? JSON.stringify(embeddedModel) : null}
                onClick={onClick}
                label={<span className="glyphicon mdi-lg mdi-page-last"/>}
        />
      </div>
      {renderPageButton(props, numPages, pageSize, recordCount, page, embeddedModel)}
    </div>
  );
}

function renderPageButton(props, numPages, pageSize, recordCount, page, embeddedModel) {
  const pageRecordStart = (page - 1) * pageSize + 1;
  const pageRecordEnd = pageRecordStart + (pageSize - 1);
  const buttonLabel = pageRecordStart + " - " + (pageRecordEnd > recordCount ? recordCount : pageRecordEnd) +
  " of " + recordCount;
  if (recordCount === 0) {
    return null;
  }
  return (
    <div key={0} className="btn-group pull-right table-control-spacer dropup" role="group">
      <Button className="btn btn-sm btn-flat btn-default dropdown-toggle"
              id="dataTablePages"
              title="Pages"
              label={<span>
                  <span>{buttonLabel + " "}</span>
                  <span className="caret"></span>
                </span>}
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"/>
      <ul className="dropdown-menu dropdown-menu-right" aria-labelledby="dataTablePages">
        {renderPageButtons(props, numPages, page, pageSize, recordCount, embeddedModel)}
      </ul>
    </div>
  );
}

function renderPageButtons(props, numPages, page, pageSize, recordCount, embeddedModel) {
  const displayPages = (numPages - page) >= PAGE_SET_SIZE ? PAGE_SET_SIZE : (numPages - page);
  if (displayPages < 0) {
    return null;
  }
  return R.times(function mapPage(zeroIdx) {
    const idx = zeroIdx + 1;
    const adjPage = idx + page;
    const pageRecordStart = (adjPage - 1) * pageSize + 1;
    const pageRecordEnd = pageRecordStart + (pageSize - 1);
    const buttonLabel = pageRecordStart + " - " + (pageRecordEnd > recordCount ? recordCount : pageRecordEnd);
    return (
      <li key={idx + 2}>
        <a name="page"
           data-type="number"
           data-value={adjPage}
           data-embedded-path={!R.isNil(embeddedModel) ? JSON.stringify(embeddedModel) : null}
           onClick={props.onClick}>
          {buttonLabel}
        </a>
      </li>
    );
  }, displayPages);
}
function getNumberOfPages(recordCount, pageSize) {
  var numPages = Math.floor((recordCount - 1) / pageSize);
  if (numPages === 0) {
    return 1;
  } else if (numPages < 0) {
    return 0;
  }
  return numPages + 1;
}


Pagination.displayName = "Pagination";
Pagination.propTypes = {
  "recordCount": PropTypes.number,
  "pageSize": PropTypes.number.isRequired,
  "page": PropTypes.number.isRequired,
  "hasPrev": PropTypes.bool,
  "hasNext": PropTypes.bool,
  "onClick": PropTypes.func.isRequired
};

/**
 * @ignore
 */
module.exports = Pagination;
