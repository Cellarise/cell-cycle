import React from "react";
import R from 'ramda';
import Modal from 'cell-cycle/client/dialogs/modal.jsx';
import Form from 'cell-cycle/client/forms/form.jsx';
import SelectBox from 'cell-cycle/client/forms/selectBox.jsx';
import {getEventHandler, eventHandler} from 'cell-cycle/client/utils/viewUtils';

function ConditionRejectReasonModal({actions, store, modalId}) {
  const title = "conditonRejectReasonModal";
 // console.log( store.toJS());

  const activeRecordIndex = store.getIn(['props', 'conditionRejection', 'activeRecordIndex']);

  const conditionArray = store.getIn(['props', 'activity','activeRecord','condition','value']);
  const conditionsRecord = conditionArray[activeRecordIndex];

  const conditionRejectionField = store.getIn(['props', 'conditionRejection', 'activeRecord', 'conditionRejectReason']);

 // console.log(conditionsRecord, store.toJS());
  const onChange = getEventHandler(actions, store, 'onChangeConditionRejection');

  return (
    <div>
      <Modal
        id={modalId}
        title={"Condition accept/reject"}
        //validationConfig={validationConfig}
        actions={actions}
        passEventHandlersPropsToBody={false}
        draggable={true}
        size="medium"
        showApprove={true}
        showReject={true}
        showOk={false}
        approveText={"Reject"}
        rejectText={"Accept"}
        classNameApprove={"btn-danger btn-flat"}
        classNameReject={"btn-success btn-flat"}
        onApprove={(event, hide) => {
          //use reject handler
            eventHandler(actions, store, 'onConditionReject');
            hide();
        }}
        onReject={(event, hide) => {
          //use accept handler
          eventHandler(actions, store, 'onConditionAccept');
          hide();
        }}
      >
        <div className="container-fluid">
          <Form
            id={title + "-formWrapper"}
            name={title}
            renderForm={true}
          >
            {R.isNil(conditionsRecord) ? null :
              <div>
                  <div className="row">
                    <div className="col-xs-12 col-sm-12">
                        <SelectBox
                          field={conditionRejectionField}
                         onBlur={null}
                         onChange={onChange}
                        />
                    </div>
                  </div>
              </div>
            }
          </Form>
        </div>
      </Modal>
    </div>
  );
}

ConditionRejectReasonModal.displayName = "ConditionRejectReasonModal";

/**
 * @ignore
 */
module.exports = ConditionRejectReasonModal;
