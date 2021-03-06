"use strict";
import React from 'react';
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
function PermitSchemeLookupField(props) {
  const foreignKeyStore = {
    "name": "foreignKeyStore",
    "path": [
      "stores",
      "permitSchemeUI"
    ]
  };
  return (
    <div className="row">
      <div className="col-xs-12">
        <ModelSubscriptionV2
          modelSubscriptions={[foreignKeyStore]}
        >
          <PermitSchemeLookup
            {...props}
          />
        </ModelSubscriptionV2>
      </div>
    </div>
  );
}

function PermitSchemeLookup(props) {
  let {field, actions, onChange, onBlur, foreignKeyStore, relationField, readOnly, disabled, onChangeId, onBlurId,
    width, name, alwaysExpanded, filterArchived,
    approvalType, partnerAccountId, permitApplicationId,
    includeBlank, standalone, showLabel, hasFeedback, tableStyle, embeddedPath, showAddonBefore, theme} = props;
  const origRecords = R.defaultTo([], foreignKeyStore.getIn(['search', 'records']));
  foreignKeyStore = foreignKeyStore.setIn(['search', 'records'], R.pipe(
    R.filter(
      (record) => {
        if (filterArchived === true && record.archived === true) {
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
    codeFieldName={"id"}
    theme={theme}
    accountType={approvalType}
    accountId={partnerAccountId}
    modelId={permitApplicationId}
    addonBefore={showAddonBefore ? <span className="glyphicon mdi-bank mdi-lg"/> : null}
  />);
}

PermitSchemeLookupField.displayName = "PermitSchemeLookupField";
PermitSchemeLookupField.propTypes = {
  field: PropTypes.object.isRequired,
  accountType: PropTypes.oneOf(
    ["customer", "partner", "operations", "customerAccount", "partnerAccount", "operationsAccount"]
  ),
  actions: PropTypes.object,
  showAddonBefore: PropTypes.bool
};
PermitSchemeLookupField.defaultProps = {
  showAddonBefore: true
};

/**
 * @ignore
 */
module.exports = PermitSchemeLookupField;
