"use strict";
import React from 'react'; //eslint-disable-line  no-unused-vars
import PropTypes from 'prop-types';
import R from 'ramda';
import ForeignKeyLookup from './foreignKeyLookup.jsx';
import ModelSubscriptionV2 from '../common/modelSubscriptionV2.jsx';


/**
 * AccountLookupField component
 * @param {Object} props - component properties
 * @param {String} props.title - form title
 * @param {String} props.userIdField - parent user id field
 * @param {String} props.userRelationField - parent user foreign key relation field
 * @return {React.Element} react element
 */
function AccountLookupField(props) {
  const {accountType, LGA} = props;
  let foreignKeyStore;

  switch (accountType) {
    case 'partner':
    case 'partnerAccount':
      if (LGA === true) {
        foreignKeyStore = {
          "name": "foreignKeyStore",
          "path": [
            "stores",
            "partnerAccountUI-search-lga"
          ]
        };
      } else {
        foreignKeyStore = {
          "name": "foreignKeyStore",
          "path": [
            "stores",
            "partnerAccountUI-search"
          ]
        };
      }
      break;
    case 'operations':
    case 'operationsAccount':
      foreignKeyStore = {
        "name": "foreignKeyStore",
        "path": [
          "stores",
          "operationsAccountUI"
        ]
      };
      break;
    default:
      foreignKeyStore = {
        "name": "foreignKeyStore",
        "path": [
          "stores",
          "customerAccountUI"
        ]
      };
      break;
  }
  return (
    <div className="row">
      <div className="col-xs-12">
        <ModelSubscriptionV2
          modelSubscriptions={[foreignKeyStore]}
        >
          <AccountLookup
            {...props}
          />
        </ModelSubscriptionV2>
      </div>
    </div>
  );
}

function AccountLookup(props) {
  let {field, actions, onChange, onBlur, foreignKeyStore, relationField, readOnly, disabled, onChangeId, onBlurId,
    accountType, width, name, alwaysExpanded, filterArchived, filterState,
    includeBlank, standalone, showLabel, hasFeedback, tableStyle, embeddedPath, showAddonBefore, theme} = props;
  const origRecords = R.defaultTo([], foreignKeyStore.getIn(['search', 'records']));
  foreignKeyStore = foreignKeyStore.setIn(['search', 'records'], R.pipe(
    R.filter(
      (record) => {
        if (filterArchived === true && record.archived === true) {
          return false;
        }
        if (!R.isNil(filterState) && record.state !== filterState) {
          return false;
        }
        return true;
      }),
    R.take(10)
  )(origRecords));
  return (<ForeignKeyLookup
    id={props.id}
    width={width}
    field={field}
    name={R.defaultTo(field.get('name'), name)}
    alwaysExpanded={alwaysExpanded}
    onChangeId={onChangeId}
    onBlurId={onBlurId}
    actions={actions}
    onChange={onChange}
    onBlur={onBlur}
    foreignKeyRelation={relationField}
    lookupStoreSearch={foreignKeyStore}
    includeBlank={includeBlank}
    standalone={standalone}
    showLabel={showLabel}
    hasFeedback={hasFeedback}
    tableStyle={tableStyle}
    embeddedPath={embeddedPath}
    data-record-idx={props["data-record-idx"]}
    readOnly={readOnly}
    disabled={disabled}
    inputWhiteList={"[^A-Za-z0-9@&\\s_.,\\(\\)\\-\\\"\\'\\/\\<\\>]+"}
    displayFieldName="name"
    codeFieldName={accountType === "partner" || accountType === "partnerAccount" ? "RMID" : null}
    theme={theme}
    addonBefore={showAddonBefore ? <span className={
      accountType === "customer" || accountType === "customerAccount"
        ? "glyphicon mdi-truck mdi-lg"
        : "glyphicon mdi-bank mdi-lg"}/> : null}
  />);
}

AccountLookupField.displayName = "AccountLookupField";
AccountLookupField.propTypes = {
  field: PropTypes.object.isRequired,
  accountType: PropTypes.oneOf(
    ["customer", "partner", "operations", "customerAccount", "partnerAccount", "operationsAccount"]
  ),
  actions: PropTypes.object,
  showAddonBefore: PropTypes.bool
};
AccountLookupField.defaultProps = {
  showAddonBefore: true
};

/**
 * @ignore
 */
module.exports = AccountLookupField;
