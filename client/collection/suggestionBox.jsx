"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import SearchBox from './searchBox.jsx';
import DropdownBox from './dropdownBox.jsx';
import {createSyntheticEvent} from '../utils/domDriverUtils';
import {getEventHandler, eventHandler} from '../utils/viewUtils';

/**
 * AutoComplete component
 * @param {Object} props - component properties
 * @param {String} props.id - component id
 * @param {String} props.label - button label
 * @param {String} props.placeholder - the place holder text
 * @param {String} [props.records] - search records
 * @param {Array} props.records - search loading indicator
 * @param {Function} props.onSearchPropChange - trigger search action
 * @param {Boolean} [props.showDropdown=false] - flag to show dropdown rather than searchbox
 * @return {React.Element} react element
 */
function SuggestionBox(props) {
  const {field, actions, showDropdown, records, ...otherProps} = props;
  const mergedProps = R.merge(field ? field.toJS() : {}, otherProps);
  const {value, name, embeddedPath, storeId} = mergedProps;
  const _value = R.is(Number, value) ? value : R.defaultTo("", value).toLowerCase();
  const suggestionValue = (_suggestionValue) => (_suggestionValue);
  const suggestionRenderer = (_suggestionValue) => (<span>{_suggestionValue}</span>);
  const onSuggestionSelected = (_suggestionValue) => {
    const syntheticEvent =
      createSyntheticEvent(name, _suggestionValue, embeddedPath, null, mergedProps["data-record-idx"]);
    if (mergedProps.onChange) {
      mergedProps.onChange(syntheticEvent);
    } else {
      eventHandler(actions, storeId, 'onChange', syntheticEvent);
    }
  };

  const _records = R.defaultTo(R.path(["validation", "suggestion", "in"], mergedProps), records);
  const filteredRecords = R.filter(
    (record) => {
      if (R.is(Number, record)) {
        return R.isNil(_value) || R.contains(R.defaultTo("", _value).toString(), R.defaultTo("", record).toString());
      } else {
        return R.isNil(_value) || R.defaultTo("", record).toLowerCase().indexOf(_value) > -1
      }
    }, _records
  );

  if (!showDropdown) {
    return (
      <div>
        <SearchBox
          {...mergedProps}
          records={filteredRecords}
          suggestionValue={suggestionValue}
          suggestionRenderer={suggestionRenderer}
          onSuggestionSelected={onSuggestionSelected}
          onReset={() => (eventHandler(actions, storeId, 'onChange', createSyntheticEvent(name, null, embeddedPath)))}
          addonBefore={mergedProps.tableStyle === true ? null : mergedProps.addonBefore}
          showApplyButton={mergedProps.tableStyle === true ? null : R.defaultTo(true, mergedProps.showApplyButton)}
          loading={false}
          idField={name}
          theme={{
            "root": 'react-autosuggest-static',
            "rootExpanded": 'react-autosuggest-static',
            "suggestions": mergedProps.tableStyle === true
              ? 'react-autosuggest-static__suggestions-0-top'
              : 'react-autosuggest-static__suggestions',
            "suggestion": 'react-autosuggest-static__suggestion',
            "suggestionIsFocused": 'react-autosuggest-static__suggestion--focused',
            "section": 'react-autosuggest-static__suggestions-section',
            "sectionName": 'react-autosuggest-static__suggestions-section-name',
            "sectionSuggestions": 'react-autosuggest-static__suggestions-section-suggestions'
          }}
        />
      </div>
    );
  }

  return (
    <DropdownBox
      {...props}
      onSearch={getEventHandler(actions, storeId, 'onChange')}
      className="btn-sm"
    />
  );
}
SuggestionBox.displayName = "SuggestionBox";
SuggestionBox.propTypes = {
  "id": PropTypes.string.isRequired,
  "label": PropTypes.string,
  "idField": PropTypes.string,
  "placeholder": PropTypes.string,
  "records": PropTypes.array,
  "showResults": PropTypes.bool,
  "showDropdown": PropTypes.bool
};
SuggestionBox.defaultProps = {
  "showDropdown": false
};
/**
 * @ignore
 */
module.exports = SuggestionBox;
