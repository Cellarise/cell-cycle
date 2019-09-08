"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import * as aria from '../libraries/accessibility';
import {getLogo} from '../utils/fileHelpers';
import {offCanvas} from './offCanvas';
import UserDropdown from './userDropdown.jsx';
import AccountDropdown from './accountDropdown.jsx';
import NotificationDropdown from './notificationDropdown.jsx';
import {eventHandler} from 'cell-cycle/client/utils/viewUtils';

function Header({routes, user, authenticationUI, secureTokenRoute, actions, notificationStore, fieldRenderers}) {
  const activeAccountType = R.defaultTo("", authenticationUI.getIn(['savedSettings', 'activeAccountType']));
  return (
    <div className="headerbar">
      <div className="headerbar-left">
        <ul className="header-nav header-nav-options">
          {secureTokenRoute === true ? null :
            <li tabIndex="0"
                onKeyPress={(event) => {
                  if (event.key === "Enter") {
                    eventHandler(actions, "userModelUI", "onMenuBarToggle");
                  }
                }}
                role="navigation"
                onClick={() => {
                  eventHandler(actions, "userModelUI", "onMenuBarToggle");
                }}
                data-toggle="menubar"
            >
              <a className="btn btn-icon-toggle menubar-toggle"
                 aria-label={aria.toggleLink("Menu")}>
              <span data-toggle="tooltip" data-placement="right"
                    data-original-title={aria.toggleLink("Menu")} className="glyphicon mdi-menu mdi-lg"/>
              </a>
            </li>
          }
          <li className="header-nav-brand">
            <div className="brand-holder">
              <a tabIndex="0"
                 href="./#">
                {getLogo(authenticationUI)}
              </a>
            </div>
          </li>
        </ul>
      </div>
      <div className="headerbar-right">
        <ul className="header-nav header-nav-options">
        </ul>
        {secureTokenRoute === true ? null :
          <AccountDropdown
            authenticationUI={authenticationUI}
            routes={routes}
            actions={actions}
          />
        }
        {secureTokenRoute === true ? null :
          <UserDropdown
            authenticationUI={authenticationUI}
            user={user}
            routes={routes}
            actions={actions}
          />
        }
        {secureTokenRoute === true ? null :
          <NotificationDropdown
            notificationStore={notificationStore}
            fieldRenderers={fieldRenderers}
            authenticationUI={authenticationUI}
            user={user}
            routes={routes}
            actions={actions}
            accountType={activeAccountType}
          />
        }
        <ul className="header-nav header-nav-profile">
          <li tabIndex="0"
              onKeyPress={(event) => {
                if (event.key === 'Enter') {
                  offCanvas.onToggleCanvas(event);
                  eventHandler(actions, "userModelUI", "onOpenHelp");
                }
               }}
              onClick={(event) => {
                offCanvas.onToggleCanvas(event);
                eventHandler(actions, "userModelUI", "onOpenHelp");
              }}
              data-canvas="#rightCanvas"
              data-backdrop={true}
              data-toggle="offcanvas"
          >
            <a className="btn text-primary helpFeature"
               aria-label={aria.toggleLink("Help")}>
              <span data-toggle="tooltip" data-placement="left"
                    data-original-title={aria.toggleLink("Help")}
                    className="">Help</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
Header.displayName = "Header";
Header.propTypes = {
  "author": PropTypes.string.isRequired,
  "name": PropTypes.string.isRequired,
  "routes": PropTypes.object,
  "user": PropTypes.object,
  "authenticationUI": PropTypes.object,
  "menuToggle": PropTypes.bool
};
/**
 * @ignore
 */
module.exports = Header;
