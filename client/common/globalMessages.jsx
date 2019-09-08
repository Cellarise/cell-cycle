"use strict";
import React from 'react'; //eslint-disable-line no-unused-vars
import {browserPass} from '../globals';

/**
 * BrowserCheck component
 * @return {React.Element} react element
 */
function GlobalMessages() {
  if (browserPass === false) {
    return (
      <div id="header-alert" className="card style-warning no-bottom-margin">
        <div className="card-body no-padding card-body-sm">
          <span className="glyphicon mdi-alert mdi-1x" />&nbsp;
        <span>
          You are using an unsupported browser, so some features may not work. Please upgrade to a
          <span> </span>
          <a style={{"textDecoration": "underline"}} href="./#page=help/browserSupport">modern browser</a>.
        </span>
        </div>
      </div>
    );
  }
  return <div></div>;
}
GlobalMessages.displayName = "GlobalMessages";
/**
 * @ignore
 */
module.exports = GlobalMessages;
