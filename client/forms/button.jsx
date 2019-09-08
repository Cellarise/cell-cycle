"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import classnames from 'classnames';
import {effects} from '../widgets/effects';
import {createChainedFunction, sanitise} from '../utils';
import {logger} from '../globals';

function renderSubmitButtonText(props) {
  if (props.inProgress) {
    return props.labelInProgress;
  }
  return props.label;
}

/**
 * Button component
 * @param {Object} props - component properties
 * @param {String} [props.name=props.label] - button name
 * @param {Object|String} props.label - button label
 * @param {Object|String} [props.labelInProgress=props.label] - button label when inProgress=true
 * @param {String} [props.type=button] - type of button one of button|a link
 * @param {String} [props.size=small] - size of button
 * @param {String} [props.className=btn-default] - class name for button element
 * @param {Boolean} [props.inProgress=false] - button action is in progress
 * @param {Boolean} [props.disabled=false] - flag to disable button
 * @param {Boolean} [props.inkEffect=true] - flag to show ink effect on button click
 * @return {React.Element} react element
 */
function Button(props) {
  var {label, labelInProgress, name, onClick, inkEffect, containerClassName, //eslint-disable-line no-unused-vars
    className, inProgress, disabled, type, rel, authorised, hide, ...otherProps} = props;
  var classNames = classnames({
    "btn": true,
    "ink-reaction": inkEffect
  }, className);
  var title = sanitise(props.title);
  if (hide === true) {
    return <span></span>;
  }
  if (onClick && !R.isNil(onClick.authorised) && !onClick.authorised) {
    authorised = false;
  }
  if (authorised === false) {
    title = "You are not authorised to perform this action";
  }

  if (R.isNil(name)) {
    if (label && R.is(String, label)) {
      name = label;
    } else if (title) {
      name = title;
    } else {
      name = "";
      logger.error("Button: could not find a name for the button");
    }
  }
  if (onClick && inkEffect) {
    onClick = createChainedFunction(effects.inkOnClickEvent, props.onClick);
  } else if (inkEffect) {
    onClick = effects.inkOnClickEvent;
  }
  if (type === "link") {
    return (
      <a
        {...otherProps}
        rel={rel}
        type={type}
        onClick={onClick}
        name={name}
      ><button
        {...otherProps}
        className={classNames}
        name={name}
      >{renderSubmitButtonText(props)}</button></a>
    );
  }
  if (props["data-toggle-tooltip"] === "tooltip" || !authorised) {
    return (
      <div
        style={{"display": classNames.indexOf("btn-block") > -1 ? "inline" : "inline-block"}}
        title={title}
        data-toggle-tooltip="tooltip"
        data-placement={props["data-placement"]}
        className={containerClassName}
      ><button
        {...otherProps}
        title={null}
        data-toggle-tooltip={null}
        data-placement={null}
        disabled={inProgress || disabled || !authorised}
        type={type}
        className={classNames}
        onClick={onClick}
        name={name}
      >{renderSubmitButtonText(props)}</button></div>
    );
  }
  return (
    <button
      {...otherProps}
      disabled={inProgress || disabled || !authorised}
      type={type}
      className={classnames(classNames, className)}
      onClick={onClick}
      name={name}
    >{renderSubmitButtonText(props)}</button>
  );
}
Button.displayName = "Button";
Button.propTypes = {
  "name": PropTypes.string,
  "label": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]).isRequired,
  "labelInProgress": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "className": PropTypes.string,
  "containerClassName": PropTypes.string,
  "size": PropTypes.oneOf(["small", "medium", "large"]),
  "type": PropTypes.string,
  "href": PropTypes.string,
  "inProgress": PropTypes.bool,
  "disabled": PropTypes.bool,
  "hide": PropTypes.bool,
  "inkEffect": PropTypes.bool,
  "authorised": PropTypes.bool,
  "rel": PropTypes.string
};
Button.defaultProps = {
  "type": "button",
  "className": "btn-default",
  "containerClassName": "",
  "inProgress": false,
  "disabled": false,
  "authorised": true,
  "inkEffect": true
};
/**
 * @ignore
 */
module.exports = Button;
