"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import TextBox from '../forms/textBox.jsx';
import Button from '../forms/button.jsx';


/**
 * Constructor
 * @param {object} props - component properties
 * @return {React.Element} react element
 */
function DataTableToolbar(props) {
  const {searchBar} = props;
  return (
    <div className="btn-toolbar" role="toolbar">
      <div className="btn-group pull-left" role="group" aria-label="Table filter">
        {searchBar}
      </div>
      <div className="btn-group pull-left" role="group" aria-label="Table filter">
        {renderSearchBar(props)}
      </div>
      {renderActionsBar(props)}
    </div>
  );
}


/**
 * Render search bar
 * @param {object} props - component properties
 * @param {function} onSearch - the onSearch event handler
 * @param {string} searchPlaceholder - the search bar placeholder
 * @param {string} name - the fieldname of the control
 * @return {React.Element} react element
 */
function renderSearchBar(props) {
  const {collection, onSearch, onCollectionRefresh, searchPlaceholder, onSearchLabel, searchBarClassName} = props;
  if (onSearch) {
    return (
      <TextBox key="onSearch"
               label={onSearchLabel}
               aria-label={onSearchLabel}
               name="searchTerm"
               value={collection.get('searchTerm')}
               placeholder={searchPlaceholder}
               inputWhiteList={"[^A-Za-z0-9@&\\s_.,\\(\\)\\-\\\"\\'\\/\\<\\>]+"}
               addonAfter={<Button
                name="onSearch"
                type="submit"
                title="Search"
                data-toggle-tooltip="tooltip"
                data-placement="right"
                onClick={onCollectionRefresh}
                className="btn-sm btn-primary btn-flat"
                label={<span className="glyphicon mdi-magnify mdi-lg"/>}
                aria-label={onSearchLabel}
               />}
               standalone={true}
               showLabel={false}
               hasFeedback={false}
               groupClassName={searchBarClassName}
               onChange={onSearch}
      />
    );
  }
}

/**
 * Render action buttons
 * @param {object} props - component properties
 * @return {React.Element} react element
 */
function renderActionsBar(props) {
  const {onCreateLabel, onUpdateLabel, onDeleteLabel} = props;
  let actions = [];
  if (props.actionBar) {
    return props.actionBar;
  }
  if (props.onCreate) {
    actions.push(
      <Button key="onCreate"
              name="onCreate"
              onClick={props.onCreate}
              className="btn-sm btn-primary hidden-xs"
              label={onCreateLabel}
      />
    );
    actions.push(
      <Button key="onCreateFloat"
              name="onCreateFloat"
              onClick={props.onCreate}
              title={onCreateLabel}
              data-toggle-tooltip="tooltip"
              data-placement="left"
              className="btn-sm btn-primary btn-floating-action hidden-sm hidden-md hidden-lg"
              label={<span className="glyphicon mdi-plus mdi-2x" />}
      />
    );
  }
  //@todo refactor into button generator for floating and non-floating update and delete actions
  if (props.onUpdate) {
    actions.push(
      <Button key="onUpdate"
              name="onUpdate"
              onClick={props.onUpdate}
              title={onUpdateLabel}
              data-toggle-tooltip="tooltip"
              data-placement="left"
              className="btn-sm btn-primary btn-floating-action"
              label={<span className="glyphicon mdi-pencil mdi-2x" />}
      />
    );
  }
  if (props.onDelete) {
    actions.push(
      <Button key="onDelete"
              name="onDelete"
              onClick={props.onDelete}
              title={onDeleteLabel}
              data-toggle-tooltip="tooltip"
              data-placement="left"
              className="btn-sm btn-primary btn-floating-action"
              label={<span className="glyphicon mdi-delete mdi-2x" />}
      />
    );
  }
  if (props.customAction) {
    actions.push(props.customAction);
  }
  return (
    <div key="tblActions" className="btn-group pull-right" role="group" aria-label="Table actions">
      {actions}
    </div>
  );
}


DataTableToolbar.displayName = "DataTableToolbar";
DataTableToolbar.propTypes = {
  "onCreate": PropTypes.func,
  "onUpdate": PropTypes.func,
  "onDelete": PropTypes.func,
  "onSearch": PropTypes.func,
  "searchPlaceholder": PropTypes.string,
  "searchBar": PropTypes.object,
  "searchBarClassName": PropTypes.string,
  "actionBar": PropTypes.object,
  "customAction": PropTypes.object,
  "showDisplayMode": PropTypes.bool,
  "onCreateLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "onDeleteLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "onViewLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "onCopyLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "onUpdateLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "onSearchLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ])
};
DataTableToolbar.defaultProps = {
  "searchBarClassName": "search-bar"
};

/**
 * @ignore
 */
module.exports = DataTableToolbar;
