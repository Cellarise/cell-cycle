"use strict";
import React from "react"; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types';
import R from 'ramda';
import {createSyntheticEvent, getValue} from '../utils/domDriverUtils';
import SearchLookup from './searchLookup';
import {eventHandler} from '../utils/viewUtils';


function LookupBox(props) {
  const {id, name, field, actions, lookupService, onChangeId, passSuggestionObject, placeholder,
    embeddedPath, standalone, showLabel, hasFeedback, tableStyle, className} = props;
  const onSuggestionSelected = (suggestionObject) => {
    const onSuggestionSelectedActions = [
      {
        "id": R.defaultTo("onChange", onChangeId),
        "storeId": field.get('storeId'),
        "name": R.defaultTo(field.get('name'), name),
        "value": passSuggestionObject ? suggestionObject : suggestionObject.ADDRESS,
        "embeddedPath": R.defaultTo(field.get('embeddedPath'), embeddedPath),
        "data-record-idx": R.defaultTo(field.get('data-record-idx'), props['data-record-idx'])
      }
    ];
    eventHandler(
      actions,
      lookupService,
      'onSearchPropChange',
      createSyntheticEvent("term", "", null, "reset", {"actions": onSuggestionSelectedActions})
    );
  };
  const onSearch = (event) => {
    const onSearchActions = [
      {
        "id": R.defaultTo("onChange", onChangeId),
        "storeId": field.get('storeId'),
        "name": R.defaultTo(field.get('name'), name),
        "value": R.defaultTo("", getValue(event)),
        "embeddedPath": R.defaultTo(field.get('embeddedPath'), embeddedPath),
        "data-record-idx": R.defaultTo(field.get('data-record-idx'), props['data-record-idx'])
      }
    ];
    eventHandler(
      actions,
      lookupService,
      'onSearchPropChange',
      createSyntheticEvent("term", R.defaultTo("", getValue(event)), null, "string", {"actions": onSearchActions})
    );
  };
  return (<SearchLookup
    lookupStoreSearch={lookupService}
    onSuggestionSelected={onSuggestionSelected}
    onSearch={onSearch}
    field={field}
    actions={actions}
    id={id}
    name={R.defaultTo(field.get('name'), name)}
    placeholder={placeholder}
    embeddedPath={embeddedPath}
    standalone={standalone}
    showLabel={showLabel}
    hasFeedback={hasFeedback}
    tableStyle={tableStyle}
    data-record-idx={props['data-record-idx']}
    className={className}
  />);
}

LookupBox.displayName = "collection/lookupBox";
LookupBox.propTypes = {
  'id': PropTypes.string,
  'name': PropTypes.string,
  'field': PropTypes.object,
  'actions': PropTypes.object,
  'lookupService': PropTypes.object,
  'onChangeId': PropTypes.string,
  'passSuggestionObject': PropTypes.bool,
  'placeholder': PropTypes.string
};

/**
 * @ignore
 */
module.exports = LookupBox;
