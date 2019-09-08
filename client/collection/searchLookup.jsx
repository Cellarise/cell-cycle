"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import SearchBox from './searchBox.jsx';
import {createSyntheticEvent, getValue} from '../utils/domDriverUtils';
import {getEventHandler, eventHandler} from '../utils/viewUtils';

/**
 * SearchLookup component
 * @param {Object} props - component properties
 * @return {React.Element} react element
 */
function SearchLookup(props) {
  const defaultProps = {
    "showError": false,
    "labelPos": "none",
    "helpPos": "none",
    "disabled": false,
    "readOnly": false,
    "hide": false,
    "idFieldName": "id",
    "displayFieldName": "name",
    "addonBefore": null
  };
  const {field, actions, lookupStoreSearch, onSearch, onSuggestionSelected, ...otherProps} = props;
  const mergedProps = R.mergeAll([defaultProps, field ? field.toJS() : {}, otherProps]);
  const {
    id, value, name, embeddedPath, idFieldName, displayFieldName, validation, placeholder, ...searchBoxProps
  } = mergedProps;
  const storeId = field.get('storeId');
  const storeIdLookupStore = lookupStoreSearch.get('name');
  const {term, records, loading} = lookupStoreSearch.get('search').toJS();
  const onSearchPropChange = getEventHandler(actions, lookupStoreSearch, 'onSearchPropChange');

  const _onSuggestionValue = (suggestionObject) => (suggestionObject[displayFieldName]);
  const _onSuggestionSelected = (suggestionObject) => (onSuggestionSelected
    ? onSuggestionSelected(suggestionObject, idFieldName)
    : eventHandler(actions, lookupStoreSearch, 'onMultipleActions', createSyntheticEvent("onMultipleActions", [
    {
      "id": "onChange",
      "storeId": storeId,
      "event": createSyntheticEvent(name, suggestionObject[idFieldName], embeddedPath)
    },
    {
      "id": "onSearchPropChange",
      "storeId": storeIdLookupStore,
      "event": createSyntheticEvent("term", "", null, "reset")
    }
  ])));
  const _onReset = () => {
    eventHandler(actions, lookupStoreSearch, 'onMultipleActions', createSyntheticEvent("onMultipleActions", [
      {
        "id": "onChange",
        "storeId": storeId,
        "event": createSyntheticEvent(name, null, embeddedPath)
      },
      {
        "id": "onSearchPropChange",
        "storeId": storeIdLookupStore,
        "event": createSyntheticEvent("term", "", null, "reset")
      }
    ]));
  };
  const _onSearch = (event) => (onSearch
      ? onSearch(event)
      : onSearchPropChange(createSyntheticEvent("term", getValue(event) || ""))
  );
  const _onBlur = () => (
    eventHandler(actions, lookupStoreSearch, 'onMultipleActions', createSyntheticEvent("onMultipleActions", [
      {
        "id": "onBlur",
        "storeId": storeId,
        "event": createSyntheticEvent(name, "", embeddedPath)
      },
      {
        "id": "onSearchPropChange",
        "storeId": storeIdLookupStore,
        "event": createSyntheticEvent("term", "", null, "reset")
      }
    ]))
  );

  const searchValue = (term === "") ? value : term;

  return (
    <div>
      <SearchBox
        {...searchBoxProps}
        unfocussedValue={R.defaultTo("", value)}
        key="searchbox"
        loading={loading}
        records={records}
        id={"searchLookup" + name + id}
        value={searchValue}
        placeholder={placeholder}
        validation={validation}
        onChange={_onSearch}
        onBlur={_onBlur}
        suggestionValue={_onSuggestionValue}
        suggestionRenderer={_onSuggestionValue}
        onSuggestionSelected={_onSuggestionSelected}
        onReset={_onReset}
      />
    </div>
  );
}
SearchLookup.displayName = "SearchLookup";
SearchLookup.propTypes = {
  //data field properties and events
  "field": PropTypes.object.isRequired,
  "actions": PropTypes.object.isRequired,
  "disabled": PropTypes.bool,
  "readOnly": PropTypes.bool,
  "hide": PropTypes.bool,
  "showError": PropTypes.bool,
  "addonBefore": PropTypes.object,
  //search properties and events
  "lookupStoreSearch": PropTypes.object.isRequired,
  "onSearch": PropTypes.func,
  "onSuggestionSelected": PropTypes.func,
  //other
  "idFieldName": PropTypes.string,
  "displayFieldName": PropTypes.string,
  "placeholder": PropTypes.string
};

/**
 * @ignore
 */
module.exports = SearchLookup;
