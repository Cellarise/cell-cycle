"use strict";
import React from "react";
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from "ramda";
import Immutable from 'immutable';
import {createSyntheticEvent, getValue} from '../utils/domDriverUtils';
import ViewTable from './viewTable.jsx';
import * as dataTableDefaultRenderers from './dataTableDefaultRenderers.jsx';
import SelectBox from '../forms/selectBox.jsx';
import {$} from 'cell-cycle/client/globals';
import 'cell-cycle/vendor/jquery-ui/jquery-ui';


const DataTableColumnConfig = createReactClass({

  "componentDidMount": function componentDidMount() {
    const $node = $(this.node);
    $node.sortable({
      'items': 'tbody tr',
      'start': this.sortStart,
      'update': this.sortUpdate
    });
  },
  "componentWillUnmount": function componentWillUnmount() {
    const $node = $(this.node);
    $node.sortable('destroy');
  },

  "sortStart": function sortStart() {
    // const $node = $(this.node);
  },

  "sortUpdate": function sortUpdate() {
    const {field, onChange} = this.props;
    const fieldName = field.get('name');
    const records = field.get('value');

    // Get the  sorted  table row data index from DOM
    const $node = $(this.node);
    var newPositions = $node.sortable('toArray', { attribute: 'data-id' });

    // Lets React reorder the DOM
    $node.sortable('cancel');

    // Create the udated data set with new sorted row index
    const recordValues = records.toJS();
    let updatedRecords = Immutable.fromJS(R.map(index => recordValues[index], newPositions));

    onChange(createSyntheticEvent(fieldName, updatedRecords, null, "object"));
  },

  "render": function render() {
    const {field, onChange} = this.props;
    const fieldName = field.get('name');
    const records = field.get('value');
    const collection = Immutable.fromJS({"records": null})
      .set("records", records.map((r, idx) => (r.set('idx', idx))).toJS());
    const moveUpAction = (event, item) => {
      const updatedRecords = records.remove(item.idx).insert(item.idx - 1, records.get(item.idx));
      onChange(createSyntheticEvent(fieldName, updatedRecords, null, "object"));
    };
    const moveDownAction = (event, item) => {
      const updatedRecords = records.remove(item.idx).insert(item.idx + 1, records.get(item.idx));
      onChange(createSyntheticEvent(fieldName, updatedRecords, null, "object"));
    };
    const deleteAction = (event, item) => {
      const updatedRecords = records.remove(item.idx);
      onChange(createSyntheticEvent(fieldName, updatedRecords, null, "object"));
    };

    const DnDRenderers = {
      "dragAndDropIcon": function dragAndDropIcon(){
      return (
      <div className="btn-group pull-left" role="group" aria-label="Move" >
        <span className="glyphicon mdi-drag" title="" data-toggle="tooltip"
              data-placement="top" data-original-title="Drag and Drop"/>
      </div>
      );
    } }

    const fieldRenderers = {
      "width": function width({item}) {
        return (
          <SelectBox
            id={item.idx + "-width"}
            name="width"
            value={item.width}
            label="Width"
            includeBlank={false}
            standalone={true}
            showLabel={false}
            hasFeedback={false}
            tableStyle={true}
            onChange={
              (event) => {
                onChange(createSyntheticEvent("_widthChange", getValue(event), null, null, null, item.idx));
              }
            }
            validation={{
              "inclusion": {
                "in": [25,50,75,100,125,150,175,200,225,250,275,300,325,350,375,400,425,450,475,500]
              }
            }}
          />
        );
      }
    }
    //
    //Table model
    let tableModel = [
      {
        "columnHeader": "",
        "column": "dragAndDropIcon",
        "renderer": DnDRenderers.dragAndDropIcon,
        "sortable": true,
        "classNameColumn": "tbl-xs-2-5p"
      },
      {
        "columnHeader": "Column",
        "column": "label",
        "renderer": dataTableDefaultRenderers.string,
        "sortable": true,
        "classNameColumn": "tbl-xs-20p "
      },
      {
        "columnHeader": "Description",
        "column": "description",
        "renderer": dataTableDefaultRenderers.string,
        "sortable": true,
        "classNameColumn": "hidden-xs tbl-sm-35p tbl-md-50"
      },
      {
        "columnHeader": "Width",
        "column": "width",
        "renderer": fieldRenderers.width,
        "sortable": true,
        "classNameColumn": "text-left tbl-xs-10p"
      },
      {
        "column": "actionButtonCell",
        "classNameColumn": "text-right tbl-xs-10p",
        "sortable": true,
        "actions": {
          "moveDown": moveDownAction,
          "moveUp": moveUpAction,
          "delete": deleteAction
        },
        "props": {
          "idFieldName": "field",
          "moveDownCheck": (item, rowIdx) => {
            return (rowIdx + 1) < records.size ? "" : "Cannot move row down";
          },
          "moveUpCheck": (item, rowIdx) => {
            return rowIdx === 0 ? "Cannot move row up" : "";
          }
        }
      }
    ];
    return (
      <div className="row"  ref={node => this.node = node}>
        <ViewTable
        title="Column configuration"
        tableModel={tableModel}
        collection={collection}
        cellAlign="top"
        />
      </div>
    );
  }
});

DataTableColumnConfig.displayName = "DataTableColumnConfig";
DataTableColumnConfig.propTypes = {
  onChange: PropTypes.func.isRequired,
  field: PropTypes.object.isRequired,
  className: PropTypes.string,
  colSpacingClassName: PropTypes.string,
  groupFieldName: PropTypes.string,
  labelFieldName: PropTypes.string,
  valueFieldName: PropTypes.string
};
DataTableColumnConfig.defaultProps = {
  className: "col-xs-12",
  groupFieldName: "groupName",
  labelFieldName: "label",
  valueFieldName: "id"
};

/**
 * @ignore
 */
module.exports = DataTableColumnConfig;
