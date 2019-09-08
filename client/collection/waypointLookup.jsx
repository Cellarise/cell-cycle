"use strict";
import React from "react"; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types';
import ModelSubscriptionV2 from '../common/modelSubscriptionV2.jsx';
import LookupBox from './lookupBox.jsx';


function WaypointLookup(props) {
  const waypointService = {
    "name": "lookupService",
    "path": [
      "stores",
      "waypointServiceUI"
    ],
    "changePath": [
      "stores",
      "waypointServiceUI",
      "search"
    ]
  };
  return (
    <ModelSubscriptionV2
      displayName="collection/waypointLookup/lookupBox"
      modelSubscriptions={[waypointService]}>
      <LookupBox {...props}/>
    </ModelSubscriptionV2>
  );
}

WaypointLookup.displayName = "collection/waypointLookup";
WaypointLookup.propTypes = {
  // If true, the onChangeId handler receives the entire suggestionObject; if false, only the address is received
  'passSuggestionObject': PropTypes.bool
};
WaypointLookup.defaultProps = {
  'passSuggestionObject': false
};

/**
 * @ignore
 */
module.exports = WaypointLookup;
