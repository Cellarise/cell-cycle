"use strict";
import React from 'react';
import Button from '../forms/button.jsx';
import TextBox from '../forms/textBox.jsx';
import CheckBoxGroup from '../collection/checkBoxGroup.jsx';
import Card from '../page/card.jsx';
import DataTableColumnConfig from './dataTableColumnConfig.jsx';


/**
 * Constructor
 * @param {object} props - component properties
 * @return {React.Element} react element
 */
function DataTableFilterEditor(props) {
  const {collection, onCollectionPropChange, onCollectionFilterChange} = props;
  const createMode = collection.get('addFilterFlag');
  const updatedFilter = collection.getIn(['filterModel', '_updatedFilter']);
  let tabPanes = [];
  if (!createMode) {
    tabPanes.push(
      <div label="Column order" key="ColumnOrder">
        <DataTableColumnConfig
          field={updatedFilter}
          onChange={onCollectionFilterChange}
        />
      </div>
    );
  }
  tabPanes.push([
    <div label="Column selector" key="ColumnSelector">
      {!createMode ? null :
        <div className="row">
          <div className="col-xs-6">
            <TextBox
              label="Tab name"
              field={collection.getIn(['filterModel', '_filterName'])}
              onChange={onCollectionFilterChange}
              disabled={!createMode}
            />
          </div>
        </div>
      }
      <div className="row">
        <div className="col-xs-12">
          <Button
            name="selectOrDeselectAll"
            label={updatedFilter.get('records').size !== updatedFilter.get('value').size
              ? "Select all"
              : "Deselect all"}
            className={"btn-sm btn-primary pull-right"}
            onClick={onCollectionPropChange}
          />
        </div>
      </div>
      <div className="row">
        <CheckBoxGroup
          field={updatedFilter}
          onChange={onCollectionFilterChange}
          valueFieldName="field"
          helpFieldName="description"
        />
      </div>
    </div>
  ]);
  return (
    <div>
      <Card
        name="filterEditCard"
        header={createMode ? "Add tab" : "Edit tab"}
        classNameHeader="style-primary card-head-xs"
        classNameTabHead="card-head-sm"
        classNameBody="no-padding"
        form={true}
        tabbable={true}
        actionBar={
          <div className="card-actionbar">
            <div className="card-actionbar-row">
              <div className="col-xs-12">
                <Button
                  name="cancelFilterEdit"
                  label="Cancel"
                  className={"btn-sm btn-default"}
                  onClick={onCollectionPropChange}
                />
                <Button
                  name="applyFilterEdit"
                  label="Apply"
                  className={"btn-sm btn-primary"}
                  onClick={onCollectionPropChange}
                  disabled={collection.getIn(['filterModel', '_filterName', 'showError'])}
                />
              </div>
            </div>
          </div>
        }
      >
        {tabPanes}
      </Card>
      <hr className="table-filterbar-hr"/>
    </div>
  );
}


DataTableFilterEditor.displayName = "DataTableFilterEditor";
DataTableFilterEditor.propTypes = {};
DataTableFilterEditor.defaultProps = {};

/**
 * @ignore
 */
module.exports = DataTableFilterEditor;
