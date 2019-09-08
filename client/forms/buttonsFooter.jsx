"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import Button from './button.jsx';
import RadioButtonGroup from './radioButtonGroup.jsx';


function ButtonsFooter({
  classNameFooter,
  showCancel, cancelText, classNameCancel, onCancel,
  showOk, okText, classNameOk, okDisabled, okHref, onClick,
  showReject, rejectText, classNameReject, rejectDisabledText, onReject,
  showRejected, rejectedText, classNameRejected, rejectedDisabledText, onRejected,
  showApprove, approveText, classNameApprove, approveDisabledText, onApprove,
  optionField, optionOnChange, optionOnBlur, classNameOption, actions
}) {
  return (
    <div className={R.isNil(classNameFooter) ? "modal-footer" : classNameFooter}>
      {
        showCancel &&
        <Button label={cancelText}
                name="cancelButton"
                className={classNameCancel}
                onClick={onCancel}
        />
      }
      {
        showOk &&
        <Button label={okText}
                name="okButton"
                className={classNameOk}
                disabled={okDisabled}
                onClick={onClick}
                href={okHref}
                type={R.isNil(okHref) ? "button" : "link" /*NB: null will not work must set to button if no okHref*/}
                target={R.isNil(okHref) ? null : "_blank"}
                rel={R.isNil(okHref) ? null : "noopener noreferrer"}
        />
      }
      {
        showReject &&
        <Button label={rejectText}
                name="rejectButton"
                className={classNameReject}
                disabled={!R.isNil(rejectDisabledText)}
                data-toggle-tooltip={!R.isNil(rejectDisabledText) ? "tooltip" : null}
                title={rejectDisabledText}
                onClick={onReject}
        />
      }
      {
        showRejected &&
        <Button label={rejectedText}
                name="rejectedButton"
                className={classNameRejected}
                disabled={!R.isNil(rejectedDisabledText)}
                data-toggle-tooltip={!R.isNil(rejectedDisabledText) ? "tooltip" : null}
                title={rejectedDisabledText}
                onClick={onRejected}
        />
      }
      {
        showApprove &&
        <Button label={approveText}
                name="okButton"
                className={classNameApprove}
                disabled={!R.isNil(approveDisabledText)}
                data-toggle-tooltip={!R.isNil(approveDisabledText) ? "tooltip" : null}
                title={approveDisabledText}
                onClick={onApprove}
        />
      }
      {
        R.isNil(optionField) ? null :
        <div className={classNameOption}>
          <RadioButtonGroup
            field={optionField}
            onChange={optionOnChange}
            onBlur={optionOnBlur}
            actions={actions}
            horizontal={true}
            labelSpacing="col-xs-3"
            colSpacings={["col-xs-3", "col-xs-5", "col-xs-11"]}
          />
        </div>
      }
    </div>
  );
}
ButtonsFooter.displayName = "forms/ButtonsFooter";
ButtonsFooter.propTypes = {
  "onCancel": PropTypes.func,
  "onClick": PropTypes.func,
  "onReject": PropTypes.func,
  "onApprove": PropTypes.func,
  "rejectText": PropTypes.string,
  "approveText": PropTypes.string,
  "cancelText": PropTypes.string,
  "okText": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "rejectDisabledText": PropTypes.string,
  "approveDisabledText": PropTypes.string,
  "okDisabled": PropTypes.bool,
  "showReject": PropTypes.bool,
  "showApprove": PropTypes.bool,
  "showOk": PropTypes.bool,
  "showCancel": PropTypes.bool,
  "classNameReject": PropTypes.string,
  "classNameApprove": PropTypes.string,
  "classNameCancel": PropTypes.string,
  "classNameOk": PropTypes.string,
  "classNameFooter": PropTypes.string,
  "classNameOption": PropTypes.string,
  "optionOnChange": PropTypes.func,
  "optionOnBlur": PropTypes.func,
  "optionField": PropTypes.object
};

/**
 * @ignore
 */
module.exports = ButtonsFooter;
