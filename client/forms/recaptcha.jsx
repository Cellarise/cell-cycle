/* global grecaptcha */
"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from 'ramda';
import ErrorMessage from './errorMessage.jsx';
import {createSyntheticEvent} from '../utils/domDriverUtils';
import {testMode, connectors, win} from '../globals';
import CheckBox from './checkBox.jsx';
import {eventHandler} from '../utils/viewUtils';

module.exports = createReactClass({
  "displayName": "Recaptcha",
  "propTypes": {
    "field": PropTypes.object.isRequired,
    "actions": PropTypes.object.isRequired,
    "className": PropTypes.string,
    "elementID": PropTypes.string,
    "sitekey": PropTypes.string,
    "theme": PropTypes.string,
    "type": PropTypes.string,
    "size": PropTypes.string,
    "tabindex": PropTypes.string,
    "labelWrapperClassName": PropTypes.string,
    "addonBefore": PropTypes.object
  },
  "getDefaultProps": function getDefaults() {
    return {
      "sitekey": connectors.remoteGoogleCaptchaAPI.key,
      "elementID": 'g-recaptcha',
      "theme": 'light',
      "type": 'image',
      "size": 'normal',
      "tabindex": '0'
    };
  },
  "componentDidMount": function componentDidMount() {
    if (!testMode) {
      grecaptcha.render(this.props.elementID, {
        "sitekey": this.props.sitekey,
        "callback": function verifyCallback(response) {
          this.response = response;
          eventHandler(
            this.props.actions, this.props.field.get("storeId"), "onChange",
            createSyntheticEvent(this.props.field.get("name"), response)
          );
        }.bind(this),
        "theme": this.props.theme,
        "type": this.props.type,
        "size": this.props.size,
        "tabindex": this.props.tabindex,
        "expired-callback": function expiredCallback() {
          eventHandler(
            this.props.actions, this.props.field.get("storeId"), "onChange",
            createSyntheticEvent(this.props.field.get("name"), null)
          );
        }.bind(this)
      });
    }
    win.setTimeout(function() {
      eventHandler(
        this.props.actions, this.props.field.get("storeId"), "onChange",
        createSyntheticEvent(this.props.field.get("name"), null)
      );
    }.bind(this), 0);

  },
  "response": null,
  "componentDidUpdate": function componentDidUpdate() {
    if (this.props.field.get("value") === null && !testMode && !R.isNil(this.response)) {
      this.response = null;
      grecaptcha.reset();
    }
  },
  "render": function _render() {
    if (testMode) {
      return (
        <div>
          <CheckBox
            labelWrapperClassName={this.props.labelWrapperClassName}
            inputGroupContentClassName="input-group-content-no-padding"
            addonBefore={this.props.addonBefore}
            field={this.props.field}
            onChange={() => (eventHandler(
              this.props.actions,
              this.props.field.get("storeId"),
              "onChange",
              createSyntheticEvent(
                this.props.field.get("name"),
                //fake but correctly formatted test response
                "03AOPBWq8WCED_L-JqIcoOIr2dAfwQjmwWpWR86QzEzKPfhMVR-aXY1fG1SinU3O98bMo9atecIcIjgUjhErw0BKiucK79nTKfMT6ietnIBwLUpUEBB0vTtphuVu4kk1nQYgBndbkm9iBH7vMa2D0O-aleG2BIz-xJiWju5klGK1TtDSzg0KM-bAPfObA14d4uHqZCO9P0P_TfuOluAROJcsj5d33mq_NHbCmboCDbV-JAh_yviD3NfXXYbXQ4DJSaK7Nuejoe2Tm7OLTFrCS_AR_U8ibwDu8jRB__bg_deJ1wpTEt__i1t50blC6OJp7o8snCieWLoTuL8l0Kz38dwOuS4pRqdeOfkh8Wl5u43RDNP1HDRH7pGTOlnKSNfwZvnVqENWMcInNxOi3GX5HBZvL8FdNyMb0IcE7QIrwQ1Q5oO6U6NOUqzSk" //eslint-disable-line
                )
            ))
            }
          />
        </div>
      );
    }
    return (
      <div>
        <div id={this.props.elementID}
             className={this.props.labelWrapperClassName}
        ></div>
        <ErrorMessage field={this.props.field}/>
      </div>
    );
  }
});
