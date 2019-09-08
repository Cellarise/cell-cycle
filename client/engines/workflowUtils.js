import React from 'react';
import R from 'ramda';
import Card from '../page/card.jsx';
import Button from '../forms/button.jsx';
import {TimelineTypeIcon, RenderActivityHeader, getWorkflowStateObj} from './engineUtils';
import getActivityNameFn from
    "../../../../common/scripts/workflowEngine/00-entry/permitApplication/04-02-workflow/_utils/getActivityName.js";
import {isCurrentRecordActive} from '../utils/viewUtils';


export function RenderActivities({store, activities, workflowRecords, onOpenActivity}) {
  const activitiesWithRepliesSorted = R.pipe(
    R.filter((activity) => (!R.contains(activity.systemType, ["Note"]))),
    R.reverse
  )(R.defaultTo([], activities));
  if (R.isNil(activitiesWithRepliesSorted) || activitiesWithRepliesSorted.length === 0) {
    return (
      <ul className="timeline collapse-lg">
        <div className={"alert alert-callout alert-info"} role="alert">
          No notifications
        </div>
      </ul>
    );
  }
  const unreadNotifications = R.filter(
    (activity) => (activity.__read !== true),
    activitiesWithRepliesSorted
  );
  const readNotifications = R.filter(
    (activity) => (activity.__read === true),
    activitiesWithRepliesSorted
  );
  return (
    <ul className="timeline collapse-lg">
      {
        unreadNotifications.length === 0 ? null : (
          R.addIndex(R.map)(
            (activity, idx) => {
              return renderActivity(store, activity, workflowRecords, idx, onOpenActivity);
            },
            unreadNotifications)
        )
      }
      {
        R.addIndex(R.map)(
          (activity, idx) => {
            return renderActivity(store, activity, workflowRecords, idx, onOpenActivity);
          },
          readNotifications)
      }
    </ul>
  );
}

function renderActivity(store, activity, workflowRecords, idx, onOpenActivity) {
  const workflowStateObj = getWorkflowStateObj(activity, workflowRecords);
  let activityName = getActivityNameFn(activity, workflowStateObj);
  const inNonUpdateMode = !isCurrentRecordActive(store);
  const commentHeader = (
    <div>
      <span className={activity.__read !== true ? "text-bold" : ""}>{activityName}</span><br/>
      <small>
        <RenderActivityHeader activity={activity} workflowStateObj={workflowStateObj}/>
      </small>
    </div>
  );

  return (
    <li className="timeline-inverted" key={idx}>
      <TimelineTypeIcon activity={activity}/>
      <div className="timeline-entry">
        <Card
          id={idx + name}
          name={name + "collapse"}
          header={commentHeader}
          classNameBody="no-padding"
          classNameHeader="style-default-bright card-head-sm-collapse"
          tools={
            <Button
              name="openActivity"
              className="btn-icon-toggle ink-reaction"
              disabled={inNonUpdateMode}
              label={<span className={activity.__read === true
                ? "glyphicon mdi-email-open-outline"
                : "glyphicon mdi-email"}/>}
              onClick={() => {
                onOpenActivity(activity);
              }}
              title={'Open task'}
              data-toggle="tooltip"
            />
          }
        >
        </Card>
      </div>
    </li>
  );
}

export function activityToJS(activityRecord) {
  return {
    "id": activityRecord.getIn(['id', 'value']),
    "systemType": activityRecord.getIn(['systemType', 'value']),
    "type": activityRecord.getIn(['type', 'value']),
    "name": activityRecord.getIn(['name', 'value']),
    "initiator": activityRecord.getIn(['initiator', 'value']),
    "recipient": activityRecord.getIn(['recipient', 'value']),
    "status": activityRecord.getIn(['status', 'value']),
    "permission": activityRecord.getIn(['permission', 'value']),
    "children": activityRecord.getIn(['children', 'value'])
  };
}


export function setPermission(initiator, recipient, visibility) {
  if (!R.isNil(visibility) && visibility === "Share with all") {
    return "Everyone";
  }
  if (!R.isNil(visibility) && visibility === "Road Managers Only") {
    return "Road Managers Only";
  }
  if (initiator === "Regulator" && recipient === "Regulator") {
    return "Regulator Only";
  }
  if (initiator === "Customer" && recipient === "Customer") {
    return "Customer Only";
  }
  if (initiator === "Road Manager" && recipient === "Road Manager") {
    return "Single Road Manager Only";
  }
  if (initiator === "Regulator" && recipient === "Customer"
    || initiator === "Customer" && recipient === "Regulator") {
    return "Customer Only";
  }
  if (initiator === "Regulator" && recipient === "Road Manager"
    || initiator === "Road Manager" && recipient === "Regulator") {
    return "Single Road Manager Only";
  }
  if (initiator === "Customer" && recipient === "Road Manager"
    || initiator === "Road Manager" && recipient === "Customer") {
    return "Customer - Single Road Manager Only";
  }
  return "Regulator Only";
}

export function getAccountFromAccountType(accountType) {
  if (accountType === "operations") {
    return "Regulator";
  }
  if (accountType === "partner") {
    return "Road Manager";
  }
  if (accountType === "customer") {
    return "Customer";
  }
  return "";
}
