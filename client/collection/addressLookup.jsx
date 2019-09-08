"use strict";
import React from "react"; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types';
import ModelSubscriptionV2 from '../common/modelSubscriptionV2.jsx';
import LookupBox from './lookupBox.jsx';


function AddressLookup(props) {
  const addressService = {
    "name": "lookupService",
    "path": [
      "stores",
      "addressServiceUI"
    ],
    "changePath": [
      "stores",
      "addressServiceUI",
      "search"
    ]
  };
  return (
    <ModelSubscriptionV2
      displayName="collection/addressLookup/lookupBox"
      modelSubscriptions={[addressService]}>
      <LookupBox {...props}/>
    </ModelSubscriptionV2>
  );
}

AddressLookup.displayName = "collection/addressLookup";
AddressLookup.propTypes = {
  // If true, the onChangeId handler receives the entire suggestionObject; if false, only the address is received
  'passSuggestionObject': PropTypes.bool
};
AddressLookup.defaultProps = {
  'passSuggestionObject': false
};

/**
 * @ignore
 */
module.exports = AddressLookup;
