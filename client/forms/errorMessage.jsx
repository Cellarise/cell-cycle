"use strict";
import React from "react";

function ErrorMessage(props) {
  if (!props.showError) {
    return <div></div>;
  }
  let id = `${props.name}-error`;
  let errorMessage = props.error.charAt(0) === props.error.charAt(0).toUpperCase() ?
    props.error :
    `${props.label} ${props.error}`;
  return <div className="has-error"><span className="help-block" id={id} key="error">{errorMessage}</span></div>;
}

ErrorMessage.displayName = "forms/errorMessage";
ErrorMessage.propTypes = {
  showError: React.PropTypes.bool,
  error: React.PropTypes.string,
  className: React.PropTypes.string
};
//ErrorMessage.defaultProps = {
//  className: "standalone-label"
//};

/**
 * @ignore
 */
module.exports = ErrorMessage;
