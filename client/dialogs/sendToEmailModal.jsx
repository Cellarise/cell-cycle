"use strict";
import React from 'react';
import PropTypes from 'prop-types'; //eslint-disable-line no-unused-vars
import TextBox from '../forms/textBox.jsx';
import Form from '../forms/form.jsx';
import Modal from './modal.jsx';
import {getActiveRecord, eventHandler} from '../utils/viewUtils';


/**
 * NewRecordModal component
 * @param {Object} props - component properties
 * @param {String} props.title - form title
 * @param {Object} props.store - form store
 * @param {String} props.actions - form store actions
 * @return {React.Element} react element
 */
function SendToEmailModal(props) {
  var {id, title, label, store, validationConfig, actions, newAction, emailField, renderForm} = props;
  return (
    <Modal
      id={id}
      title={title}
      validationConfig={validationConfig}
      onCancel={(event, hide) => {
        hide();
        eventHandler(actions, store, 'onReset', event);
      }}
      onClick={newAction}
      size="medium">
      <SendToEmailForm
        title={title}
        emailField={emailField}
        label={label}
        store={store}
        actions={actions}
        renderForm={renderForm}
      />
    </Modal>
  );
}
SendToEmailModal.displayName = "SendToEmailModal";
SendToEmailModal.propTypes = {
  "id": PropTypes.string,
  "title": PropTypes.string,
  "label": PropTypes.string,
  "emailField": PropTypes.string,
  "newAction": PropTypes.func.isRequired,
  "store": PropTypes.object.isRequired,
  "actions": PropTypes.object.isRequired,
  "validationConfig": PropTypes.object.isRequired
};
SendToEmailModal.defaultProps = {
  "id": "sendToEmailModal",
  "title": "Send to email",
  "emailField": "toEmail",
  "label": "Email"
};

function SendToEmailForm({title, emailField, store, onClick, label, actions, renderForm}) {
  const activeRecord = getActiveRecord(store);
  return (
    <div className="container-fluid">
      <Form
        id={title + "-formWrapper"}
        name={title}
        onSubmit={onClick}
        renderForm={renderForm}
      >
        <div className="row">
          <div className="col-xs-12">
            <TextBox
              field={activeRecord.get(emailField)}
              actions={actions}
              label={label}
              accessMode="create"
              autoFocus={true}
              data-auto-focus={true}
            />
          </div>
        </div>
      </Form>
    </div>
  );
}


/**
 * @ignore
 */
module.exports = SendToEmailModal;
