"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from 'ramda';
import {fixedLength} from '../utils';
import * as routerLibrary from '../libraries/router';
import * as aria from '../libraries/accessibility';
import {dropdown} from '../widgets/dropdown';
import {effects} from '../widgets/effects';
import {renderMenu} from './routeMenu';
import {getUserProfilePictureUrl} from '../utils/fileHelpers';
import {shallowEqual} from '../utils';


function renderLevel1Component(route, idx, actions, userRecord) {
  const currentUrl = getUserProfilePictureUrl(userRecord.getIn(['fileList', 'value']));
  return (
    <li key={idx} className="dropdown userDropdown">
      <a aria-label={aria.menuLink("User")}
         tabIndex="0"
         id="header-nav-profile-dropdown-user"
         className="dropdown-toggle ink-reaction"
         data-toggle="dropdown" data-target="#"
         onClick={effects.inkOnClickEvent}
         role="button" aria-haspopup="true" aria-expanded="false">
        <span className="profile-image">
        <img
          className="img-circle"
          src={currentUrl}
        />
        </span>
        <span className="profile-info">
          <span>{fixedLength(
            userRecord.getIn(['firstName', 'value']) + " " + userRecord.getIn(['name', 'value']), 25
          )}</span>
          <small>{fixedLength(userRecord.getIn(['email', 'value']), 25)}</small>
        </span>
      </a>
      <ul className="dropdown-menu animation-dock" aria-labelledby="header-nav-profile-dropdown-user">
        {renderLevel2(route.routes, actions)}
      </ul>
    </li>
  );
}

function renderLevel2(routes, actions) {
  return R.pipe(
    R.filter(R.propEq('authorised', true)),
    R.filter(R.propEq('hide', false)),
    R.filter(R.propOr(true, 'dropdownShow')),
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
  displayName: "layouts/header/userDropdown",
  propTypes: {
    routes: PropTypes.object,
    user: PropTypes.object
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
    const {routes, user, actions} = this.props;
    if (R.isNil(user.getIn([0, 'id', 'value']))) {
      return (
        <ul className="header-nav header-nav-login">
          <li className="dropdown">
            <a className="ink-reaction"
               role="button"
               aria-label={aria.menuLink("Login")}
               href={routerLibrary.createALink("page=")}>
              <span className={"profile-image glyphicon mdi-2x mdi-account"}/>
              <span className="profile-info">
                  Login
                  <small>or register</small>
              </span>
            </a>
          </li>
        </ul>
      );
    }
    return (
      <ul className="header-nav header-nav-profile">
        {renderMenu((route, idx) => {
          return renderLevel1Component(route, idx, actions, user.get(0));
        }, actions, routes.toJS(), {
          "hide": true,
          "userDropdown": true,
          "accountDropdown": false,
          "menuSkip": false
        })}
      </ul>
    );
  }
});
