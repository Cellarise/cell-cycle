"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class'
import R from 'ramda';
import SearchBox from './searchBox.jsx';
import DropdownBox from './dropdownBox.jsx';
import {createSyntheticEvent, getValue} from '../utils/domDriverUtils';
import {getActiveRecord, getEventHandler, eventHandler} from '../utils/viewUtils';
import * as routerLibrary from '../libraries/router';


module.exports = createReactClass({
  "displayName": "collection/primaryKeyLookup",
  "propTypes": {
    "lookupStore": PropTypes.object.isRequired,
    "actions": PropTypes.object.isRequired,
    "id": PropTypes.string.isRequired,
    "label": PropTypes.string.isRequired,
    "placeholder": PropTypes.string.isRequired,
    "itemContent": PropTypes.func,
    "showResults": PropTypes.bool,
    "showDropdown": PropTypes.bool,
    "hasFeedback": PropTypes.bool,
    "inputWhiteList": PropTypes.string
  },
  "getDefaultProps": function getDefaultProps() {
    return {
      "showDropdown": false,
      "hasFeedback": true
    };
  },
  "shouldComponentUpdate": function shouldComponentUpdate(nextProps) {
    const props = this.props;
    return props.lookupStore !== nextProps.lookupStore;
  },
  "render": function _render() {
    const props = this.props;
    const mergedProps = R.merge(props.lookupStore.get('search').toJS(), props);
    const {
      actions, lookupStore, id, label, displayFieldName, placeholder, loading, hasFeedback,
      records, inputWhiteList, itemContent, showDropdown, term
    } = mergedProps;

    //use the lookupStore
    const storeId = lookupStore.get('name');
    const idField = lookupStore.getIn(['relations', 'idField']);
    const selectedRecord = getActiveRecord(lookupStore);
    const onSearchPropChange = getEventHandler(actions, lookupStore, 'onSearchPropChange');

    const suggestionValue = (suggestionObject) => (itemContent
      ? itemContent(suggestionObject)
      : suggestionObject[displayFieldName]);

    const suggestionRenderer = (suggestionObject) => (
      <a href={routerLibrary.createALink(idField + "=" + suggestionObject.id, {"cache": true})}>
        {suggestionValue(suggestionObject)}
      </a>
    );

    const onSuggestionSelected = (suggestionObject) => {
      onSearchPropChange(createSyntheticEvent("term", suggestionObject[displayFieldName], null, "reset"));
      routerLibrary.linkSelect.call(routerLibrary,
        null, routerLibrary.createALink(idField + "=" + suggestionObject.id, {"cache": true}));
    };

    const _onSearch = (event) => {
      const currentValue = getValue(event) || "";
      if (currentValue === null || currentValue === "") {
        eventHandler(actions, lookupStore, 'onMultipleActions', createSyntheticEvent("onMultipleActions", [
          {
            "id": "onResetRecordsAndProps",
            "storeId": storeId,
            "event": createSyntheticEvent("term", "")
          },
          {
            "id": "onSearchPropChange",
            "storeId": storeId,
            "event": createSyntheticEvent("term", "")
          }
        ]));
      } else {
        onSearchPropChange(createSyntheticEvent("term", currentValue));
      }
    };
    const _onBlur = () => (onSearchPropChange(createSyntheticEvent("term", "", null, "reset")));


    if (!showDropdown) {
      return (
        <div>
          <SearchBox
            showDropdownButton={true}
            id={"primaryKey" + id}
            label={label}
            name="term"
            value={term}
            unfocussedValue={selectedRecord ? selectedRecord.getIn([displayFieldName, 'value']) : term}
            inputWhiteList={inputWhiteList}
            placeholder={placeholder}
            loading={loading}
            showValidating={loading}
            records={records}
            selectTextOnFocus={true}
            triggerSearchOnFocus={true}
            standalone={false}
            showLabel={true}
            hasFeedback={hasFeedback}
            tableStyle={false}
            suggestionValue={suggestionValue}
            suggestionRenderer={suggestionRenderer}
            onSuggestionSelected={onSuggestionSelected}
            onChange={_onSearch}
            onBlur={_onBlur}
          />
        </div>
      );
    }

    return (
      <DropdownBox
        {...mergedProps}
        idField={idField}
        onSearch={
          (event) => {
            eventHandler(actions, lookupStore, "onSearchPropChange",
              createSyntheticEvent("term", getValue(event), null, "preventDefault"));
          }
        }
        name="term"
        className="btn-sm"
        value={term}
      />
    );
  }
});
