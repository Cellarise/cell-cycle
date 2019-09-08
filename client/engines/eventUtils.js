import React from 'react';
import R from 'ramda';
import Card from '../page/card.jsx';
import {formattedDateTimeAMPM} from '../utils';
import {TimelineTypeIcon} from './engineUtils';


export function RenderEvents({events, partnerConsent, workflowRecords}) {
  const eventsSorted = R.pipe(
    R.reverse
  )(R.defaultTo([], events));
  if (R.isNil(events) || events.length === 0) {
    return (
      <ul className="timeline event-timeline collapse-lg no-card-shadow">
        <div className={"alert alert-callout alert-info"} role="alert">
          No events
        </div>
      </ul>
    );
  }
  return (
    <ul className="timeline event-timeline collapse-lg no-card-shadow">
      {R.addIndex(R.map)(
        (event, idx) => {
          return renderEvent(event, partnerConsent, workflowRecords, idx)
        },
        eventsSorted
      )}
    </ul>
  );
}

function renderEvent(event, partnerConsent, workflowRecords, idx) {
  let eventMessage = getEventName(event, partnerConsent, workflowRecords);

  const commentHeader = (
    <div>
      <span className="">{eventMessage}</span><br/>
      <small>{formattedDateTimeAMPM(event.created)}</small>
    </div>
  );
  return (
    <li className="timeline-inverted" key={idx}>
      <TimelineTypeIcon activity={event} className="timeline-circ circ-lg style-primary"/>
      <div className="timeline-entry">
        <Card
          id={idx + "eventCard"}
          name={idx + "eventCard"}
          header={commentHeader}
          classNameBody="no-padding"
          classNameHeader="style-default-bright card-head-sm-event"
        />
      </div>
    </li>
  );
}

export function getEventName(event, partnerConsent, workflowRecords) {
  let eventMessage = event.name;
  let workflowRecord, previousWorkflowRecord;
  let caseOrConsentLabel = "";
  if (R.contains(event.systemType, ["Decision", "DecisionConsent"])) {
    return event.type + " " + event.actionType + "d";
  }
  switch (event.actionType) {
    case "workflow":
    case "complete":
      if (event.actionType === "complete" &&
        !R.contains(event.systemType,
          ["Workflow", "Information", "Change", "Decision",
            "WorkflowConsent", "InformationConsent", "ChangeConsent", "DecisionConsent"])) {
        break;
      }
      if (R.contains(event.systemType, ["Workflow", "Information", "Change", "Decision"])) {
        caseOrConsentLabel = "case";
      } else {
        caseOrConsentLabel = "consent";
      }
      if (R.isNil(event.previousWorkflowState)) {
        if (caseOrConsentLabel === "case") {
          eventMessage = "Permit application submitted";
        } else {
          eventMessage = "Consent request submitted";
        }
      } else {
        workflowRecord = !R.isNil(event.workflowState) && event.workflowState <= workflowRecords.length
          ? workflowRecords[event.workflowState - 1]
          : null;
        previousWorkflowRecord = event.previousWorkflowState <= workflowRecords.length
          ? workflowRecords[event.previousWorkflowState - 1]
          : null;
        if (!R.isNil(workflowRecord) && workflowRecord.close === true) {
          eventMessage = "Closed " + caseOrConsentLabel + " with status '"
            + workflowRecord.name
            + "' (from '"
            + (event.previousWorkflowState <= workflowRecords.length
              ? workflowRecords[event.previousWorkflowState - 1].name
              : "")
            + "')";
        } else if (!R.isNil(workflowRecord) && !R.isNil(previousWorkflowRecord)
          && workflowRecord.id !== previousWorkflowRecord.id) {
          eventMessage = "Updated " + caseOrConsentLabel + " status to '"
            + (R.defaultTo("", workflowRecord.name))
            + "' (previous '"
            + (R.defaultTo("", previousWorkflowRecord.name))
            + "')";
        } else if (!R.isNil(workflowRecord)) {
          eventMessage = "Updated " + caseOrConsentLabel + " status to '"
            + (R.defaultTo("", workflowRecord.name))
            + "'";
        }
      }
      break;
  }
  return eventMessage;
}
