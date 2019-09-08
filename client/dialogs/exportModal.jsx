"use strict";
import React from 'react'; //eslint-disable-line no-unused-vars
import R from 'ramda';
import RadioButtonGroup from 'cell-cycle/client/forms/radioButtonGroup.jsx';
import CheckBox from 'cell-cycle/client/forms/checkBox.jsx';
import Form from 'cell-cycle/client/forms/form.jsx';
import Modal from 'cell-cycle/client/dialogs/modal.jsx';
import {createSyntheticEvent} from "cell-cycle/client/utils/domDriverUtils";


/**
 * Connect email component
 * @param {Object} props - component properties
 * @param {String} props.title - form title
 * @param {Object} props.store - form store
 * @param {String} props.actions - form store actions
 * @return {React.Element} react element
 */
function ExportModal(props) {
  const {id, title, onCollectionPropChange, eventName} = props;
  return (
    <Modal
      id={id}
      title={title}
      onCancel={(event, hide) => {
        hide();
      }}
      onClick={(event, hide) => {
        onCollectionPropChange(createSyntheticEvent(eventName));
        hide();
      }}
      okText="Export"
      ignoreValidationConfig={true}
      size="medium"
    >
      <GetForm
        {...props}
      />
    </Modal>
  );
}

function GetForm({title, activeRecord, onCollectionPropChange, recordCount}) {
  let hasSelectedRows = false;
  if (!R.isNil(activeRecord) && R.defaultTo([], activeRecord.getIn(["exportRowsSelected", "value"])).length > 0) {
    hasSelectedRows = true;
  }
  return (
    <div className="container-fluid">
      <Form
        id={title + "-formWrapper"}
        name={title}
      >
        {!R.isNil(activeRecord) ?
          <div className="row">
            <div className="col-xs-12">
              <p>All rows will be exported unless you have selected rows using the checkboxes in column one.</p>
            </div>
          </div>
          :
          <div className="row">
            <div className="col-xs-12">
              <p>All rows will be exported. You cannot select individual rows for a CSV export.</p>
            </div>
          </div>
        }
        {/*<div className="row">*/}
          {/*<div className="col-xs-12">*/}
            {/*<RadioButtonGroup*/}
              {/*field={activeRecord.get('exportSelectedColumns')}*/}
              {/*onChange={onCollectionPropChange}*/}
            {/*/>*/}
          {/*</div>*/}
        {/*</div>*/}
        {R.isNil(activeRecord) ? null :
          <div className="row">
            <div className="col-xs-12">
              <RadioButtonGroup
                field={activeRecord.get('exportAllFields')}
                onChange={onCollectionPropChange}
              />
            </div>
          </div>
        }
        {R.isNil(activeRecord) ? null :
          <div className="row">
            <div className="col-xs-12">
              <RadioButtonGroup
                field={activeRecord.get('exportPageBreak')}
                onChange={onCollectionPropChange}
              />
            </div>
          </div>
        }
        {R.isNil(activeRecord) ? null :
          <div className="row">
            <div className="col-xs-12">
              <CheckBox
                field={activeRecord.get('exportShowIdField')}
                onChange={onCollectionPropChange}
                labelWrapperClassName="checkbox-inline margin-left-10"
                inputGroupContentClassName="input-group-content-no-padding"
              />
            </div>
          </div>
        }
        {!hasSelectedRows && !R.isNil(recordCount) && recordCount > 100 ?
          <div className="row margin-top-10">
            <div className="col-xs-12">
              <div className={"alert  alert-compact alert-callout alert-warning"} role="alert">
                There are more than 100 records in this export. Your export request will enter a queue and depending on demand may take several hours to complete.
              </div>
            </div>
          </div>
          :
          null
        }
        <div className="row margin-top-10">
          <div className="col-xs-12">
            <div className={"alert alert-callout alert-info no-margin"} role="alert">
              <span>You will receive an email when the export is ready for download.</span><br/>
              <span>The export will be available from the 'Export library'.</span>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}

ExportModal.displayName = "ExportModal";

/**
 * @ignore
 */
module.exports = ExportModal;
