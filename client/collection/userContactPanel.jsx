"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import ForeignKeyLookup from './foreignKeyLookup.jsx';
import ModelSubscriptionV2 from '../common/modelSubscriptionV2.jsx';
import TextBox from '../forms/textBox.jsx';


/**
 * UserContactPanel component
 * @param {Object} props - component properties
 * @param {String} props.title - form title
 * @param {String} props.userIdField - parent user id field
 * @param {String} props.userRelationField - parent user foreign key relation field
 * @return {React.Element} react element
 */
function UserContactPanel(props) {
  let storePath = [
    "stores",
    "userModelUI-scoped-search"
  ];
  if (props.searchAllUsers) {
    storePath = [
      "stores",
      "userModelUI-scoped-search-all"
    ];
  }
  return (
    <div className="row">
      <div className="col-xs-12">
        <ModelSubscriptionV2
          modelSubscriptions={[{
            "name": "foreignKeySearch",
            "path": storePath
          }]}
        >
          <UserMappingLookup
            {...props}
          />
        </ModelSubscriptionV2>
      </div>
    </div>
  );
}

function UserMappingLookup(props) {
  const {userRelationField, foreignKeySearch, showProfile} = props;
  const origRecords = R.defaultTo([], foreignKeySearch.getIn(['search', 'records']));
  let userModel;

  if (showProfile) {
    //@todo check why the foreignKey loses firstName, phone1, and name when switching to update account and back
    //to permit application
    if (R.isNil(origRecords) || origRecords.length === 0 || R.isNil(origRecords[0].name)) {
      //use the userRelationField
      userModel = userRelationField.get('value');
    } else if (!R.isNil(origRecords[0])) {
      userModel = origRecords[0];
    } else {
      userModel = {
        "phone1": null,
        "firstName": null,
        "name": null
      };
    }
    return (
      <div>
        <div className="row">
          <div className="col-xs-12 col-sm-4">
            {UserForeignKeyLookup(props)}
          </div>
          <div className="col-xs-12 col-sm-4">
            <TextBox
              label="Phone"
              name="phone1"
              value={userModel && userModel.phone1}
              readOnly={true}
              disabled={true}
              addonBefore={<span className="glyphicon mdi-phone mdi-lg"/>}
            />
          </div>
          <div className="col-xs-12 col-sm-4">
            <TextBox
              label="Email"
              name="email"
              value={userModel && userModel.email}
              readOnly={true}
              disabled={true}
              addonBefore={<span className="glyphicon mdi-email mdi-lg"/>}
            />
          </div>
        </div>
      </div>
    );
  }
  return UserForeignKeyLookup(props);
}

function UserForeignKeyLookup({
  userIdField, userRelationField, actions, onChange, onBlur, foreignKeySearch, theme, width, name, alwaysExpanded,
  readOnly, disabled, onChangeId, onBlurId, onSuggestionSelectedCallback, accountType, accountId
}) {
  return (<ForeignKeyLookup
    width={width}
    field={userIdField}
    name={R.defaultTo(userIdField.get('name'), name)}
    alwaysExpanded={alwaysExpanded}
    actions={actions}
    onChange={onChange}
    onBlur={onBlur}
    onChangeId={onChangeId}
    onBlurId={onBlurId}
    onSuggestionSelectedCallback={onSuggestionSelectedCallback}
    foreignKeyRelation={userRelationField}
    lookupStoreSearch={foreignKeySearch}
    readOnly={readOnly}
    disabled={disabled}
    inputWhiteList={"[^A-Za-z0-9@&\\s_.,\\(\\)\\-\\\"\\'\\/\\<\\>]+"}
    displayFieldNamePrefix="firstName"
    displayFieldName="name"
    addonBefore={<span className="glyphicon mdi-account mdi-lg"/>}
    theme={theme}
    accountType={accountType}
    accountId={accountId}
    clearValueOnDropdown={true}
  />);
}

UserContactPanel.displayName = "UserContactPanel";
UserContactPanel.propTypes = {
  "userIdField": PropTypes.object.isRequired,
  "userRelationField": PropTypes.object,
  "showProfile": PropTypes.bool,
  "actions": PropTypes.object,
  "onChangeId": PropTypes.string,
  "onBlurId": PropTypes.string,
  "onSuggestionSelectedCallback": PropTypes.func,
  "accountType": PropTypes.string,
  "accountId": PropTypes.number,
  "searchAllUsers": PropTypes.bool
};
UserContactPanel.defaultProps = {
  "showProfile": false,
  "searchAllUsers": false
};

/**
 * @ignore
 */
module.exports = UserContactPanel;
