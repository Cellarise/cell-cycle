import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import Modal from './modal.jsx';


function ConfirmModal({id, label, title, cancelText, okText, okDisabled, classNameCancel, classNameOk,
  onCancel, showCancel, onClick, size, dismissable, showCounter}) {
  return (
    <Modal
      id={id}
      title={title}
      label={label}
      classNameCancel={classNameCancel}
      classNameOk={classNameOk}
      cancelText={cancelText}
      showCancel={showCancel}
      okText={okText}
      okDisabled={okDisabled}
      onClick={onClick}
      onCancel={onCancel}
      className="text-left"
      size={size}
      dismissable={dismissable}
      showCounter={showCounter}
    >
      <RenderLabel />
    </Modal>
  );
}

function RenderLabel({label}) {
  if (R.is(String, label)) {
    return <span>{label}</span>;
  }
  return label;
}

ConfirmModal.displayName = "dialogs/confirmModal";
ConfirmModal.propTypes = {
  "id": PropTypes.string,
  "name": PropTypes.string,
  "title": PropTypes.string,
  "onClick": PropTypes.func.isRequired,
  "label": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "onCancel": PropTypes.func,
  "cancelText": PropTypes.string,
  "showCancel": PropTypes.bool,
  "okText": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "okDisabled": PropTypes.bool,
  "className": PropTypes.string,
  "size": PropTypes.oneOf(["small", "medium", "large"]),
  "inkEffect": PropTypes.bool,
  "dismissable": PropTypes.bool
};
ConfirmModal.defaultProps = {
  "id": "confirmModal",
  "title": "Delete",
  "cancelText": "Cancel",
  "showCancel": true,
  "okText": "Delete",
  "okDisabled": false,
  "size": "small",
  "classNameCancel": "btn-default btn-flat",
  "classNameOk": "btn-danger btn-flat",
  "label": "Are you sure you want to delete this record?",
  "className": "btn-default",
  "inProgress": false,
  "inkEffect": true,
  "dismissable": true,
  "showCounter": 0
};

/**
 * @ignore
 */
module.exports = ConfirmModal;
