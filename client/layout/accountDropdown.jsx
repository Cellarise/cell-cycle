"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from 'ramda';
import {capitalizeFirstLetter, fixedLength} from '../utils';
import * as routerLibrary from '../libraries/router';
import * as aria from '../libraries/accessibility';
import {dropdown} from '../widgets/dropdown';
import {effects} from '../widgets/effects';
import {renderMenu} from './routeMenu';
import {getAccountPictureUrl} from '../utils/fileHelpers';
import {shallowEqual} from '../utils';


function renderLevel1Component(route, idx, actions, activeAccountMembershipRecord, activeAccountType) {
  let activeAccountRecord, accountLabel, accountTypeLabel, fileList;
  if (!R.isNil(activeAccountMembershipRecord) && activeAccountMembershipRecord.has(activeAccountType + "Account")) {
    activeAccountRecord = activeAccountMembershipRecord.get(activeAccountType + "Account").toJS();
  }
  if (R.isNil(activeAccountRecord)) {
    accountLabel = "No accounts";
    accountTypeLabel = "";
  } else if (activeAccountRecord) {
    accountLabel = fixedLength(R.defaultTo("", activeAccountRecord.name), 25);
    accountTypeLabel = capitalizeFirstLetter(activeAccountType === "operations" ? "regulator" : activeAccountType) +
      " " + activeAccountMembershipRecord.get('role');
    fileList = activeAccountRecord.fileList;
  } else {
    accountLabel = "Account not found";
    accountTypeLabel = "";
  }
  //set account label to 'Read only' if account archived
  if (!R.isNil(activeAccountRecord) && activeAccountRecord.archived === true) {
    accountTypeLabel = <span className="text-danger text-bold">Read only</span>;
  }
  const currentUrl = getAccountPictureUrl(fileList);
  return (
    <li key={idx} className="dropdown">
      <a aria-label={aria.menuLink("Account")}
         tabIndex="0"
         id="header-nav-profile-dropdown-account"
         className="dropdown-toggle ink-reaction"
         data-toggle="dropdown" data-target="#"
         onClick={effects.inkOnClickEvent}
         role="button" aria-haspopup="true" aria-expanded="false">
        <span className="profile-image profile-image-account">
        <img
          className="img-rounded"
          src={currentUrl}
        />
        </span>
        <span className="profile-info">
          <span>{accountLabel}</span>
          <small>{accountTypeLabel}</small>
        </span>
      </a>
      <ul className="dropdown-menu dropdown-menu-right animation-dock"
          aria-labelledby="header-nav-profile-dropdown-account">
        {renderLevel2(activeAccountType, actions, route.routes)}
      </ul>
    </li>
  );
}

function renderLevel2(activeAccountType, actions, routes) {
  return R.pipe(
    R.filter(R.propEq('authorised', true)),
    R.filter(R.propEq('hide', false)),
    R.filter(R.propOr(true, 'dropdownShow')),
    R.filter((route) => (route.accountType ? route.accountType === activeAccountType : true)),
    R.addIndex(R.map)((route, idx) => {
      return (
        <li key={idx}>
          <a
            aria-label={aria.menuLink(route.name)}
            href={routerLibrary.createALink("page=" + route.path)}
            onClick={route.triggerAction
              ? () => (actions.push(route.triggerAction))
              : () => (routerLibrary.linkSelect.call(
              routerLibrary, null, routerLibrary.createALink("page=" + route.path)))}>
            <span className={"glyphicon " + route.icon + ""}/><span>{" " + route.name}</span>
          </a>
        </li>
      );
    })
  )(R.defaultTo([], routes));
}

module.exports = createReactClass({
  displayName: "layouts/header/acountDropdown",
  propTypes: {
    routes: PropTypes.object,
    authenticationUI: PropTypes.object
  },
  shouldComponentUpdate: function shouldComponentUpdate(nextProps) {
    return !shallowEqual(this.props, nextProps);
  },
  componentDidMount: function componentDidMount() {
    dropdown.mixin.componentDidMount();
  },
  componentDidUpdate: function componentDidUpdate() {
    dropdown.mixin.componentDidUpdate();
  },
  componentWillUnmount: function componentWillUnmount() {
    dropdown.mixin.componentWillUnmount();
  },
  render: function render() {
    const {routes, authenticationUI, actions} = this.props;
    const activeAccountType = R.defaultTo("", authenticationUI.getIn(['savedSettings', 'activeAccountType']));
    const accountTypeRecords = authenticationUI.getIn(['props', activeAccountType + "Accounts"]);
    const accountTypeActiveRecordId =
      authenticationUI.getIn(['savedSettings', "active" + capitalizeFirstLetter(activeAccountType) + "Account"]);
    let activeAccountMembershipRecord;
    if (!R.isNil(accountTypeRecords)) {
      activeAccountMembershipRecord = accountTypeRecords.find(
        (accountRecord) => {
          return accountRecord.get(activeAccountType + "AccountId") === accountTypeActiveRecordId;
        }
      );
    }

    return (
      <ul className="header-nav header-nav-profile">
        {renderMenu((route, idx) => {
          return renderLevel1Component(route, idx, actions, activeAccountMembershipRecord, activeAccountType);
        }, this.context.actions, routes.toJS(), {
          "hide": false,
          "userDropdown": false,
          "accountDropdown": true,
          "menuSkip": false
        })}
      </ul>
    );
  }
});
