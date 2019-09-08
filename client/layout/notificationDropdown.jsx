"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from 'ramda';
import * as aria from '../libraries/accessibility';
import {dropdown} from '../widgets/dropdown';
import {effects} from '../widgets/effects';
import {shallowEqual} from '../utils';
import * as routerLibrary from '../libraries/router';
import {eventHandler} from '../utils/viewUtils';
import {createSyntheticEvent} from '../utils/domDriverUtils';


module.exports = createReactClass({
  displayName: "layouts/header/notificationDropdown",
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
    const props = this.props;
    const {notificationStore, actions, fieldRenderers, accountType, user} = props;
    let records = [];
    if (R.isNil(user.getIn([0, 'id', 'value']))) {
      return null;
    }
    records = R.defaultTo([], notificationStore.getIn(['collection', 'records']));

    return (
      <ul className="header-nav header-nav-notification">
        <li className="dropdown">
          <a aria-label={aria.menuLink("Notifications")}
             tabIndex="0"
             id="header-nav-profile-dropdown-notification"
             className="dropdown-toggle ink-reaction"
             data-toggle="dropdown" data-target="#"
             onClick={effects.inkOnClickEvent}
             role="button" aria-haspopup="true" aria-expanded="false">
            <span className="profile-info glyphicon mdi-bell mdi-2x"></span>
            <sup className="badge badge-support2">{records.length}</sup>
          </a>
          <ul className="dropdown-menu animation-dock" aria-labelledby="header-nav-profile-dropdown-notification">
            {renderNotifications(records, fieldRenderers, accountType, notificationStore, actions)}
          </ul>
        </li>
      </ul>
    );
  }
});

function renderNotifications(records, fieldRenderers, accountType, notificationStore, actions) {
  return R.addIndex(R.map)((notification, idx) => {
    return (
      <li key={idx}>
        <a
          href={routerLibrary
            .objectToHash(fieldRenderers.getNotificationLinkHashObject(notification, accountType))}>
            <span
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
                eventHandler(
                  actions, notificationStore, 'onNotificationToggleReadReceipt',
                  createSyntheticEvent('Read', notification.id, null, null, notification)
                );
              }}
              title="Click to mark as read"
              data-toggle="tooltip"
              data-placement="top"
            >{fieldRenderers.notificationActivityRead({"item": notification})}</span>&nbsp;&nbsp;
          <span style={{"fontSize": "small", "verticalAlign": "text-bottom"}}>
              {fieldRenderers.dueDate({"item": notification, "dueDate": notification.dueDate})}
              </span>&nbsp;&nbsp;
          <span style={{"fontSize": "small"}}>
              {fieldRenderers.notificationApplicationNumber({"item": notification})}
              </span>&nbsp;&nbsp;
          <span>{fieldRenderers.notificationSubject({"item": notification})}</span>&nbsp;&nbsp;
          <span style={{"verticalAlign": "text-bottom"}}>
            {fieldRenderers.notificationNew({"item": notification})}
            </span>
        </a>
      </li>
    );
  }, records);
}
