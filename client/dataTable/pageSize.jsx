import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class'
import R from 'ramda';
import Button from '../forms/button.jsx';
import {dropdown} from '../widgets/dropdown';

module.exports = createReactClass({
  "displayName": "collection/dataTable/pageSize",
  "mixin": [dropdown.mixin],
  "propTypes": {
    "pageSize": PropTypes.number.isRequired,
    "onClick": PropTypes.func.isRequired
  },
  "render": function render() {
    const {collection, onClick, pageSize, maxPageSize} = this.props;
    const querySpecs = collection.get('querySpecs');
    const isChartMode = !R.isNil(querySpecs) && querySpecs.length > 0 && querySpecs[0].view === "Chart"
    return (
      <div className="btn-group pull-right table-control-spacer dropup" role="group" aria-label="Page size">
        <Button className="btn btn-sm btn-flat btn-default dropdown-toggle"
                id="dataTablePageSize"
                title="Items per page"
                label={<span>
                  <span>{"Items per page: " + pageSize + " "}</span>
                  <span className="caret"></span>
                </span>}
                data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"/>
        <ul className="dropdown-menu" aria-labelledby="dataTablePageSize">
          <li><a name="pageSize" onClick={onClick} data-type="number" data-value={2}>2</a></li>
          <li><a name="pageSize" onClick={onClick} data-type="number" data-value={5}>5</a></li>
          <li><a name="pageSize" onClick={onClick} data-type="number" data-value={10}>10</a></li>
          <li><a name="pageSize" onClick={onClick} data-type="number" data-value={20}>20</a></li>
          <li><a name="pageSize" onClick={onClick} data-type="number" data-value={50}>50</a></li>
          {maxPageSize && maxPageSize > 50 ?
            <li><a name="pageSize" onClick={onClick} data-type="number" data-value={maxPageSize}>{maxPageSize}</a></li>
            : null
          }
          {isChartMode ?
            <li><a name="pageSize" onClick={onClick} data-type="number" data-value={500}>500</a></li>
            : null
          }
        </ul>
      </div>
    );
  }
});
