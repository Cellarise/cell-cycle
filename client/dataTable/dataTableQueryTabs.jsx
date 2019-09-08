"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from 'ramda';
import Button from '../forms/button.jsx';
import Card from '../page/card.jsx';
import FilterBox from '../collection/filterBox.jsx';
import {fixedLength} from '../utils'
import {createSyntheticEvent} from "cell-cycle/client/utils/domDriverUtils";
import {$} from '../globals';
import {labelWithUom} from "cell-cycle/client/utils/uomHelpers";

const QueryFilterBar = createReactClass({
  componentDidMount: function componentDidMount() {
    // scrollActiveTabIntoView(this.props);
  },
  render: function render() {
    const {
      customisable, disabled, highlightSelected, querySpecs, onCollectionPropChange, allowCustomisation, collection,
      tableModel
    } = this.props;
    const hasAggregateView = R.contains("Aggregate", collection.get('views'));
    const hideAddTab = customisable !== true || allowCustomisation === false;
    let tabClass = hideAddTab ? "col-xs-12" : "col-xs-10";
    let toolbarClass = hideAddTab ? "col-xs-0" : "col-xs-2";

    return (
      <div>
        <div className="row" role="toolbar">
          <div className={tabClass}>
            <Card
              name="query-table-tabs"
              className="audit-history no-margin"
              classNameBody="no-padding"
            >
              <div className="btn-group" role="group" aria-label="Table filter">
                <div className="">
                  {R.addIndex(R.map)(
                    (querySpec, idx) => {
                      const selected = querySpec.selected && highlightSelected;
                      return (
                        <Button
                          key={idx}
                          name="filterName"
                          id={"queryTab" + querySpec.name}
                          label={selected
                            ? <div key={idx} className="width-4" style={{"display": "inline-block"}}>
                              <span>{fixedLength(querySpec.name, 10)}</span>
                              {getTabIcon(querySpecs[idx], selected, onCollectionPropChange)}
                            </div>
                            : querySpec.name}
                          data-value={querySpec.name}
                          style={{"paddingLeft": 5, "paddingRight": 5}}
                          className={
                            "btn-primary-dark btn-sm  " + (selected ? "" : "width-4 ") +
                            (selected ? "" : "btn-flat")
                          }
                          onClick={onCollectionPropChange}
                          disabled={disabled}
                        />
                      );
                    },
                    querySpecs
                  )}
                </div>
              </div>
            </Card>
          </div>
          {hideAddTab ? null :
            <div className={toolbarClass}>
              <Button
                name="addFilter"
                label="Add tab"
                className={
                  "btn-primary btn-sm width-3 pull-right"
                }
                onClick={onCollectionPropChange}
              />
            </div>
          }
        </div>
        {!hasAggregateView || R.isNil(collection) ? null :
          <div className="row" role="toolbar">
            <hr className="no-margin"/>
            <div className="col-sm-12 margin-top-10">
              <span className="text-primary-dark">Report filters</span>
            </div>
            <div className="col-xs-1">
            </div>
            <div className="col-xs-8 col-sm-10">
              <Card
                name="query-table-toolbar"
                className="card margin-bottom-10"
                classNameBody="no-padding"
                form={true}
              >
                <div className="" role="group" aria-label="Query filter">
                  <div className="row">
                    {renderFilterHeader(this.props, collection, tableModel)}
                  </div>
                </div>
              </Card>
            </div>
            <div className="col-xs-3 col-sm-2">
            </div>
          </div>
        }
      </div>
    );
  }
});

function renderFilterHeader(props, collection, tableModel) {
  //get non aggregate fields
  // const fieldSpecs = collection.get('fieldSpecs');
  const _tableModel = R.filter(
    (fldMod) => {
      return fldMod.aggregate === "filter" && !R.isNil(collection.getIn(['filterModel', fldMod.field]));
    },
    tableModel
  );
  return R.addIndex(R.map)((col, colNum) => {
    return renderFilterHeaderCell(col, colNum, props, collection);
  }, _tableModel);
}

function renderFilterHeaderCell(col, colNum, props, collection) {
  const field = collection.getIn(['filterModel', col.field]);
  return (
    <div key={colNum} className="col-xs-4 col-sm-3" style={{"height": "60px"}}>
      {R.isNil(field) || (
        !R.contains(field.get('type'), ["number", "date", "dateTime", "string", "boolean"]) &&
        R.isNil(field.get('fullTextSearch')) && R.isNil(field.get('wildcardSearch'))) ? null :
        <FilterBox
          id={colNum + col.field + "filter"}
          width={col.width - 10}
          onBlur={() => (null)}
          standalone={true}
          showLabel={false}
          filterLabel={true}
          label={labelWithUom(col)}
          localCache={props.localCache}
          disabled={collection.get('customisable') !== true}
          activeFilter={collection.get('activeFilter')}
          field={field}
          onChange={props.onCollectionFilterChange}
          column={col}
        />
      }
    </div>
  );
  /* eslint-enable dot-notation */
}

// function scrollActiveTabIntoView(props) {
//   const selectObject = R.filter(R.propEq('selected', true), props.querySpecs);
//   $("#queryTab" + selectObject[0].name).scrollIntoView();
// }

function getTabIcon(querySpec, selected, onCollectionPropChange) {
  const style = {
    float: "right", top: '0px',
    color: querySpec.selected ? '#FFF' : '#146e9e'
  };
  const style1 = {
    float: "right", top: '0px',
    color: querySpec.selected ? '#FFF' : '#146e9e',
    marginLeft: 5
  };
  if (querySpec.locked === true) {
    return <span title="Tab cannot be edited"
                 data-placement="top"
                 data-toggle="tooltip"
                 style={style} className={"glyphicon mdi-lock"}/>;
  } else if (selected) {
    return (
      <span><span key="1" title="Delete tab"
                  data-placement="top"
                  data-toggle="tooltip"
                  style={style1} className={"glyphicon mdi-close-circle"}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    $("#deleteFilterConfirmModal").modal('show');
                  }}
      /><span key="2" title="Edit tab"
              data-placement="top"
              data-toggle="tooltip"
              style={style}
              className={"glyphicon mdi-pencil"}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onCollectionPropChange(createSyntheticEvent("editFilter"));
              }}
      /></span>
    );
    // return     <Button
    //   name={"editTab"}
    //   label={<span className={"glyphicon mdi-pencil"}/>}
    //   title={"Edit tab"}
    //   data-toggle-tooltip="tooltip"
    //   data-placement="top"
    //   data-toggle="modal"
    //   data-target={"#"}
    //   className={"btn-xs btn-icon-toggle btn-primary"}
    //   onClick={() => {
    //     onCollectionPropChange(createSyntheticEvent("editFilter"));
    //   }}
    // />;
  }
}

module.exports = QueryFilterBar;

