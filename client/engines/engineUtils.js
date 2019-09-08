import React from 'react';
import R from 'ramda';
import moment from 'moment';
import classnames from 'classnames';
import DataTable from 'cell-cycle/client/dataTable/dataTable.jsx';
import Dropzone from "../widgets/dropzone.jsx";
import SelectBoxV2 from '../collection/selectBox.jsx';
import Button from '../forms/button.jsx';
import ConditionRejectReasonModal from 'cell-cycle/client/dialogs/conditionRejectReasonModal.jsx';

import {contactUserNameFormatter} from '../utils/contactHelpers';
import {accountNameFormatter} from '../utils/accountHelpers';
import {setWindowLocationHash} from '../libraries/router';
import {
  cleanFileName,
  fileIcon,
  getApiUrl,
  getDownloadUrl,
  getFileRecordId,
  toFilename,
  UserProfilePicture
} from '../utils/fileHelpers';
import {createMarkup, formattedDate, formattedDateTime, formattedDateTimeAMPM, randomNumber, sanitise} from '../utils';
import {numberToFileSize} from '../utils/numberHelpers';
import {currencyFormatter} from '../utils/paymentHelpers';
import {getLoggedInAccountTypeAndIdFromAuthenticationUI} from '../utils/authHelpers';
import {currentUrl} from '../globals';
import {getActiveRecord, getEventHandler, isCurrentRecordActive} from '../utils/viewUtils';
import * as dataTableDefaultRenderers from '../dataTable/dataTableDefaultRenderers';
import getActivityNameFn
  from "../../../../common/scripts/workflowEngine/00-entry/permitApplication/04-02-workflow/_utils/getActivityName.js";
import {$} from "cell-cycle/client/globals";
import Immutable from "immutable";
import {createSyntheticEvent} from "cell-cycle/client/utils/domDriverUtils";
import {eventHandler} from "cell-cycle/client/utils/viewUtils";
import {icon as ariaIcon} from "cell-cycle/client/libraries/accessibility";
import {fixedLength} from "cell-cycle/client/utils";

const FILE_PREFIXES = require("../../../../common/data/attachments.json").permitApplication.descriptions;
const attachmentExtentions =
  require("../../../../common/data/attachments.json").permitApplication.allowedFilenames.join(",");


export function getServiceName(store) {
  return R.defaultTo("permitApplication", store.getIn(['props', 'service']));
}

export function getActivityNameIM(activity, workflowRecords) {
  return getActivityName({
    "name": activity.getIn(['name', 'value']),
    "systemType": activity.getIn(['systemType', 'value']),
    "type": activity.getIn(['type', 'value']),
    "workflowState": activity.getIn(['workflowState', 'value']),
    "initiator": activity.getIn(['initiator', 'value']),
    "recipient": activity.getIn(['recipient', 'value']),
    "assignedToModel": activity.getIn(['userModelAssignedTo', 'value']),
    "workGroupId": activity.getIn(['workGroupId', 'value']),
    "modified": activity.getIn(['modified', 'value'])
  }, workflowRecords);
}

export function getActivityName(activity, workflowRecords) {
  const workflowStateObj = getWorkflowStateObj(activity, workflowRecords);
  return getActivityNameFn(activity, workflowStateObj);
}

export function getWorkflowStateObj(activity, workflowRecords) {
  const workflowState = activity.workflowState;
  const workflowStateObj = !R.isNil(workflowState) && !R.isNil(workflowRecords)
  && workflowState <= workflowRecords.length
    ? workflowRecords[workflowState - 1]
    : null;
  return workflowStateObj;
}

export function TimelineTypeIcon({activity, className}) {
  const _className = R.defaultTo("timeline-circ circ-xl style-primary", className);
  let timelineIcon;
  switch (activity.type) {
    case "Assignment":
      timelineIcon = "mdi-account";
      break;
    case "Permit Workflow":
    case "Workflow":
      timelineIcon = "mdi-chemical-weapon";
      break;
    case "Extension Of Time":
    case "Task":
      timelineIcon = "mdi-calendar-clock";
      break;
    case "Email":
      timelineIcon = "mdi-email";
      break;
    case "Phone":
      timelineIcon = "mdi-phone-classic";
      break;
    case "Permit Note":
    case "Note":
      timelineIcon = "mdi-note-text";
      break;
    case "Decision Request":
      timelineIcon = "mdi-clipboard-text";
      break;
    case "Information Request":
      timelineIcon = "mdi-message-text";
      break;
    default:
      timelineIcon = "mdi-leaf"
  }

  /* eslint-disable react/no-danger */
  return (
    <div className={_className}>
      <span className={"glyphicon " + timelineIcon}/>
    </div>
  );
}

function getUserModel(activity, index) {
  if (index > 0) {
    return activity.userModelModifiedBy;
  }
  return R.defaultTo(activity.userModelModifiedBy, activity.userModelModifiedBy0);
}

export function RenderReply({actions, store, activity, dateField, authenticationUI, record, index}) {
  const authenticationUIProps = authenticationUI.get('props');
  const accountType = getLoggedInAccountTypeAndIdFromAuthenticationUI(authenticationUI);
  const partnerAccountId = activity.partnerAccountId;
  const partnerAccount = R.defaultTo(
    {},
    R.find(
      eachPartner => (eachPartner.partnerAccountId === partnerAccountId),
      R.defaultTo([], record.getIn(['partnerConsent', 'value']))
    )
  );
  const partnerWorkflowState = R.isNil(partnerAccount) ? 0 :  partnerAccount.workflowState;
  const isUnderReview = partnerWorkflowState === 24;    // Response Rec'd - Under Review
  const isOperations = authenticationUIProps.get('operationsAccounts').size > 0;

  if (R.isNil(activity.notes) && !R.contains(activity.systemType, ["Decision", "DecisionConsent"])) {
    return null;
  }
  const userModel = getUserModel(activity, index);
  let contactAndAccountName = (
    <RenderContactAndAccount
      userModel={userModel}
      activity={activity}
      index={index}
    />
  );
  let infoReqIcons = (
    <small>
      <RenderActivityLabels
        activity={activity}
        index={index}
      />
    </small>
  );
  /* eslint-disable react/no-danger */
  return (
    <li className="timeline-inverted">
      <div className="timeline-circ circ-xl style-default">
        <UserProfilePicture
          fileList={userModel && userModel.fileList}
          size="medium"
        />
      </div>
      <div className="timeline-entry timeline-entry-indent">
        <header>
          <div>{contactAndAccountName} {infoReqIcons}</div>
          <div>
            <small>{formattedDateTimeAMPM(activity[R.defaultTo("modified", dateField)], "-")}</small>
          </div>
        </header>
        <p></p>
        <p dangerouslySetInnerHTML={createMarkup(activity.notes)}/>
        {renderJumpButton(record, activity, index)}
        {renderDecisionApprovalFields(record, activity, index)}
        {isOperations && isUnderReview && !R.isNil(store) ?
          renderDecisionApprovalConditionsTable(actions, store, record, activity, index, accountType)
          : renderDecisionApprovalConditions(record, activity, index, accountType)
        }
        {renderInfoReqFields(record, activity, index)}
        {renderAttachments(record, activity, authenticationUIProps)}
        <div className="col-xs-12 no-padding"><p></p></div>
      </div>
    </li>
  );
}

function renderJumpButton(record, activity, index) {
  if (activity.name !== "Vehicle information required" || index !== 0) {
    return null;
  }
  return (
    <Button
      name="onReturnToActivity"
      className="btn-sm btn-primary width-5"
      label="Update permit"
      onClick={() => {
        setWindowLocationHash({
          "page": "customer/accessPermits/permitLibrary/managePermit",
          "permitId": activity.permitApplicationId,
          "tab1": 3,
          "cache": randomNumber(999)
        });
      }}
      title="Click to view permit and update vehicle information."
      containerClassName="pull-right"
      data-toggle-tooltip="tooltip"
      data-placement="left"
    />
  );
}

function renderInfoReqFields(record, activity, index) {
  if (R.contains(activity.systemType, ["Change", "ChangeConsent"]) && index === 0) {
    return (
      <div className="application-summary">
        <div className="col-xs-4">
          <div className="row">
            <div id="changeRequestDate"
                 className="col-xs-12 summary-label">Extension request
            </div>
            <div aria-labelledby="changeRequestDate"
                 className="col-xs-12 summary-value">{formattedDate(activity.extendedDueDate)}</div>
          </div>
        </div>
        {R.isNil(activity.fee) || activity.fee === 0 ? null :
          <div className="col-xs-4">
            <div className="row">
              <div id="changeRequestFee"
                   className="col-xs-12 summary-label">Fee
              </div>
              <div aria-labelledby="changeRequestFee"
                   className="col-xs-12 summary-value">{currencyFormatter(activity.fee)}</div>
            </div>
          </div>
        }
      </div>
    );
  }
  if (index === 0) {
    const routeHistoryItem = R.find(
      R.propEq('id', R.defaultTo("", activity.routeId)),
      R.defaultTo([], record.getIn(['permitApplicationRouteAltId', 'records']))
    );
    if (R.isNil(routeHistoryItem) &&
      (R.isNil(activity.fee) || activity.fee === 0) &&
      (R.isNil(activity.assessmentType) || activity.assessmentType === "")) {
      return null;
    }
    return (
      <div className="application-summary">
        {R.isNil(routeHistoryItem) ? null :
          <div className="col-xs-12">
            <div className="row">
              <div id="infoRequestRouteLink"
                   className="col-xs-12 summary-label">Route version
              </div>
              <div aria-labelledby="infoRequestRouteLink"
                   className="col-xs-12 summary-value">
                {renderRouteHistorySelection(routeHistoryItem)}
              </div>
            </div>
          </div>
        }
        {R.isNil(activity.fee) || activity.fee === 0 ? null :
          <div className="col-xs-4">
            <div className="row">
              <div id="changeRequestFee"
                   className="col-xs-12 summary-label">Amount
              </div>
              <div aria-labelledby="changeRequestFee"
                   className="col-xs-12 summary-value">{currencyFormatter(activity.fee)}</div>
            </div>
          </div>
        }
        {R.isNil(activity.assessmentType) || activity.assessmentType === "" ? null :
          <div className="col-xs-4">
            <div className="row">
              <div id="changeRequestAssessmentType"
                   className="col-xs-12 summary-label">Assessment type
              </div>
              <div aria-labelledby="changeRequestAssessmentType"
                   className="col-xs-12 summary-value">{activity.assessmentType}</div>
            </div>
          </div>
        }
      </div>
    );
  }
  return null;
}

export function renderRouteHistorySelectionFromRecord(activeRecord) {
  if (R.isNil(activeRecord)) {
    return null;
  }
  const value = activeRecord.getIn(['permitApplicationRouteAltId', 'value']);
  const records = R.defaultTo([], activeRecord.getIn(['permitApplicationRouteAltId', 'records']));
  if (R.isNil(value) || value.length === 0 || records.length === 0) {
    return null;
  }
  //check for any Active
  const hasAnyActive = R.any(
    (altRoute) => (altRoute.status === "Active"),
    records
  );
  const suggestionObject = R.find(R.propEq("id", value), records);
  if (R.isNil(suggestionObject)) {
    return null;
  }
  return renderRouteHistorySelection(suggestionObject, hasAnyActive, true);
}

export function renderRouteHistorySelection(suggestionObject, hasAnyActive, disableCreatedBreak) {
  return (
    <span>
      <span className="text-bold">
        {(suggestionObject.status === "Submission" ? 'Original-' : 'Alternate-') + suggestionObject.version}
      </span>
      &nbsp;&nbsp;
      {dataTableDefaultRenderers.accountTypeLabel(
        R.defaultTo("customer", suggestionObject.accountType), suggestionObject.RMID
      )}
      &nbsp;&nbsp;
      {suggestionObject.status === "Active" || (suggestionObject.status === "Submission" && hasAnyActive === false) ?
        <span className={classnames("label", "label-default")}>Current active</span> : null
      }
      {suggestionObject.status === "Last used" ?
        <span className={classnames("label", "label-default")}>Replaced</span> : null
      }
      &nbsp;&nbsp;
      {disableCreatedBreak === true ? null :
        <br/>
      }
      <span className="text-sm">
        {'Created ' + formattedDateTime(suggestionObject.created) + ''}
      </span>
    </span>
  );
}

function renderDecisionApprovalFields(record, activity, index) {
  if (!R.contains(activity.systemType, ["Decision", "DecisionConsent"])) {
    return null;
  }
  if (R.contains(activity.type, ["Approval", "Approval With Conditions"])
    && index === 0
    && R.isNil(activity.vehicleStandardApplicationId)) {
    return (
      <div className="application-summary">
        <div className="col-xs-3">
          <div className="row">
            <div id="approvalPeriodFrom"
                 className="col-xs-12 summary-label">Period from
            </div>
            <div aria-labelledby="approvalPeriodFrom"
                 className="col-xs-12 summary-value">{formattedDate(activity.periodFrom)}</div>
          </div>
        </div>
        <div className="col-xs-3">
          <div className="row">
            <div id="approvalPeriodTo"
                 className="col-xs-12 summary-label">Period to
            </div>
            <div aria-labelledby="approvalPeriodTo"
                 className="col-xs-12 summary-value">{formattedDate(activity.periodTo)}</div>
          </div>
        </div>
        <div className="col-xs-6">
          <div className="row">
            <div id="approvalGazettePreapprove"
                 className="col-xs-12 summary-label">Gazzette or pre-approve route
            </div>
            <div aria-labelledby="approvalGazettePreapprove"
                 className="col-xs-12 summary-value">
              {R.isNil(activity.nominateRoute) ? "No" : activity.nominateRoute}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

function renderDecisionApprovalConditions(record, activity, index, accountType) {
  if (!R.contains(activity.systemType, ["Decision", "DecisionConsent"]) ||
    !R.contains(activity.type, ["Approval With Conditions", "Refusal"])) {
    return null;
  }
  return (
    <div>
      {R.isNil(activity.condition) || activity.condition.length === 0 || index !== 0 ? null :
        <div className="col-xs-12 no-padding">
          <div className="row">
            <div className="col-xs-12">
              <div className="row">
                <div className="col-xs-12">
                  <p></p>
                  <span
                    className="text-primary-dark">Conditions</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xs-12">
            <div className="row">
              <RenderConditionList
                conditions={activity.condition}
                accountType={accountType}
              />
            </div>
            <p></p>
          </div>
        </div>
      }
      {index === 0
        ? renderRefusedRoadList(activity)
        : null
      }
    </div>
  );
}

function renderDecisionApprovalConditionsTable(actions, store, record, activity, index) {
  if (!R.contains(activity.systemType, ["Decision", "DecisionConsent"]) ||
    !R.contains(activity.type, ["Approval With Conditions", "Refusal"])) {
    return null;
  }

  const hasSupervisor = store.getIn(['props', 'activity', 'hasSupervisor']);
  const canEdit = store.getIn(['props', 'activity', 'canEdit']);
  const conditions = store.getIn(['props', 'activity', 'activeRecord', 'condition', 'value']);
  const collection = Immutable.fromJS({
    "records": null,
    "selectedAll": false
  }).set('records', conditions);


  const embeddedPath = ['condition', 'value'];

  // Table model
  let tableModel = [
    {
      "columnHeader": "Group",
      "column": "group",
      "sortable": false,
      "embeddedPath": embeddedPath,
      "renderer": dataTableDefaultRenderers.string,
      "actions": actions,
      "width": 10
    },
    {
      "columnHeader": "Code",
      "column": "code",
      "sortable": false,
      "embeddedPath": embeddedPath,
      "renderer": dataTableDefaultRenderers.string,
      "actions": actions,
      "width": 10
    },
    {
      "columnHeader": "Condition",
      "column": "name",
      "sortable": false,
      "embeddedPath": embeddedPath,
      "renderer": (props) => {
        const item = R.defaultTo({}, props.item);
        const text = R.defaultTo("", item.name);
        return (
          <span>
            {R.isNil(item.permitPartnerConditionId) || item.status !== "Draft" ? null :
              <span><span className="label label-default">Custom condition - pending approval </span>&nbsp;</span>
            }
            {R.isNil(item.permitPartnerConditionId) || item.status !== "Pre-approval" ? null :
              <span><span className="label label-primary">Pre-approval condition</span>&nbsp;</span>
            }
            {R.isNil(item.permitPartnerConditionId) || item.status !== "Active" ? null :
              <span><span className="label label-primary">Custom condition</span>&nbsp;</span>
            }
          <span
            title={text}
            data-toggle="tooltip"
            data-placement="top"
            className={classnames(props.className, "white-space: unset;")}>{text}</span>
          </span>
        );
      },
      "actions": actions,
      "width": 170
    },
    {
      "columnHeader": "Accept/reject",
      "column": "accept",
      "sortable": false,
      "embeddedPath": embeddedPath,
      "renderer": function customRenderer(props) {
        return getAcceptRefuseCondition(props.item);
      },
      "actions": actions,
      "width": 52
    }
  ];
  if (canEdit) {
    tableModel.push({
      "columnHeader": "Update",
      "column": "update",
      "sortable": false,
      "embeddedPath": embeddedPath,
      "renderer": function customRenderer(props) {
        var label = "Update", iconClass = "glyphicon mdi-pencil";
        const icon = <span className={classnames("glyphicon", iconClass)}/>;
        if (!R.isNil(props.item.policyId)) {
          return null;
        }
        if (props.item.status === "Draft" && !hasSupervisor) {
          return null;
        }
        return (
          <Button
            key={label}
            name={label}
            label={icon}
            title={label}
            className={"btn-xs btn-icon-toggle btn-primary"}
            onClick={() => {
              eventHandler(
                actions, store, 'onConditionSelect',
                createSyntheticEvent('rejectCondition', props.rowKey, null, null, props.item)
              );
              $("#conditionRejectReasonModal").modal('show');
            }}
          />
        );
      },
      "actions": actions,
      "width": 10
    })
  }

  return (
    <div>
      {R.isNil(conditions) || conditions.length === 0 || index !== 0 ? null :
        <div className="col-xs-12 no-padding">
          <div className="row">
            <div className="col-xs-12">
              <div className="row">
                <div className="col-xs-12">
                  <p></p>
                  <span
                    className="text-primary-dark">Conditions</span>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xs-12">
            <ConditionRejectReasonModal
              modalId="conditionRejectReasonModal"
              store={store}
              actions={actions}
            />
            <DataTable
              title="Conditions List"
              tableModel={tableModel}
              tableHeight={10}
              collection={collection}
              customAction={null}
              showToolbar={false}
              showFooter={false}
              showNewRow={false}
              cellAlign="top"
              filterValue={index}
            />
          </div>
        </div>
      }
      {index === 0
        ? renderRefusedRoadList(activity)
        : null
      }
    </div>
  );
}

function getAcceptRefuseCondition(condition) {
  const boolValue = condition.accept;
  //var displayStatus;
  let iconLabel = "", iconClass = "glyphicon mdi-none";
  if (R.isNil(boolValue) || boolValue === "" || boolValue) {
    iconLabel = "Yes";
    iconClass = "glyphicon mdi-checkbox-marked-circle-outline text-success";
  } else {
    iconClass = "glyphicon mdi-close-circle-outline text-danger";
  }
  const text = R.defaultTo("", condition.rejectReason);

  if (!R.isNil(condition.policyId)) {
    return (
      <small>
        <small className="label label-default">{"Pre-approval " + condition.policyId}</small>
      </small>
    );
  }

  return (
    <span
      aria-label={ariaIcon(iconLabel)}
      className={classnames("no-linebreak")}
      title={text}
      data-toggle="tooltip"
      data-placement="top">
            <span className={iconClass}/>
      {" " + fixedLength(text, 60)}
          </span>
  );
}

function renderRefusedRoadList(activity) {
  const roads = activity.road;
  if (R.isNil(roads) || !R.contains(activity.type, ["Refusal", "Approval With Conditions"])) {
    return null;
  }
  const refusedRoads = R.filter(R.propEq("refused", true), R.defaultTo([], roads));
  if (refusedRoads.length === 0) {
    return null;
  }
  return (
    <div className="col-xs-12 no-padding">
      <div className="row">
        <div className="col-xs-12">
          <div className="row">
            <div className="col-xs-12">
              <p></p>
              <span
                className="text-primary-dark">Refused roads</span>
            </div>
          </div>
        </div>
      </div>
      <div className="col-xs-12">
        <div className="row">
          <div>
            <div className="row">
              <div className="col-sm-12">
                <div className="row">
                  <div className="col-xs-1"><span><small className="text-bold">Status</small></span></div>
                  <div className="col-xs-3"><span><small className="text-bold">Road name</small></span></div>
                  <div className="col-xs-5"><span><small className="text-bold">Notes</small></span></div>
                  <div className="col-xs-3"><span><small className="text-bold">Refusal reason type</small></span></div>
                </div>
              </div>
            </div>
            {R.addIndex(R.map)(
              (road, idx) => {
                return (
                  <div key={idx} className="row">
                    <div className="col-sm-12">
                      <div className="row">
                        <div className="col-xs-1">
                          <small><RoadStatusConsent item={road}/></small>
                        </div>
                        <div className="col-xs-3">
                          <small>{
                            (R.isNil(road.nameChange) ? road.name : road.nameChange + " [" + road.name + "]") +
                            (R.isNil(road.alias) || road.alias === "" ? "" : " (" + road.alias + ")")
                          }</small>
                        </div>
                        <div className="col-xs-5">
                          <small>{road.notes}</small>
                        </div>
                        <div className="col-xs-3">
                          <small>{road.refusalReason}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              },
              refusedRoads
            )}
          </div>
        </div>
        <p></p>
      </div>
    </div>
  );
}


export function RoadStatus({item}) {
  let hasNotes = !R.isNil(item.notes) && !R.isNil(item.modified);

  if (item.status === "Submitted") {
    if (item.refused === true) {
      return (
        <p className="label label-danger"
           title="Road refused"
           data-toggle="tooltip"
           data-placement="top"
        >
          <span className="glyphicon mdi-close-box"> </span>
          {hasNotes ? <span className="glyphiconSuperScript mdi-note-text"/> : null}
          <span className="sr-only">Road refused</span>
        </p>
      );
    } else if (item.approved === true) {
      return (
        <p className="label label-success"
           title="Road approved"
           data-toggle="tooltip"
           data-placement="top"
        >
          <span className="glyphicon mdi-checkbox-marked"> </span>
          {hasNotes ? <span className="glyphiconSuperScript mdi-note-text"/> : null}
          <span className="sr-only">Road approved</span>
        </p>
      );
    }
    return (
      <p className="label label-default"
         title="Road has been submitted for consent"
         data-toggle="tooltip"
         data-placement="top"
      >
        <span className="glyphicon mdi-checkbox-blank"> </span>
        {hasNotes ? <span className="glyphiconSuperScript mdi-note-text"/> : null}
        <span className="sr-only">Road has been submitted for consent</span>
      </p>
    );
  } else if (item.status === "Remove") {
    return (
      <p className="label label-danger"
         title="Road marked for removal"
         data-toggle="tooltip"
         data-placement="top"
      >
        <span className="glyphicon mdi-minus-box"> </span>
        {hasNotes ? <span className="glyphiconSuperScript mdi-note-text"/> : null}
        <span className="sr-only">Road marked for removal</span>
      </p>
    );
  }
  return (
    <p className="label label-default"
       title="Road marked for addition"
       data-toggle="tooltip"
       data-placement="top"
    >
      <span className="glyphicon mdi-plus-box"> </span>
      {hasNotes ? <span className="glyphiconSuperScript mdi-note-text"/> : null}
      <span className="sr-only">Road marked for addition</span>
    </p>
  );
}



export function RoadStatusConsent({item}) {
  let hasNotes = !R.isNil(item.notes) && !R.isNil(item.modified);

  if (item.refused === true) {
    return (
      <p className="label label-danger"
         title="Road marked for refusal"
         data-toggle="tooltip"
         data-placement="top"
      >
        <span className="glyphicon mdi-close-box"> </span>
        {hasNotes ? <span className="glyphiconSuperScript mdi-note-text"/> : null}
        <span className="sr-only">Road marked for refusal</span>
      </p>
    );
  }
  return (
    <p className="label label-success"
       title="Road approved for consent"
       data-toggle="tooltip"
       data-placement="top"
    >
      <span className="glyphicon mdi-checkbox-marked"> </span>
      {hasNotes ? <span className="glyphiconSuperScript mdi-note-text"/> : null}
      <span className="sr-only">Road approved for consent</span>
    </p>
  );
}

export function RoadName({item}) {
  const text = item.name +
    (R.isNil(item.alias) || item.alias === "" || item.alias === item.name
      ? ""
      : " (" + item.alias + ")") +
    (R.isNil(item.nameChange) || item.nameChange === "" || item.nameChange === item.name
      ? ""
      : " [" + item.nameChange + "]");
  return (
    <span
      className="yes-linebreak"
      title={sanitise(text)}
      data-toggle="tooltip"
      data-placement="top">{text}</span>
  );
}

export function RenderConditionList({conditions, accountType}) {
  return (
    <div>
      <div className="row">
        <div className="col-sm-12">
          <div className="row">
            <div className="col-xs-1"><span><small className="text-bold">Group</small></span></div>
            <div className="col-xs-1"><span><small className="text-bold">Code</small></span></div>
            <div className="col-xs-10"><span><small className="text-bold">Condition</small></span></div>
          </div>
        </div>
      </div>
      {R.addIndex(R.map)(
        (condition, idx) => {
          return (
            <div key={idx} className="row">
              <div className="col-sm-12">
                <div className="row">
                  <div className="col-xs-1"><span>{condition.group}</span></div>
                  <div className="col-xs-1"><span>{condition.code}</span></div>
                  <div className="col-xs-10">

                    {R.isNil(condition.policyId) || accountType === "customer" ?
                      <span>{condition.name}</span>
                      :
                      <a href={(accountType === "partner" ?
                        "/#page=partner/accessPermits/conditionManagement/policyLibrary/viewPolicy&permitSchemeId=" :
                        "/#page=regulator/admin/conditionManagement/policyLibrary/viewPolicy&permitSchemeId=") +
                      condition.policyId}
                         target="_blank"
                         rel="noopener noreferrer">
                        <span>{condition.name}</span>
                        &nbsp;
                        <small><small className="label label-default">{"Pre-approval " + condition.policyId}</small></small>
                        &nbsp;
                        <span className="glyphicon mdi-open-in-new"></span>
                      </a>
                    }
                    {condition.accept === false ? <span><br/>{getAcceptRefuseCondition(condition)}</span> : null}
                  </div>
                </div>
              </div>
            </div>
          );
        },
        R.defaultTo([], conditions)
      )}
    </div>
  );
}

export function RenderRoadList({roads, accountType}) {
  return (
    <div>
      <div className="row">
        <div className="col-sm-12">
          <div className="row">
            <div className="col-xs-1"><span><small className="text-bold">Status</small></span></div>
            <div className="col-xs-3"><span><small className="text-bold">Road name</small></span></div>
            <div className="col-xs-3"><span><small className="text-bold">Road Manager</small></span></div>
            <div className="col-xs-5"><span><small className="text-bold">Notes</small></span></div>
          </div>
        </div>
      </div>
      {R.addIndex(R.map)(
        (road, idx) => {
          return (
            <div key={idx} className="row">
              <div className="col-sm-12">
                <div className="row">
                  <div className="col-xs-1">
                    <small><RoadStatus item={road}/></small>
                  </div>
                  <div className="col-xs-3">
                    <small>{
                      (R.isNil(road.nameChange) ? road.name : road.nameChange + " [" + road.name + "]") +
                      (R.isNil(road.alias) || road.alias === "" ? "" : " (" + road.alias + ")")
                    }</small>
                  </div>
                  <div className="col-xs-3">
                    {R.contains(accountType, ["operations", "partner"]) && !R.isNil(road.policy) ?
                      <a href={(accountType === "partner" ?
                        "/#page=partner/accessPermits/conditionManagement/policyLibrary/viewPolicy&permitSchemeId=" :
                        "/#page=regulator/admin/conditionManagement/policyLibrary/viewPolicy&permitSchemeId=") +
                      road.policy}
                         target="_blank"
                         rel="noopener noreferrer">
                        <span>
                          <small>{renderRoadStatus(road)}</small>
                          &nbsp;
                          <span className="glyphicon mdi-open-in-new"></span>
                          {road._policyInvalid !== true ? null :
                            <span className="glyphicon mdi-message-reply-text text-danger"
                                  title={"Pre-approval is not current"}
                                  data-toggle="tooltip"
                                  data-placement="top"></span>}
                        </span>
                      </a>
                      :
                      <small>{renderRoadStatus(road)}</small>
                    }
                  </div>
                  <div className="col-xs-5">
                    <small>{renderRoadNotes(road)}</small>
                  </div>
                </div>
              </div>
            </div>
          );
        },
        R.defaultTo([], roads)
      )}
    </div>
  );
}

function renderRoadStatus(road) {
  // let roadNotes = "";
  if (road.approved === true) {
    return road.RMID + " - Approved";
  } else if (road.refused === true) {
    return road.RMID + " - Refused";
  }

  return road.RMID + " - " + road.approvalType;
}

function renderRoadNotes(road) {
  let roadNotes = "";
  if (!R.isNil(road.refused) && !R.isNil(road.refusalReason)) {
    roadNotes = "Refusal reason: " + road.refusalReason + ". ";
  } else if (!R.isNil(road.preApprovalId) &&
    !R.isNil(road.preApprovalStart) && !R.isNil(road.preApprovalExpiry) && !R.isNil(road.maxConsentDuration)) {
    roadNotes = "Preapproval " + road.preApprovalId
      + ": started " + formattedDate(road.preApprovalStart, "")
      + " expiring " + formattedDate(road.preApprovalExpiry, "")
      + "  - max consent duration " + road.maxConsentDuration + " months. ";
  }
  if (!R.isNil(road.notes)) {
    if (roadNotes.length === 0) {
      return road.notes;
    }
  }
  return roadNotes + "\n" + R.defaultTo("", road.notes);
}

export function RenderFileReference({
                                      activityRecord, store, actions, authenticationUI,
                                      accountType, name, showFileUpload, modalBased
                                    }) {
  const record = getActiveRecord(store);
  const fileList = getFileListWithFileNames(record, accountType);
  const fileField = activityRecord
    .get('fileAttachments')
    .set('storeId', store.getIn(["records", 0, "name", "storeId"]));
  const consentRecord = store.getIn(["props", "consent", "activeRecord"]);
  let partnerAccount;
  if (!R.isNil(consentRecord)) {
    partnerAccount = consentRecord.getIn(["partnerAccount", "value"]);
  }

  return (
    <div>
      <div className={modalBased ? "" : "row"}>
        <div className="col-xs-8 col-sm-9">
          <SelectBoxV2
            field={fileField}
            actions={actions}
            records={fileList}
            disabled={fileList.length === 0}
            autoAddNewRecord={true}
            idFieldName="name"
            displayFieldName="fileName"
            boxType="multiSelect"
            onChangeTempId="onChangeTempActivity"
            onBlurId="onBlurActivity"
            onChangeId="onChangeActivity"
            addonBefore={<span className="glyphicon mdi-file mdi-lg"/>}
          />
        </div>
        <div className="col-xs-4 col-sm-3" style={{marginTop: '10px'}}>
          {
            renderDropzone(store, actions, authenticationUI, record, accountType, name,
              showFileUpload, partnerAccount)
          }
        </div>
      </div>
    </div>
  );
}

function renderAttachments(record, activity, authenticationUIProps) {
  const fileList = record.getIn(['fileList', 'value']);
  const fileAttachments = activity.fileAttachments;
  const accessToken = authenticationUIProps.getIn(['access_token', 'id']);

  if (R.isNil(fileList) || fileList.length === 0 || R.isNil(fileAttachments) || fileAttachments.length === 0) {
    return null;
  }

  const fileAttachmentReferences = R.addIndex(R.map)(
    (fileAttachmentName, idx) => {
      return (<RenderAttachment
        key={idx}
        record={record}
        fileAttachmentName={fileAttachmentName}
        fileList={fileList}
        accessToken={accessToken}
      />);
    },
    fileAttachments
  );
  return (
    <div>
      <small>Referenced files</small>
      {fileAttachmentReferences}
      <p></p>
      <p></p>
    </div>
  );
}

function RenderAttachment({record, fileAttachmentName, fileList, accessToken}) {
  //find file by filename in fileList
  const modelId = record.getIn(['id', 'value']);
  const file = R.find(R.propEq("name", fileAttachmentName), fileList);
  if (R.isNil(file)) {
    return null;
  }
  let filePrefix;
  let fileName;

  for (let prefix in FILE_PREFIXES) {
    if (file.name && file.name.startsWith(prefix)) {
      filePrefix = prefix;
      fileName = toFilename(prefix, file, null);
      continue;
    }
  }
  let serverModel = "PermitApplication";
  if (file.container === "permit") {
    serverModel = "Permit";
  }
  if (file.container === "vehiclestandard-application") {
    serverModel = "VehicleStandardApplication";
  }
  if (file.container === "vehiclestandard") {
    serverModel = "VehicleStandard";
  }
  if (file.container === "accreditation-application") {
    serverModel = "AccreditationApplication";
  }
  if (file.container === "accreditation") {
    serverModel = "Accreditation";
  }
  const fileModelId = getFileRecordId(filePrefix, file, modelId);
  const href = getDownloadUrl(
    serverModel,
    accessToken,
    fileModelId,
    filePrefix,
    "customerAccountId",
    record.getIn(['customerAccountId', 'value'])) + "&fileName=" + cleanFileName(fileName);
  return (
    <div className="row">
      <div className="tbl-xs-60p tbl-sm-60p wrap">
        <a className="hidden-print" href={href} target="_blank" rel="noopener noreferrer">
          {fileIcon(fileName, "small")}&nbsp;{fileName}
        </a>
        <a className="visible-print-inline" href={currentUrl} target="_blank" rel="noopener noreferrer">
          {fileIcon(fileName, "small")}&nbsp;{fileName}
        </a>&nbsp;
        <small
          className="tbl-xs-20p tbl-sm-20p">{numberToFileSize(file.size)}</small>
      </div>
    </div>
  );
}

export function getFileListWithFileNames(record, accountType) {
  //prevent users selecting files which were not uploaded by their current accountType
  return R.pipe(
    R.filter(
      (file) => {
        if (accountType === "operations") {
          return true;
        }
        if (R.isNil(file.name) || file.name === "") {
          return false;
        }
        if (file.name.startsWith("operations")) {
          return false;
        }
        if (accountType === "customer" && file.name.startsWith("partner")) {
          return false;
        }
        return true;
      }),
    R.map(
      (file) => {
        let fileName;
        for (let prefix in FILE_PREFIXES) {
          if (file.name && file.name.startsWith(prefix)) {
            fileName = toFilename(prefix, file, record.getIn(['id', 'value']));
            continue;
          }
        }
        file.fileName = fileName;
        return file;
      }
    )
  )(R.defaultTo([], record.getIn(['fileList', 'value'])));
}


export function renderDropzone(store, actions, authenticationUI, activeRecord, accountType, name, s, partnerAccount) {
  const authenticationUIProps = authenticationUI.get('props');
  //@todo review attachment security linked to customerAccountId
  const accountIdField = "customerAccountId";
  const accountId = activeRecord.getIn([accountIdField, 'value']);
  const serverModel = store.getIn(['serverModel', 'name']);
  const prefix = accountType;

  return (
    <Dropzone
      acceptedFiles={attachmentExtentions}
      maxFilesize={21}
      id={"attachments" + prefix + name}
      type="buttonOnly"
      uploadUrl={
        getApiUrl(
          serverModel,
          "upload",
          [
            accountIdField + "=" + accountId,
            "id=" + activeRecord.getIn(['id', 'value']),
            "prefix=" + prefix,
            "fileName=.doc"
          ]
        )
      }
      title="Add files"
      titleSingular="attachments"
      accountId={accountId}
      partnerAccount={partnerAccount}
      prefix={prefix}
      accountIdField={accountIdField}
      store={store}
      actions={actions}
      field={activeRecord.get('fileList')}
      removeFile={getEventHandler(actions, store, "removeFile")}
      onContainerRefresh={getEventHandler(actions, store, "onContainerRefresh")}
      onContainerPropChange={getEventHandler(actions, store, "onContainerPropChange")}
      authenticationUIProps={authenticationUIProps}
      getSessionTokens={getEventHandler(actions, authenticationUI, "getSessionTokens")}
      showFiles={false}
      dictDefaultMessage=""
      classNameAddFile="btn-primary btn-flat"
    />
  );
}


export function RenderActivityCommentsHeader({activity, workflowRecords, showCreatedDate, tableModel, enableUnread, onToggleReadReceipt}) {
  const workflowStateObj = getWorkflowStateObj(activity, workflowRecords);
  let activityName = getActivityNameFn(activity, workflowStateObj);
  const activityReplies = R.defaultTo([], activity.children);
  const numberOfRepliesIncludingInitialNote =
    R.filter((activity) => (!R.isNil(activity.notes)), activityReplies).length
    + (R.isNil(activity.notes) ? 0 : 1);

  let lastUpdated;
  if (R.isNil(activity.userModelModifiedBy)) {
    lastUpdated = "-";
  } else {
    lastUpdated = moment(activity.modified).fromNow();
  }
  let created;
  if (R.isNil(activity.userModelModifiedBy)) {
    created = "-";
  } else {
    created = formattedDateTimeAMPM(activity.created);
  }
  /*
   * TABLE ROW
   */
  if (tableModel) {
    return renderTableRow(
      created, lastUpdated, workflowRecords, tableModel, activity, null, onToggleReadReceipt, workflowStateObj
    );
  }
  return (
    <div>
      <div><span className={enableUnread === true && activity.__read === false ? "text-bold" : ""}>
        {activityName}
      </span></div>
      <div>
        <small>
          <RenderActivityHeader activity={activity} workflowStateObj={workflowStateObj}/>
        </small>
        {
          renderCommentsLine(activity, numberOfRepliesIncludingInitialNote, created, lastUpdated, showCreatedDate)
        }
      </div>
    </div>
  );
}


export function RenderConsentHeader({partnerConsent, workflowRecords, tableModel, decisions}) {
  return renderTableRow(
    null, null, workflowRecords, tableModel, partnerConsent, decisions
  );
}


export function RenderTimelineTable(props) {
  const {tableModel, records, RowRenderer, emptyScreen, activity, ...otherProps} = props;
  return (
    <div className="timeline-table">
      <div className="col-xs-12 timeline-table-header">
        {R.addIndex(R.map)(
          (tableModelCol, idx) => {
            return (
              <div key={idx} className={tableModelCol.classNameColumn}><span>{tableModelCol.columnHeader}</span></div>
            );
          },
          tableModel
        )}
      </div>
      {R.isNil(records) || records.length === 0
        ? emptyScreen
        : <div className="col-xs-12 timeline-table-row">
          {R.map(
            (item) => {
              let filteredActivities = [];
              if (!R.isNil(activity)) {
                filteredActivities = R.filter(
                  (_activity) => (
                    _activity.partnerConsentId === item.id
                  ),
                  activity
                );
              }
              return <RowRenderer
                key={item.id}
                item={item}
                tableModel={tableModel}
                filteredActivities={filteredActivities}
                {...otherProps}
              />;
            },
            records)
          }
        </div>
      }
    </div>
  )
}

export function renderTableRow(created, lastUpdated, workflowRecords,
                               tableModel, item, filteredActivities, onToggleReadReceipt, workflowStateObj) {
  let className = "";
  if (workflowStateObj && (workflowStateObj.close === true || workflowStateObj.decision === true)) {
    className = "text-primary-dark text-bold";
  } else if (item.__read === false) {
    className = "text-bold";
  } else if (!R.isNil(item.closeDate)) {
    className = "text-bold text-danger";
  } else if (!R.isNil(item.reminderDate)) {
    className = "text-bold";
  }
  return (
    <div className={className}>
      {R.map((tableModelCol) => {
        return renderTableRowCell(
          created, lastUpdated, workflowRecords, tableModelCol, item, filteredActivities, onToggleReadReceipt,
          workflowStateObj
        );
      }, tableModel)}
    </div>
  );
}

function renderTableRowCell(created, lastUpdated, workflowRecords,
                            tableModelCol, item, filteredActivities, onToggleReadReceipt, workflowStateObj) {
  let fieldValue, tableCellProps;
  if (tableModelCol.column === "partnerAccountName") {
    fieldValue = <span>{accountNameFormatter(R.isNil(item) ? item : item.partnerAccount, false, true)}</span>;
  } else if (tableModelCol.column === "workflowState") {
    fieldValue = <RenderWorkflowState item={item} workflowRecords={workflowRecords}/>;
  } else if (tableModelCol.column === "name") {
    fieldValue = <span>{getActivityName(item, workflowRecords)}</span>;
  } else if (tableModelCol.column === "type") {
    fieldValue = <TimelineTypeIcon activity={item} className="text-primary text-center"/>;
  } else if (tableModelCol.column === "__labels") {
    fieldValue = <RenderLabels activity={item}
                               onToggleReadReceipt={onToggleReadReceipt}
                               workflowStateObj={workflowStateObj}/>;
  } else if (tableModelCol.column === "__labelsAndCount") {
    fieldValue = <RenderLabels activity={item}
                               onToggleReadReceipt={onToggleReadReceipt}
                               count={R.filter((a) => (a.__read === false), filteredActivities).length}
                               workflowStateObj={workflowStateObj}/>;
  } else if (tableModelCol.column === "status") {
    fieldValue = <small><RenderActivityLabels activity={item}/></small>;
  } else if (tableModelCol.column !== "action") {
    tableCellProps = R.assoc("item", item, tableModelCol);
    fieldValue = dataTableDefaultRenderers[tableModelCol.renderer](tableCellProps);
  } else {
    fieldValue = null;
  }
  return (
    <div key={tableModelCol.column} className={tableModelCol.classNameColumn}>
      {fieldValue}
    </div>
  );
}


function renderCommentsLine(activity, numberOfRepliesIncludingInitialNote, created, lastUpdated, showCreatedDate) {
  if (R.contains(activity.systemType,
    ["Information", "InformationConsent", "Change", "ChangeConsent",
      "Decision", "DecisionConsent", "Task", "TaskConsent"])) {
    return (R.defaultTo(false, showCreatedDate) ?
      <small>
        {" Comments (" + numberOfRepliesIncludingInitialNote + ") - created " + created}
      </small>
      :
      <small>
        {" Comments (" + numberOfRepliesIncludingInitialNote + ") - updated " + lastUpdated}
      </small>);
  }
  return (R.defaultTo(false, showCreatedDate) ?
    <small>
      {" Created " + created}
    </small>
    :
    <small>
      {" Updated " + lastUpdated}
    </small>);
}

export function RenderActivityHeader({activity, workflowStateObj}) {
  if (R.contains(activity.systemType, ["Note", "NoteConsent"])) {
    return <RenderLabels activity={activity} workflowStateObj={workflowStateObj}/>;
  }
  let header;
  if (R.isNil(activity.dueDate) || R.contains(activity.status, ["Completed", "Cancelled", "Rejected"])) {
    header = "";
  } else {
    if (R.contains(activity.systemType, ["Task", "TaskConsent"])) {
      header = " Assigned to " +
        contactUserNameFormatter(R.defaultTo(activity.userModelAssignedTo, activity.userModelAssignedToKPI)) +
        " due " + moment(activity.dueDate).fromNow();
    } else {
      header = " Due " + moment(activity.dueDate).fromNow();
    }
  }
  return (
    <span>
      <RenderActivityLabels activity={activity}/>
      &nbsp;
      <RenderLabels activity={activity} workflowStateObj={workflowStateObj}/>
      {header}
    </span>
  );
}

function RenderLabels({activity, className, count, onToggleReadReceipt, workflowStateObj}) {
  const _className = R.defaultTo("text-primary", className);
  let attachmentLabel, visibilityLabel, readLabel, countLabel;

  if (!R.isNil(activity.closeDate)) {
    readLabel = (<span className="glyphicon mdi-clock mdi-lg text-danger"
                       title={"Final reminder sent"}
                       data-toggle="tooltip"
                       data-placement="top"></span>);
  } else if (!R.isNil(activity.reminderDate)) {
    readLabel = (<span className="glyphicon mdi-clock mdi-lg text-warning"
                       title={"Reminder sent"}
                       data-toggle="tooltip"
                       data-placement="top"></span>);
  } else if (activity.__readToggle === true) {
    if (activity.__read === true) {
      readLabel = (<span className="glyphicon mdi-email-open-outline"
                         title="Click to mark as unread"
                         onClick={onToggleReadReceipt}
                         data-toggle="tooltip"
                         data-placement="top"></span>);
    } else {
      readLabel = (<span className="glyphicon mdi-email"
                         title="Click to mark as read"
                         onClick={onToggleReadReceipt}
                         data-toggle="tooltip"
                         data-placement="top"></span>);
    }
  } else {
    readLabel = (<span></span>);
  }
  if (activity.visibility === "Share with all") {
    visibilityLabel = (<span className="glyphicon mdi-eye"
                             title="Visibility set to 'Share with all'"
                             data-toggle="tooltip"
                             data-placement="top"></span>);
  } else {
    visibilityLabel = (<span></span>);
  }
  if (activity.fileAttachments && activity.fileAttachments.length > 0) {
    attachmentLabel = (<span className="glyphicon mdi-paperclip"
                             title={"Referencing " + activity.fileAttachments.length + " files"}
                             data-toggle="tooltip"
                             data-placement="top"></span>);
  } else {
    attachmentLabel = (<span></span>);
  }
  if (workflowStateObj && workflowStateObj.decision === true && workflowStateObj.approval !== true) {
    attachmentLabel = (<span className="glyphicon mdi-message-reply-text text-danger"
                             title={"Notice of refusal"}
                             data-toggle="tooltip"
                             data-placement="top"></span>);
  }
  if (!R.isNil(count)) {
    countLabel = (<span className="label label-primary">{count}</span>);
  } else {
    countLabel = (<span></span>);
  }
  return (
    <span className={_className}>
      {readLabel}
      {countLabel}
      {visibilityLabel}
      {attachmentLabel}
    </span>
  )
}

export function RenderWorkflowState({item, workflowRecords}) {
  const _item = R.defaultTo({}, item);
  let workflowState = _item.workflowState;
  //if extended then override workflow state
  if (!R.isNil(workflowState) && R.contains(workflowState, [18, 19, 20, 22, 23]) && _item.extended === true) {
    workflowState = 22;
  }
  //if overdue then override workflow state
  if (!R.isNil(workflowState) && R.contains(workflowState, [18, 19, 20, 22, 23]) && _item.timeRemaining) {
    if (R.defaultTo(0, _item.timeRemaining) < 0) {
      workflowState = 23;
    }
    if (R.defaultTo(0, _item.timeRemaining) <= -56) {
      workflowState = 55;
    }
  }
  const workflowStateObj = !R.isNil(workflowState) && workflowRecords.length >= workflowState
    ? workflowRecords[workflowState - 1]
    : {};
  const className = "label label-" + R.defaultTo("default", workflowStateObj.style);
  return <span className={className}>{R.defaultTo("", workflowStateObj.name)}</span>;
}

//LARGE contact name on header of an activity with (account in brackets)
function RenderContactAndAccount({userModel, activity, index}) {
  const activityStatus = activity.status;
  const contactAndAccountName = contactUserNameFormatter(userModel);
  let customerContactAndAccountName = <span>{contactAndAccountName}</span>;
  let partnerContactAndAccountName = <span>{contactAndAccountName}</span>;
  let operationsContactAndAccountName = <span>{contactAndAccountName}</span>;
  if (!R.isNil(activity.customerAccount)) {
    customerContactAndAccountName =
      <span>{contactAndAccountName}
        <small>{" (" + activity.customerAccount.name + ")"}</small></span>;
  }
  if (!R.isNil(activity.partnerAccount)) {
    partnerContactAndAccountName =
      <span>{contactAndAccountName}
        <small>{" (" + activity.partnerAccount.name + ")"}</small></span>;
  }
  if (!R.isNil(activity.operationsAccount)) {
    operationsContactAndAccountName =
      <span>{contactAndAccountName}
        <small>{" (" + activity.operationsAccount.name + ")"}</small></span>;
  }

  if (R.contains(activity.systemType, ["Task", "TaskConsent"])) {
    return getByAccountType(activity.initiator, customerContactAndAccountName,
      partnerContactAndAccountName, operationsContactAndAccountName);
  }
  if (R.contains(activity.systemType,
    ["Information", "InformationConsent", "Change", "ChangeConsent", "Decision", "DecisionConsent"])) {
    if (R.contains(activityStatus, ["Request In Draft"])) {
      return getByAccountType(activity.initiator, customerContactAndAccountName,
        partnerContactAndAccountName, operationsContactAndAccountName);
    }
    if (R.contains(activityStatus, ["Request In Redraft"])) {
      return getByAccountType(activity.initiator, customerContactAndAccountName,
        partnerContactAndAccountName, operationsContactAndAccountName);
    }
    if (index === 0 || R.contains(activityStatus, ["Response With Initiator"])) {
      return getByAccountType(activity.initiator, customerContactAndAccountName,
        partnerContactAndAccountName, operationsContactAndAccountName);
    }
    if (R.contains(activityStatus, ["Request With Regulator"])) {
      return getByAccountType("Regulator", customerContactAndAccountName,
        partnerContactAndAccountName, operationsContactAndAccountName);
    }
    if (R.contains(activityStatus, ["Response Submitted"])) {
      return getByAccountType(activity.recipient, customerContactAndAccountName,
        partnerContactAndAccountName, operationsContactAndAccountName);
    }
    if (R.contains(activityStatus, ["Response With Regulator"])) {
      return getByAccountType("Regulator", customerContactAndAccountName,
        partnerContactAndAccountName, operationsContactAndAccountName);
    }
    if (R.contains(activityStatus, ["Completed"]) && activity.recipient === "Regulator") {
      return getByAccountType("Regulator", customerContactAndAccountName,
        partnerContactAndAccountName, operationsContactAndAccountName);
    }
    if (R.contains(activityStatus, ["Completed"]) && activity.recipient !== "Regulator") {
      return getByAccountType(activity.recipient, customerContactAndAccountName,
        partnerContactAndAccountName, operationsContactAndAccountName);
    }
    if (R.contains(activityStatus, ["Request Approved"])) {
      return getByAccountType("Regulator", customerContactAndAccountName,
        partnerContactAndAccountName, operationsContactAndAccountName);
    }
    if (R.contains(activityStatus, ["Request Rejected"])) {
      return getByAccountType("Regulator", customerContactAndAccountName,
        partnerContactAndAccountName, operationsContactAndAccountName);
    }
    if (R.contains(activityStatus, ["Response In Draft"])) {
      return getByAccountType(activity.recipient, customerContactAndAccountName,
        partnerContactAndAccountName, operationsContactAndAccountName);
    }
    if (R.contains(activityStatus, ["Response In Redraft"])) {
      return getByAccountType(activity.recipient, customerContactAndAccountName,
        partnerContactAndAccountName, operationsContactAndAccountName);
    }
    if (R.contains(activityStatus, ["Response Approved"])) {
      return getByAccountType("Regulator", customerContactAndAccountName,
        partnerContactAndAccountName, operationsContactAndAccountName);
    }
    if (R.contains(activityStatus, ["Response Rejected"])) {
      return getByAccountType("Regulator", customerContactAndAccountName,
        partnerContactAndAccountName, operationsContactAndAccountName);
    }
  }

  return getByAccountType(activity.initiator, customerContactAndAccountName,
    partnerContactAndAccountName, operationsContactAndAccountName);
}

function getByAccountType(accountType,
                          customerContactAndAccountName,
                          partnerContactAndAccountName,
                          operationsContactAndAccountName) {
  switch (accountType) {
    case "Customer":
      return customerContactAndAccountName;
    case "Road Manager":
      return partnerContactAndAccountName;
    default:
      return operationsContactAndAccountName;
  }
}

export function RenderActivityLabels({activity, index}) {
  const activityStatus = activity.status;
  const styleRegulatorReview = "label label-primary";
  const styleSubmitted = "label style-gray";
  const styleComplete = "label style-primary-dark";
  const styleCancelled = "label label-default";
  const styleInProgress = "label style-accent";
  const styleIssue = "label label-danger";
  if (R.contains(activity.systemType, ["Note", "NoteConsent"])) {
    return null;
  }
  if (R.contains(activity.systemType, ["Task", "TaskConsent"])) {
    if (R.contains(activityStatus, ["Request In Draft"])) {
      return <span className={styleInProgress}>{activityStatus}</span>;
    }
    if (R.contains(activityStatus, ["Request In Redraft"])) {
      return <span className={styleInProgress}>{activityStatus}</span>;
    }
    if (index === 0 || R.contains(activityStatus, ["Request Submitted"])) {
      return <span className={styleSubmitted}>{"Request Submitted"}</span>;
    }
    if (R.contains(activityStatus, ["Response With Initiator"])) {
      return <span className={styleRegulatorReview}>Reviewing Response</span>;
    }
    if (R.contains(activityStatus, ["Response Submitted"])) {
      return <span className={styleSubmitted}>{"Response Submitted"}</span>;
    }
    if (R.contains(activityStatus, ["Response In Draft"])) {
      return <span className={styleInProgress}>{activityStatus}</span>;
    }
    if (R.contains(activityStatus, ["Response In Redraft"])) {
      return <span className={styleInProgress}>{activityStatus}</span>;
    }
    if (R.contains(activityStatus, ["Response Approved"])) {
      return <span className={styleRegulatorReview}>Response Approved</span>;
    }
    if (R.contains(activityStatus, ["Response Rejected"])) {
      return <span className={styleIssue}>Response Rejected</span>;
    }
    if (R.contains(activityStatus, ["Completed"])) {
      return <span className={styleComplete}>Completed</span>;
    }
  }
  if (R.contains(activity.systemType,
    ["Information", "InformationConsent", "Change", "ChangeConsent", "Decision", "DecisionConsent"])) {
    if (R.contains(activityStatus, ["Request In Draft"])) {
      return <span className={styleInProgress}>{activity.initiator + " " + activityStatus}</span>;
    }
    if (R.contains(activityStatus, ["Request In Redraft"])) {
      return <span className={styleInProgress}>{activity.initiator + " " + activityStatus}</span>;
    }
    if (index === 0 || R.contains(activityStatus, ["Request Submitted"])) {
      return <span className={styleSubmitted}>{activity.initiator + " Request"}</span>;
    }
    if (R.contains(activityStatus, ["Request With Regulator"])) {
      return <span className={styleRegulatorReview}>Regulator Reviewing Request</span>;
    }
    if (R.contains(activityStatus, ["Response Submitted"])) {
      return <span className={styleSubmitted}>{activity.recipient + " Response"}</span>;
    }
    if (R.contains(activityStatus, ["Response With Regulator"])) {
      return <span className={styleRegulatorReview}>Regulator Reviewing Response</span>;
    }
    if (R.contains(activityStatus, ["Completed"])) {
      return <span className={styleComplete}>{activity.recipient + " Issued Response"}</span>;
    }
    if (R.isNil(index) && R.contains(activityStatus, ["Request Approved"]) && activity.initiator !== "Regulator") {
      return <span className={styleInProgress}>{"Request with " + activity.recipient}</span>;
    }
    if (R.contains(activityStatus, ["Request Approved"]) && activity.initiator === "Regulator") {
      return <span className={styleSubmitted}>Regulator Request</span>;
    }
    if (R.contains(activityStatus, ["Request Approved"]) && activity.initiator !== "Regulator") {
      return <span className={styleRegulatorReview}>Regulator Approved Request</span>;
    }
    if (R.contains(activityStatus, ["Request Rejected"])) {
      return <span className={styleIssue}>Regulator Rejected Request</span>;
    }
    if (R.contains(activityStatus, ["Response In Draft"])) {
      return <span className={styleInProgress}>{activity.recipient + " " + activityStatus}</span>;
    }
    if (R.contains(activityStatus, ["Response In Redraft"])) {
      return <span className={styleInProgress}>{activity.recipient + " " + activityStatus}</span>;
    }
    if (R.contains(activityStatus, ["Response Approved"])) {
      return <span className={styleRegulatorReview}>Regulator Approved Response</span>;
    }
    if (R.contains(activityStatus, ["Response Rejected"])) {
      return <span className={styleIssue}>Regulator Rejected Response</span>;
    }
  }
  if (R.contains(activity.status, ["New", "Draft"]) && !R.isNil(activity.dueDate)
    && moment(activity.dueDate).isBefore(new Date())) {
    return <span className={styleIssue}>Overdue</span>;
  }
  // if (activity.systemType === "Task" && R.contains(activity.status, ["New", "Draft", "In Progress"])) {
  //   return <span className={styleInProgress}>Open</span>;
  // }
  if (R.contains(activity.status, ["New", "Draft", "In Progress"])) {
    return <span className={styleInProgress}>{activity.status}</span>;
  }
  if (R.contains(activity.status, ["Completed"])) {
    return <span className={styleComplete}>{activity.status}</span>;
  }
  if (R.contains(activity.status, ["Cancelled"])) {
    return <span className={styleCancelled}>{activity.status}</span>;
  }
  if (R.contains(activity.status, ["Rejected"])) {
    return <span className={styleIssue}>{activity.status}</span>;
  }
  return <span className={styleCancelled}>{activity.status}</span>;
}

export function AddButton({
                            title, onClick, hide, warningText,
                            className, containerClassName, enableActionButtons
}) {
  let _warningText = R.defaultTo(true, enableActionButtons)
    ? warningText
    : R.defaultTo("Case in view only mode", warningText);
  if (hide === true) {
    return null;
  }

  if (!R.isNil(_warningText)) {
    return (
      <Button
        name={title}
        label={title}
        title={_warningText}
        data-toggle-tooltip="tooltip"
        data-placement="top"
        disabled={true}
        containerClassName={containerClassName}
        className={R.defaultTo("ink-reaction btn btn-default", className)}
      />
    );
  }
  return (
    <Button
      name={title}
      label={title}
      onClick={onClick}
      className={R.defaultTo("ink-reaction btn btn-default", className)}
    />
  )
}

export function actionButtonsEnabled(store, workflowState, workflowRecords) {
  const inNonUpdateMode = !isCurrentRecordActive(store);
  if (inNonUpdateMode) {
    return false;
  }
  return recordIsOpen(workflowState, workflowRecords);
}

export function recordIsOpen(workflowState, workflowRecords) {
  const _workflowState = R.defaultTo(1, workflowState);
  const workflowStateObj = workflowRecords.length >= _workflowState
    ? workflowRecords[_workflowState - 1]
    : {};
  return workflowStateObj.close !== true && workflowStateObj.decision !== true
    && workflowStateObj.newAction !== true && workflowStateObj.assignmentAction !== true;
}
