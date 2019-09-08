"use strict";
import React from 'react'; //eslint-disable-line
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import {logger, win} from '../globals';
import {getLoggedInAccountTypeAndId, getUserId} from '../utils/authHelpers';
import toastrWidget from './toastr';
const TIME_OUT_MINS = 31;
const TIME_OUT_LOGOUT_MINS = 29;


module.exports = createReactClass({
  "displayName": "TimerLogout",
  "contextTypes": {
    "model": PropTypes.object.isRequired,
    "actions": PropTypes.object.isRequired
  },
  "componentDidMount": function componentDidMount() {
    var labelAndButton = "Logging out due to inactivity... " +
      decodeURIComponent("%3Cspan%20type%3D%22button%22%0A%20%20" +
        "%20%20%20%20%20%20%20%20%20%20%20%20%20%20class%3D%22btn%20btn-flat%20" +
        "btn-warning%20toastr-action%22%3Edismiss%3C%2Fspan%3E");
    var modelStream = this.context.model;
    var toastOptionsOverride = {
      "label": "",
      "dismissable": false,
      "closeButton": false,
      "progressBar": true,
      "positionClass": "toast-bottom-left",
      "showDuration": 250,
      "hideDuration": 250,
      "timeOut": TIME_OUT_LOGOUT_MINS * 60 * 1000, //provide 29 minute to cancel auto logout
      "extendedTimeOut": 1000,
      "showEasing": "swing",
      "hideEasing": "swing",
      "showMethod": "slideDown",
      "hideMethod": "slideUp",
      "preventDuplicates": false,
      "escapeHtml": false,
      "onHidden": ()=>{
        this.context.actions.push({
          "id": "logout",
          "storeId": "authenticationUI"
        });
      },
      "onclick": ()=>{
        this.context.actions.push({
          "id": "touchTimeoutCounter",
          "storeId": "authenticationUI"
        });
      }
    };
    toastrWidget.mixin.componentDidMount();
    this._boundModelStream = modelStream
      .changes()
      .debounce(TIME_OUT_MINS * 60 * 1000)
      .onValue((model) => {
        //auto save if required after timer triggered
        const loggedInAccountType = getLoggedInAccountTypeAndId(model).accountType;
        const userId = getUserId(model);
        if (model.getIn(["stores", "authenticationUI", "props", "access_token", "secureTokenFlag"]) === true
          && userId === 140) {
          logger.warn("TimerLogout: trigger-dashboard-refresh");
          win.location.reload();
          return;
        }
        if (loggedInAccountType !== "operations") {
          logger.log("TimerLogout: trigger-auto-save");
          this.context.actions.push({
            "id": "autoSave",
            "storeId": "authenticationUI"
          });
        }
        if (model.getIn(["stores", "authenticationUI", "props", "authenticated"]) === true
          && model.getIn(["stores", "authenticationUI", "props", "rememberMe"]) === false) {
          logger.warn("TimerLogout: trigger-true");
          toastrWidget.info(labelAndButton, null, toastOptionsOverride);
        } else {
          logger.log("TimerLogout: trigger-false");
        }
      });
  },
  "componentWillUnmount": function componentWillUnmount() {
    this._boundModelStream();
    toastrWidget.mixin.componentWillUnmount();
  },
  "render": function _render() {
    return null;
  }
});
