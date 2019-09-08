"use strict";
import React from "react";
import PropTypes from 'prop-types';

function ErrorMessageBase({name, label, error, showError}) {
  if (!showError) {
    return null;
  }
  const id = name + "-error";
  const errorMessage = error.charAt(0) === error.charAt(0).toUpperCase() ? error : label + " " + error;
  return <span className="help-block" id={id}>{errorMessage}</span>;
}

ErrorMessageBase.displayName = "forms/errorMessageBase";
ErrorMessageBase.propTypes = {
  showError: PropTypes.bool,
  error: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ])
};

/**
 * @ignore
 */
module.exports = ErrorMessageBase;
