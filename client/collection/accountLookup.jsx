"use strict";
import React from 'react'; //eslint-disable-line  no-unused-vars
import PropTypes from 'prop-types';
import PrimaryKeyLookup from './primaryKeyLookup.jsx';


function AccountLookup({accountUI, actions, showDropdown}) {
  return (
    <PrimaryKeyLookup
      lookupStore={accountUI}
      actions={actions}
      id="accountAutoComplete"
      label="Account lookup by name"
      placeholder=""
      displayFieldName="name"
      selectTextOnFocus={true}
      showDropdown={showDropdown}
      inputWhiteList={"[^A-Za-z0-9&\\s_.,\\(\\)\\-\\\"\\'\\/\\<\\>]+"}
    />
  );
}

AccountLookup.displayName = "AccountLookup";
AccountLookup.propTypes = {
  "accountUI": PropTypes.object.isRequired,
  "actions": PropTypes.object.isRequired,
  "showDropdown": PropTypes.bool
};
AccountLookup.defaultProps = {
  "showDropdown": false
};
/**
 * @ignore
 */
module.exports = AccountLookup;
