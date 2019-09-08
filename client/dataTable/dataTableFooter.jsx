"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import R from 'ramda';
import PageSize from './pageSize.jsx';
import Pagination from './pagination.jsx';


/**
 * Constructor
 * @param {object} props - component properties
 * @param {object} props.collection - the collection properties
 * @param {function(event: object)} props.onCollectionPropChange - the on collection property change event handler
 * @return {React.Element} react element
 */
function DataTableFooter({collection, onCollectionPropChange, showPageSize}) {
  const records = collection.get('records');
  const views = collection.has('views') ? collection.get('views') : null;
  let reportLastGenerated;
  if (!R.isNil(views) && R.contains("Chart", views) && !R.isNil(records) && records.length > 0) {
    reportLastGenerated = "Data last updated at " +
      moment(records[0].created).format('ddd, MMMM Do YYYY, h:mm:ss a');
  }
  return (
    <div className="btn-toolbar" role="toolbar">
      {R.isNil(reportLastGenerated) ? null :
          <span className="col-sm-6 pull-left text-sm text-primary">{reportLastGenerated}</span>
      }
      {
        collection.has('pageSize')
          ? <Pagination pageSize={collection.get('pageSize')}
                        page={collection.get('page')}
                        hasPrev={collection.get('hasPrev')}
                        hasNext={collection.get('hasNext')}
                        recordCount={collection.get('recordCount')}
                        selectedRecords={collection.get('selectedRecords')}
                        onClick={onCollectionPropChange} />
          : null
      }
      {
        showPageSize && collection.has('pageSize')
          ? <PageSize collection={collection}
                      pageSize={collection.get('pageSize')}
                      maxPageSize={collection.get('maxPageSize')}
                      onClick={onCollectionPropChange}/>
          : null
      }
    </div>
  );
}

DataTableFooter.displayName = "DataTableFooter";
DataTableFooter.propTypes = {
  "collection": PropTypes.object.isRequired,
  "onCollectionPropChange": PropTypes.func.isRequired
};

/**
 * @ignore
 */
module.exports = DataTableFooter;
