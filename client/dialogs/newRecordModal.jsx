"use strict";
import React from 'react'; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types';
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
function NewRecordModal(props) {
  var {id, title, label, store, validationConfig, actions, newAction, nameField, renderForm} = props;
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
      <NewRecordForm
        title={title}
        nameField={nameField}
        label={label}
        store={store}
        actions={actions}
        renderForm={renderForm}
      />
    </Modal>
  );
}
NewRecordModal.displayName = "NewRecordModal";
NewRecordModal.propTypes = {
  "id": PropTypes.string,
  "title": PropTypes.string,
  "label": PropTypes.string,
  "nameField": PropTypes.string,
  "newAction": PropTypes.func.isRequired,
  "store": PropTypes.object.isRequired,
  "actions": PropTypes.object.isRequired,
  "validationConfig": PropTypes.object.isRequired
};
NewRecordModal.defaultProps = {
  "id": "newRecordModal",
  "title": "Create new record",
  "nameField": "name",
  "label": "Name"
};

function NewRecordForm({title, nameField, store, onClick, label, actions, renderForm}) {
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
              field={activeRecord.get(nameField)}
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
module.exports = NewRecordModal;
