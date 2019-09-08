"use strict";
import React from "react";
import PropTypes from 'prop-types';
import R from 'ramda';
import ErrorMessageBase from './errorMessageBase.jsx';

function ErrorMessage({field, showError, error}) {
  const _showError = R.defaultTo(field.get("showError"), showError);
  if (!_showError) {
    return <div></div>;
  }
  const props = field.toJS();
  props.error = R.defaultTo(props.error, error);
  props.showError = true;
  return (
    <div className="has-error">
      <ErrorMessageBase {...props}/>
    </div>
  );
}

ErrorMessage.displayName = "forms/errorMessage";
ErrorMessage.propTypes = {
  field: PropTypes.object.isRequired,
  showError: PropTypes.bool,
  error: PropTypes.string
};

/**
 * @ignore
 */
module.exports = ErrorMessage;
