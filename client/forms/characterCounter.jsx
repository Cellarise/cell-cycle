"use strict";
import React from "react";
import PropTypes from 'prop-types';
import R from 'ramda';
import {$} from '../globals';

function CharacterCounter({field, maxLength, value, validation}) {
  let currentLength = 0, _maxLength = 0;
  if (R.isNil(field)) {
    if (!R.isNil(validation) && !R.isNil(validation.length)) {
      _maxLength = R.defaultTo(maxLength, validation.length.max);
    }
    currentLength = R.defaultTo("", value).length;
  } else {
    _maxLength = R.defaultTo(maxLength, field.getIn(["validation", "length", "max"]));
    currentLength = $("<div>" + R.defaultTo("", field.get("value")) + "</div>").text().length;
  }
  if (R.isNil(_maxLength) || _maxLength === 0) {
    return <div></div>;
  }
  return (
    <div className="help-block pull-right"><span>{currentLength + " / " + _maxLength}</span></div>
  );
}

CharacterCounter.displayName = "forms/CharacterCounter";
CharacterCounter.propTypes = {
  field: PropTypes.object,
  maxLength: PropTypes.number,
  value: PropTypes.string
};

/**
 * @ignore
 */
module.exports = CharacterCounter;
