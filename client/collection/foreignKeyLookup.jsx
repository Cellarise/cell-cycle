import R from 'ramda';
import React from 'react';
import createReactClass from 'create-react-class'
import PropTypes from 'prop-types';
import SearchBox from './searchBox.jsx';
import {createSyntheticEvent, getValue} from '../utils/domDriverUtils';
import {getEventHandler, eventHandler} from '../utils/viewUtils';


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

module.exports = createReactClass({
  "displayName": "collection/foreignKeyLookup",
  "propTypes": {
    //data field properties and events
    "field": PropTypes.object.isRequired,
    "actions": PropTypes.object,
    "disabled": PropTypes.bool,
    "readOnly": PropTypes.bool,
    "hide": PropTypes.bool,
    "showError": PropTypes.bool,
    //foreign key relation field containing pre-looked up value of relationship
    "foreignKeyRelation": PropTypes.object,
    //search properties and events
    "lookupStoreSearch": PropTypes.object.isRequired,
    //other
    "idFieldName": PropTypes.string,
    "displayFieldNamePrefix": PropTypes.string,
    "displayFieldName": PropTypes.string,
    "codeFieldName": PropTypes.string,
    "placeholder": PropTypes.string,
    "addonBefore": PropTypes.object,
    "onChangeId": PropTypes.string,
    "onBlurId": PropTypes.string,
    "onSuggestionSelectedCallback": PropTypes.func
  },
  "shouldComponentUpdate": function shouldComponentUpdate(nextProps) {
    const props = this.props;
    return props.field !== nextProps.field
      || props.readOnly !== nextProps.readOnly
      || props.disabled !== nextProps.disabled
      || props.foreignKeyRelation !== nextProps.foreignKeyRelation
      || props.lookupStoreSearch !== nextProps.lookupStoreSearch;
  },
  "render": function _render() {
    const props = this.props;
    const {field} = props;
    const mergedProps = R.mergeAll([defaultProps, field ? field.toJS() : {}, props]);
    const {
      actions, foreignKeyRelation, onChange, onBlur, storeId, name, embeddedPath, value, foreignValue, tempValue,
      idFieldName, displayFieldNamePrefix, displayFieldName, codeFieldName, accountType, accountId, modelId,
      addonBefore, lookupStoreSearch, onChangeId, onBlurId, onSuggestionSelectedCallback, id, ...inputProps
    } = mergedProps;
    const dataRecordIdx = inputProps["data-record-idx"];
    const storeIdLookupStore = lookupStoreSearch.get('name');
    const {term, records, loading} = lookupStoreSearch.get('search').toJS();
    const onSearchPropChange = getEventHandler(actions, lookupStoreSearch, 'onSearchPropChange');
    let foreignKeyRelationJS;

    if (!R.isNil(foreignKeyRelation)) {
      foreignKeyRelationJS = mergedProps.foreignKeyRelation.toJS();
    }

    //@todo remove onMultipleActions in favour of actions array sent to primary action
    const onSuggestionValue = (suggestionObject) => (
      renderDisplayName(
        displayFieldNamePrefix, displayFieldName, codeFieldName, suggestionObject
      )
    );
    const onSuggestionSelected = (suggestionObject) => {
      if (!R.isNil(foreignKeyRelation)) {
        eventHandler(actions, lookupStoreSearch, 'onMultipleActions', createSyntheticEvent("onMultipleActions", [
          {
            "id": R.defaultTo("onChange", onChangeId),
            "storeId": storeId,
            "event": createSyntheticEvent(
              foreignKeyRelationJS.name,
              suggestionObject,
              R.defaultTo(embeddedPath, foreignKeyRelationJS.embeddedPath),
              "JSON", null, dataRecordIdx
            )
          },
          {
            "id": R.defaultTo("onChange", onChangeId),
            "storeId": storeId,
            "event": createSyntheticEvent(name, suggestionObject[idFieldName], embeddedPath, null, null, dataRecordIdx)
          },
          {
            "id": "onSearchPropChange",
            "storeId": storeIdLookupStore,
            "event": createSyntheticEvent("term", "", null, "reset", null, dataRecordIdx)
          }
        ]));
      }
      if (!R.isNil(onChange)) {
        onChange(createSyntheticEvent(name, suggestionObject, embeddedPath, "JSON", null, dataRecordIdx));
      }
      if (onSuggestionSelectedCallback) {
        onSuggestionSelectedCallback(suggestionObject);
      }
    };
    const _onSearch = (event) => {
      const currentValue = getValue(event) || "";
      if (currentValue === null || currentValue === "") {
        if (!R.isNil(foreignKeyRelation)) {
          eventHandler(actions, lookupStoreSearch, 'onMultipleActions', createSyntheticEvent("onMultipleActions", [
            {
              "id": R.defaultTo("onChange", onChangeId),
              "storeId": storeId,
              "event": createSyntheticEvent(foreignKeyRelationJS.name, null, embeddedPath, null, null, dataRecordIdx)
            },
            {
              "id": R.defaultTo("onChange", onChangeId),
              "storeId": storeId,
              "event": createSyntheticEvent(name, null, embeddedPath, null, null, dataRecordIdx)
            },
            {
              "id": "onSearchPropChange",
              "storeId": storeIdLookupStore,
              "event": createSyntheticEvent("term", "", null, null, {
                "accountType": accountType,
                "accountId": accountId,
                "modelId": modelId
              })
            }
          ]));
        } else {
          onSearchPropChange(createSyntheticEvent("term", "", null, null, {
            "accountType": accountType,
            "accountId": accountId,
            "modelId": modelId
          }));
        }
      } else {
        onSearchPropChange(createSyntheticEvent("term", currentValue, null, null, {
          "accountType": accountType,
          "accountId": accountId,
          "modelId": modelId
        }));
      }
    };
    const _onBlur = () => {
      if (!R.isNil(foreignKeyRelation)) {
        eventHandler(actions, lookupStoreSearch, 'onMultipleActions', createSyntheticEvent("onMultipleActions", [
          {
            "id": R.defaultTo("onBlur", onBlurId),
            "storeId": storeId,
            "event": createSyntheticEvent(name, "", embeddedPath, null, null, dataRecordIdx)
          },
          {
            "id": "onSearchPropChange",
            "storeId": storeIdLookupStore,
            "event": createSyntheticEvent("term", "", null, "reset", null, dataRecordIdx, {
              "accountType": accountType,
              "accountId": accountId,
              "modelId": modelId
            })
          }
        ]));
      }
      // else {
      //   eventHandler(actions, lookupStoreSearch, 'onMultipleActions', createSyntheticEvent("onMultipleActions", [
      //     {
      //       "id": "onSearchPropChange",
      //       "storeId": storeIdLookupStore,
      //       "event": createSyntheticEvent("term", "", null, "reset", null, dataRecordIdx)
      //     }
      //   ]));
      // }
      if (!R.isNil(onBlur)) {
        onBlur(createSyntheticEvent(name, "", embeddedPath, null, null, dataRecordIdx));
      }
    };


    let searchValue = term, unfocussedValue = "";
    //Use the foreignKeyRelationJS to populate the value of the search box otherwise if term empty then use value
    if (foreignKeyRelationJS && foreignKeyRelationJS.tempValue &&
      foreignKeyRelationJS.tempValue[idFieldName] && foreignKeyRelationJS.tempValue[idFieldName] === tempValue) {
      searchValue = renderDisplayName(
        displayFieldNamePrefix, displayFieldName, codeFieldName, foreignKeyRelationJS.tempValue
      );
      unfocussedValue = renderDisplayName(
        displayFieldNamePrefix, displayFieldName, codeFieldName, foreignKeyRelationJS.tempValue
      );
    } else if (foreignKeyRelationJS && foreignKeyRelationJS.value
      && foreignKeyRelationJS.value[idFieldName] === value) {
      searchValue = renderDisplayName(
        displayFieldNamePrefix, displayFieldName, codeFieldName, foreignKeyRelationJS.value
      );
      unfocussedValue = renderDisplayName(
        displayFieldNamePrefix, displayFieldName, codeFieldName, foreignKeyRelationJS.value
      );
    } else if (foreignValue && foreignValue[idFieldName] === value) {
      searchValue = renderDisplayName(
        displayFieldNamePrefix, displayFieldName, codeFieldName, foreignValue
      );
      unfocussedValue = renderDisplayName(
        displayFieldNamePrefix, displayFieldName, codeFieldName, foreignValue
      );
    }


    return (
      <div>
        <SearchBox
          {...inputProps}
          showDropdownButton={true}
          loading={loading}
          records={records}
          id={"foreignKey" + name + R.defaultTo("", id)}
          name={name}
          embeddedPath={embeddedPath}
          value={searchValue}
          unfocussedValue={unfocussedValue}
          selectTextOnFocus={true}
          triggerSearchOnFocus={true}
          onChange={_onSearch}
          onBlur={_onBlur}
          suggestionValue={onSuggestionValue}
          suggestionRenderer={onSuggestionValue}
          onSuggestionSelected={onSuggestionSelected}
          addonBefore={addonBefore}
        />
      </div>
    );
  }
});

function renderDisplayName(displayFieldNamePrefix, displayFieldName, codeFieldName, suggestionObject) {
  if (R.isNil(displayFieldNamePrefix)) {
    return R.defaultTo("", suggestionObject[displayFieldName]) + renderCode(codeFieldName, suggestionObject);
  }
  return (R.isNil(suggestionObject[displayFieldNamePrefix]) ? "" : suggestionObject[displayFieldNamePrefix] + " ") +
    R.defaultTo("", suggestionObject[displayFieldName]) +
    renderCode(codeFieldName, suggestionObject);
}

function renderCode(codeFieldName, suggestionObject) {
  let value;
  if (R.isNil(codeFieldName)) {
    return "";
  }
  value = suggestionObject[codeFieldName];
  if (R.isNil(value)) {
    return "";
  }
  return " (" + value + ")";
}
