import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class'
import classnames from 'classnames';
import SearchBox from './searchBox.jsx';
import {createSyntheticEvent, getValue} from '../utils/domDriverUtils';
import {eventHandler} from '../utils/viewUtils';


const defaultProps = {
  "boxType": "select",
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

function _renderValues(idFieldName, displayFieldName, value, records) {
  if (R.isNil(value) || value.length === 0) {
    return null;
  }
  return R.pipe(
    R.map((selectedId) => {
      const recordIndex = R.findIndex(R.propEq(idFieldName, selectedId), records);
      if (recordIndex > -1) {
        return records[recordIndex][displayFieldName];
      }
      return "-";
    }),
    R.join(",")
  )(value);
}

function updateValue(updatedId, currentValue) {
  const currentValueIndex = R.findIndex(R.equals(updatedId), R.defaultTo([], currentValue));
  if (currentValueIndex > -1) {
    return R.remove(currentValueIndex, 1, currentValue);
  } else {
    //not in list so append
    return R.append(updatedId, currentValue);
  }
}

function getSelectedRecordIdValues(idFieldName, displayFieldName, value, records) {
  const currentValue = R.defaultTo([], value);
  return R.pipe(
    R.filter((record) => (R.findIndex(R.equals(record[idFieldName]), currentValue) > -1)),
    R.map(R.pick([idFieldName, displayFieldName]))
  )(R.defaultTo([], records));
}

function mapSelectedPropMultiSelect(idFieldName, value, records, disabledRecords) {
  const currentValue = R.defaultTo([], value);
  return R.map(
    (record) => {
      record.__selected = R.findIndex(R.equals(record[idFieldName]), currentValue) > -1;
      record.__disabled = R.findIndex(R.equals(record[idFieldName]), disabledRecords) > -1;
      return record;
    },
    R.defaultTo([], records)
  );
}

function mapSelectedPropSingleSelect(idFieldName, value, records) {
  return R.map(
    (record) => {
      record.__selected = record[idFieldName] === value;
      return record;
    },
    R.defaultTo([], records)
  );
}

module.exports = createReactClass({
  "displayName": "collection/selectBox",
  "propTypes": {
    //data field properties and events
    "boxType": PropTypes.string,
    "field": PropTypes.object.isRequired,
    "actions": PropTypes.object,
    "disabled": PropTypes.bool,
    "readOnly": PropTypes.bool,
    "hide": PropTypes.bool,
    "showError": PropTypes.bool,
    //foreign key relation field containing pre-looked up value of relationship
    "records": PropTypes.array.isRequired,
    "autoAddNewRecord": PropTypes.bool,
    "showAsDropdown": PropTypes.bool
  },
  "getDefaultProps": function getDefaultProps() {
    return {
      autoAddNewRecord: false,
      showAsDropdown: true
    };
  },
  "shouldComponentUpdate": function shouldComponentUpdate(nextProps) {
    const props = this.props;
    return props.value !== nextProps.value
      || !R.equals(props.records, nextProps.records)
      || props.field !== nextProps.field
      || props.disabled !== nextProps.disabled;
  },
  "componentDidUpdate": function componentDidUpdate(prevProps) {
    const props = this.props;
    if (props.autoAddNewRecord === true
      && (props.boxType === "multiSelect" || props.boxType === "singleSelect")
      && props.records.length > prevProps.records.length
      && props.records.length > 0) {
      const idValue = props.records[props.records.length - 1][props.idFieldName];
      const name = props.field.get('name');
      const value = props.field.get('value');
      const storeId = props.field.get('storeId');
      eventHandler(props.actions, storeId, 'onMultipleActions', createSyntheticEvent("onMultipleActions", [
        {
          "id": R.defaultTo("onChange", props.onChangeId),
          "storeId": storeId,
          "event": createSyntheticEvent(name, updateValue(idValue, value, props.records), props.embeddedPath)
        },
        {
          "id": R.defaultTo("onChangeTemp", props.onChangeTempId),
          "storeId": storeId,
          "event": createSyntheticEvent(name, "", props.embeddedPath)
        }
      ]));
    }
  },
  "render": function _render() {
    const props = this.props;
    const {field} = props;
    const mergedProps = R.mergeAll([defaultProps, field ? field.toJS() : {}, props]);
    const {
      actions, storeId, name, embeddedPath, value, tempValue, idFieldName, displayFieldName, loading,
      addonBefore, boxType, onChangeId, onChangeTempId, onBlurId, onChange, onBlur, onSearch, onSuggestionSelected,
      selectSuggestionOnFocus, validation,
      showAsDropdown, suggestionRenderer, renderValues,
      ...inputProps
    } = mergedProps;
    let {records, disabledRecords} = mergedProps;
    disabledRecords = R.defaultTo([], disabledRecords);

    //check for multiInclusion validation
    const isMultiInclusion = validation && validation.multiInclusion && validation.multiInclusion.in;
    if (isMultiInclusion) {
      records = R.map(
        (option) => ({"id": option, "name": option}),
        validation.multiInclusion.in
      );
    }

    //@todo remove onMultipleActions in favour of actions array sent to primary action
    const onSuggestionValue = (suggestionObject) => {
      if (renderValues) {
        return renderValues(value, records);
      } else if (boxType === "multiSelect") {
        return _renderValues(idFieldName, displayFieldName, value, records);
      } else {
        return suggestionObject[displayFieldName];
      }
    };
    const _suggestionRenderer = (suggestionObject) => {
      if (suggestionRenderer) {
        return suggestionRenderer(suggestionObject);
      }
      if (boxType === "multiSelect") {
        return <span><span className={classnames("glyphicon mdi-1-5x", {
          "mdi-checkbox-marked": suggestionObject.__selected,
          "mdi-checkbox-blank-outline": !suggestionObject.__selected
        })}/>
          &nbsp;{suggestionObject[displayFieldName]}
        </span>;
      } else {
        return suggestionObject[displayFieldName];
      }
    };
    const _onSuggestionSelected = (suggestionObject) => {
      let idValue = suggestionObject[idFieldName];
      let selectedValue = suggestionObject[displayFieldName];
      if (suggestionObject.__disabled) {
        return;
      }
      if (boxType === "multiSelect") {
        idValue = updateValue(suggestionObject[idFieldName], value, records);
        selectedValue = getSelectedRecordIdValues(idFieldName, displayFieldName, idValue, records);
      }

      if (boxType === "singleSelect") {
        idValue = [idValue];
        selectedValue = [selectedValue];
      }
      if (!R.isNil(onSuggestionSelected)) {
        onSuggestionSelected(createSyntheticEvent(name, idValue, embeddedPath, "text", selectedValue));
      } else if (!R.isNil(onChange)) {
        onChange(createSyntheticEvent(name, idValue, embeddedPath, "text", selectedValue));
      } else {
        eventHandler(actions, storeId, 'onMultipleActions', createSyntheticEvent("onMultipleActions", [
          {
            "id": R.defaultTo("onChange", onChangeId),
            "storeId": storeId,
            "event": createSyntheticEvent(name, idValue, embeddedPath)
          },
          {
            "id": R.defaultTo("onChangeTemp", onChangeTempId),
            "storeId": storeId,
            "event": createSyntheticEvent(name, "", embeddedPath)
          }
        ]));
      }
    };
    const _onChange = (event) => {
      const currentValue = getValue(event) || "";
      if (currentValue === null || currentValue === "") {
        if (!R.isNil(onChange)) {
          onChange(createSyntheticEvent(name, null, embeddedPath));
        } else {
          eventHandler(actions, storeId, 'onMultipleActions', createSyntheticEvent("onMultipleActions", [
            {
              "id": R.defaultTo("onChange", onChangeId),
              "storeId": storeId,
              "event": createSyntheticEvent(name, null, embeddedPath)
            },
            {
              "id": R.defaultTo("onChangeTemp", onChangeTempId),
              "storeId": storeId,
              "event": createSyntheticEvent(name, "", embeddedPath)
            }
          ]));
        }
      } else {
        if (R.isNil(onChange)) {
          eventHandler(
            actions,
            storeId,
            R.defaultTo("onChangeTemp", onChangeTempId), createSyntheticEvent(name, currentValue, embeddedPath)
          );
        }
      }
    };
    const _onBlur = () => {
      if (!R.isNil(onBlur)) {
        onBlur(createSyntheticEvent(name, "", embeddedPath));
      } else {
        eventHandler(actions, storeId, 'onMultipleActions', createSyntheticEvent("onMultipleActions", [
          {
            "id": R.defaultTo("onBlur", onBlurId),
            "storeId": storeId,
            "event": createSyntheticEvent(name, "", embeddedPath)
          },
          {
            "id": R.defaultTo("onChangeTemp", onChangeTempId),
            "storeId": storeId,
            "event": createSyntheticEvent(name, "", embeddedPath)
          }
        ]));
      }
    };


    let searchValueIndex = -1, searchValue = null, unfocussedValue = "";
    if (renderValues) {
      searchValue = renderValues(value, records);
      unfocussedValue = searchValue;
    } else if (boxType === "multiSelect" || boxType === "singleSelect") {
      //find value in results
      if (!R.isNil(value) && !R.isNil(records)) {
        searchValue = _renderValues(idFieldName, displayFieldName, value, records);
        unfocussedValue = searchValue;
      }
      //Use the tempValue to populate the value of the search box otherwise if empty then use value
      // if (!R.isNil(tempValue) && !R.isNil(records)) {
      //   searchValue = renderValues(idFieldName, displayFieldName, tempValue, records);
      //   unfocussedValue = searchValue;
      // }
    } else {
      //find value in results
      if (!R.isNil(value) && !R.isNil(records)) {
        searchValueIndex = R.findIndex(R.propEq(idFieldName, value), records);
        if (searchValueIndex > -1) {
          searchValue = records[searchValueIndex][displayFieldName];
          unfocussedValue = searchValue;
        }
      }
      //Use the tempValue to populate the value of the search box otherwise if empty then use value
      if (!R.isNil(tempValue) && !R.isNil(records)) {
        searchValueIndex = R.findIndex(R.propEq(idFieldName, tempValue), records);
        if (searchValueIndex > -1) {
          searchValue = records[searchValueIndex][displayFieldName];
          unfocussedValue = searchValue;
        }
      }
    }


    return (
      <div>
        <SearchBox
          {...inputProps}
          resetSuggestionStateOnSelect={false}
          onRenderResetJustClickedOnSuggestion={boxType === "multiSelect" || boxType === "singleSelect"}
          showDropdownButton={true}
          selectSuggestionOnFocus={selectSuggestionOnFocus}
          showAsDropdown={showAsDropdown}
          scrollBar={true}
          loading={loading}
          records={boxType === "multiSelect" || boxType === "singleSelect"
            ? mapSelectedPropMultiSelect(idFieldName, value, records, disabledRecords)
            : mapSelectedPropSingleSelect(idFieldName, value, records)
          }
          id={"selectBoxV2" + name}
          name={name}
          embeddedPath={embeddedPath}
          value={searchValue}
          unfocussedValue={unfocussedValue}
          selectTextOnFocus={true}
          triggerSearchOnFocus={true}
          onChange={_onChange}
          onBlur={_onBlur}
          onSearch={onSearch}
          suggestionValue={onSuggestionValue}
          suggestionRenderer={_suggestionRenderer}
          onSuggestionSelected={_onSuggestionSelected}
          addonBefore={addonBefore}
        />
      </div>
    );
  }
});
