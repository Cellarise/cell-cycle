import React from 'react';
import R from 'ramda';
import classnames from 'classnames';
import SelectBoxV2 from '../collection/selectBox.jsx';
import {getWorkgroupRecords, getAccountFlagRecords} from './accountUtils';


export function accountNameFormatter(account, showRCN, showRMID) {
  let name;
  if (R.isNil(account)) {
    return "";
  }
  if (!R.isNil(account.name)) {
    name = account.name;
  }
  if (showRCN === true && !R.isNil(account.RCN)) {
    name = name + " (" + account.RCN + ")";
  }
  if (showRMID === true && !R.isNil(account.RMID)) {
    name = name + " (" + account.RMID + ")";
  }
  return name;
}


export function flagMultiSelectSuggestionRenderer(suggestionObject) {
  return <span><span className={classnames("glyphicon mdi-1-5x", {
    "mdi-checkbox-marked-circle": suggestionObject.__selected,
    "mdi-checkbox-blank-circle-outline": !suggestionObject.__selected
  })}/>
    &nbsp;{flagSuggestionRenderer(suggestionObject)}
        </span>;
}
export function flagSuggestionRenderer(suggestionObject) {
  return <span>{renderFlag(suggestionObject.id)}&nbsp;{suggestionObject.name}</span>;
}

export function renderFlag(flagValue) {
  let iconClass;
  if (R.isNil(flagValue)) {
    iconClass = "mdi-flag-outline-variant";
  } else {
    iconClass = "mdi-flag-variant";
  }
  return <span style={{"color": flagValue}} className={"glyphicon " + iconClass}/>;
}

export function FlagField(props) {
  const {field, actions, databaseAccountCache, ...otherProps} = props;
  return (
    <SelectBoxV2
      {...otherProps}
      field={field}
      actions={actions}
      records={getAccountFlagRecords(
        field.getIn(['validation', 'inclusion', 'in']).toJS(),
        databaseAccountCache
      )}
      suggestionRenderer={flagSuggestionRenderer}
      autoFocus={false}
      data-auto-focus={false}
      includeBlank={false}
      setUnfocussedOnSelect={true}
    />
  );
}

export function WorkgroupField(props) {
  const {field, actions, databaseAccountCache, ...otherProps} = props;
  return (
    <SelectBoxV2
      {...otherProps}
      field={field}
      actions={actions}
      records={getWorkgroupRecords(databaseAccountCache)}
      autoFocus={false}
      data-auto-focus={false}
      includeBlank={false}
      setUnfocussedOnSelect={true}
    />
  );
}
