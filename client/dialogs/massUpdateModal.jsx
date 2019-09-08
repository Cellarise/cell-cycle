"use strict";
import React from 'react'; //eslint-disable-line no-unused-vars
import R from 'ramda';
import TextBox from 'cell-cycle/client/forms/textBox.jsx';
import SelectBox from 'cell-cycle/client/forms/selectBox.jsx';
import Form from 'cell-cycle/client/forms/form.jsx';
import Modal from 'cell-cycle/client/dialogs/modal.jsx';
import {eventHandler, getActiveRecord} from 'cell-cycle/client/utils/viewUtils';
import {FlagField, WorkgroupField} from '../utils/accountHelpers';
import Editor from '../widgets/editor.jsx'
import UserContactPanel from '../collection/userContactPanel.jsx';


/**
 * Connect email component
 * @param {Object} props - component properties
 * @param {String} props.title - form title
 * @param {Object} props.store - form store
 * @param {String} props.actions - form store actions
 * @return {React.Element} react element
 */
function MassUpdateModal(props) {
  const {store, actions, validationConfig} = props;
  const title = store.getIn(["props", "title"]);
  return (
    <Modal
      id="massUpdateModal"
      title={title}
      validationConfig={validationConfig}
      onCancel={(event, hide) => {
        hide();
        eventHandler(actions, store, 'onReset', event);
      }}
      onClick={(event) => {
        eventHandler(actions, store, store.getIn(["props", "store"]), event);
      }}
      size="medium">
      <GetForm
        {...props}
      />
    </Modal>
  );
}

function GetForm({title, store, actions, accountType, localCache}) {
  const activeRecord = getActiveRecord(store);
  const actionId = store.getIn(["props", "actionId"]);
  if (actionId === "loadPermitRoutes") {
    return (
      <div className="container-fluid">
        <Form
          id={title + "-formWrapper"}
          name={title}
        >
          <div className="row">
            <div className="col-xs-12">
              <p>Load permit routes and conditions for selected items?</p>
            </div>
          </div>
        </Form>
      </div>
    );
  }
  if (actionId === "amend") {
    return (
      <div className="container-fluid">
        <Form
          id={title + "-formWrapper"}
          name={title}
        >
          <div className="row">
            <div className="col-xs-12">
              <p>Are you sure you want to create amendment versions for the selected items?</p>
            </div>
          </div>
        </Form>
      </div>
    );
  }
  if (actionId === "renew") {
    return (
      <div className="container-fluid">
        <Form
          id={title + "-formWrapper"}
          name={title}
        >
          <div className="row">
            <div className="col-xs-12">
              <p>Are you sure you want to create renew versions for the selected items?</p>
            </div>
          </div>
        </Form>
      </div>
    );
  }
  if (actionId === "consentGeneration") {
    return (
      <div className="container-fluid">
        <Form
          id={title + "-formWrapper"}
          name={title}
        >
          <div className="row">
            <div className="col-xs-12">
              <p>Are you sure you want to generate consents for the selected items?</p>
            </div>
          </div>
        </Form>
      </div>
    );
  }
  if (actionId === "applicationDelete") {
    return (
      <div className="container-fluid">
        <Form
          id={title + "-formWrapper"}
          name={title}
        >
          <div className="row">
            <div className="col-xs-12">
              <p>Are you sure you want to delete the selected application?</p>
            </div>
          </div>
        </Form>
      </div>
    );
  }
  if (actionId === "deleted") {
    return (
      <div className="container-fluid">
        <Form
          id={title + "-formWrapper"}
          name={title}
        >
          <div className="row">
            <div className="col-xs-12">
              <p>Are you sure you want to delete the selected items?</p>
            </div>
          </div>
        </Form>
      </div>
    );
  }
  if (actionId === "archived" || actionId === "unArchived") {
    return (
      <div className="container-fluid">
        <Form
          id={title + "-formWrapper"}
          name={title}
        >
          <div className="row">
            <div className="col-xs-12">
              {actionId === "archived"
                ? <p>Are you sure you want to archive the selected items?</p>
                : <p>Are you sure you want to un-archive the selected items?</p>
              }
            </div>
          </div>
        </Form>
      </div>
    );
  }
  if (actionId === "accepted" || actionId === "declined") {
    return (
      <div className="container-fluid">
        <Form
          id={title + "-formWrapper"}
          name={title}
        >
          <div className="row">
            <div className="col-xs-12">
              {actionId === "accepted"
                ? <p>Are you sure you want to accept the selected items?</p>
                : <p>Are you sure you want to decline the selected items?</p>
              }
            </div>
          </div>
        </Form>
      </div>
    );
  }
  if (actionId === "toggleUrgent") {
    return (
      <div className="container-fluid">
        <Form
          id={title + "-formWrapper"}
          name={title}
        >
          <div className="row">
            <div className="col-xs-12">
              <p>Are you sure you want to toggle the urgent status on the selected items?</p>
            </div>
          </div>
        </Form>
      </div>
    );
  }
  if (actionId === "status") {
    return (
      <div className="container-fluid">
        <Form
          id={title + "-formWrapper"}
          name={title}
        >
          <div className="row">
            <div className="col-xs-12">
              <SelectBox
                field={activeRecord.get('status')}
                actions={actions}
                includeBlank={true}
              />
            </div>
          </div>
        </Form>
      </div>
    );
  }
  if (actionId === "flag") {
    return (
      <div className="container-fluid">
        <Form
          id={title + "-formWrapper"}
          name={title}
        >
          <div className="row">
            <div className="col-xs-12">
              <FlagField
                field={activeRecord.get('flag')}
                actions={actions}
                databaseAccountCache={localCache.DatabaseAccountCache}
              />
            </div>
          </div>
        </Form>
      </div>
    );
  }
  if (R.contains(actionId, ["resendEmail"])) {
    return (
      <div className="container-fluid">
        <Form
          id={title + "-formWrapper"}
          name={title}
        >
          <div className="row">
            <div className="col-xs-12">
              <TextBox
                type="email"
                field={activeRecord.get("email")}
                inputWhiteList={"[^A-Za-z0-9\\s@\\s_.,#&=/\\(\\)\\-\\\"\\'\\/\\<\\>]+"}
                actions={actions}
                addonBefore={<span className="glyphicon mdi-email mdi-lg"/>}
              />
            </div>
          </div>
        </Form>
      </div>
    )
  }
  if (R.contains(actionId, ["copy", "copyConfig"])) {
    return (
      <div className="container-fluid">
        <Form
          id={title + "-formWrapper"}
          name={title}
        >
          <div className="row">
            <div className="col-xs-12">
              <TextBox
                field={activeRecord.get('name')}
                actions={actions}
                autoFocus={true}
                data-auto-focus={true}
              />
            </div>
          </div>
        </Form>
      </div>
    );
  }
  if (actionId === "workGroupId") {
    return (
      <div className="container-fluid">
        <Form
          id={title + "-formWrapper"}
          name={title}
        >
          <div className="row">
            <div className="col-xs-12">
              <WorkgroupField
                field={activeRecord.get('workGroupId')}
                actions={actions}
                databaseAccountCache={localCache.DatabaseAccountCache}
              />
            </div>
          </div>
        </Form>
      </div>
    );
  }
  if (R.contains(actionId, ["assignment", "activityAssignment"])) {
    return (
      <div className="container-fluid">
        <Form
          id={title + "-formWrapper"}
          name={title}
        >
          <div className="row">
            <div className="col-xs-12">
              <UserContactPanel
                userIdField={activeRecord.get('assignedTo')}
                userRelationField={activeRecord.get('userModelAssignedTo')}
                accountType={accountType}
                actions={actions}
                autoFocus={true}
                data-auto-focus={true}
              />
            </div>
          </div>
          {actionId === "activityAssignment" ? null :
            <div className="row">
              <div className="col-xs-12">
                <Editor
                  field={activeRecord.get('notes')}
                  actions={actions}
                />
              </div>
            </div>
          }
        </Form>
      </div>
    );
  }
  if (R.contains(actionId, ["contactUser"])) {
    return (
      <div className="container-fluid">
        <Form
          id={title + "-formWrapper"}
          name={title}
        >
          <div className="row">
            <div className="col-xs-12">
              <UserContactPanel
                userIdField={activeRecord.get('assignedTo').set('label', 'Customer contact')}
                userRelationField={activeRecord.get('userModelAssignedTo')}
                accountType={accountType}
                actions={actions}
                autoFocus={true}
                data-auto-focus={true}
              />
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12">
              <Editor
                field={activeRecord.get('notes')}
                actions={actions}
              />
            </div>
          </div>
        </Form>
      </div>
    );
  }
  return (
    <div className="container-fluid">
      <Form
        id={title + "-formWrapper"}
        name={title}
      >
        <div className="row">
          <div className="col-xs-12" />
        </div>
      </Form>
    </div>
  );
}

MassUpdateModal.displayName = "MassUpdateModal";

/**
 * @ignore
 */
module.exports = MassUpdateModal;
