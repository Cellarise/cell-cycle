import React from 'react';
import R from 'ramda';
import Collapse from '../page/collapse.jsx';
import {formattedBrokenDateTimeAMPM} from '../utils';
import {TimelineTypeIcon, RenderReply, RenderActivityCommentsHeader} from './engineUtils';
import {getEventName} from './eventUtils';
import {createSyntheticEvent, getValue} from '../utils/domDriverUtils';
import SelectBox from '../forms/selectBox.jsx';
import CheckBox from '../forms/checkBox.jsx';
import {getEventHandler} from '../utils/viewUtils';


export function RenderHistory({store, actions, record, workflowRecords, name, authenticationUI}) {
  let activities = record.getIn(["activity", "value"]);
  const events = record.getIn(["event", "value"]);
  const partnerConsent = record.getIn(["partnerConsent", "value"]);
  const onChange = getEventHandler(actions, store, "onChangeActivity");
  const activitySubStore = store.getIn(["props", "activity"])
  const timeline = activitySubStore.get("timeline");
  const sortBy = R.defaultTo("modified", timeline.getIn(["sortBy"]));
  const activityOrEvents = R.pipe(
    R.concat(R.defaultTo([], timeline.getIn(["events"]) ? events : null)),
    R.sortBy(R.prop(sortBy)),
    R.reverse
  )(R.defaultTo([], renderTimelineActivites(timeline, activities)));

  if (R.isNil(activityOrEvents) || activityOrEvents.length === 0) {
    return (
      <div>
        {renderFilters(timeline, onChange)}
        <ul className="timeline collapse-lg">
          <div className={"alert alert-callout alert-info"} role="alert">
            No notes
          </div>
        </ul>
      </div>
    );
  }
  return (
    <div>
      {renderFilters(timeline, onChange)}
      <ul className="timeline history-timeline collapse-lg timeline-hairline">
        {R.addIndex(R.map)(
          (activityOrEvent, idx) => {
            if (activityOrEvent.hasOwnProperty("sourceModel")) {
              return renderEvent(activityOrEvent, partnerConsent, workflowRecords, sortBy, idx);
            }
            return renderActivity(activityOrEvent, workflowRecords, sortBy, idx, name, record, authenticationUI);
          },
          activityOrEvents)
        }
      </ul>
    </div>
  );
}


function renderEvent(event, partnerConsent, workflowRecords, sortBy, idx) {
  let eventName = getEventName(event, partnerConsent, workflowRecords);
  return (
    <li className="timeline-inverted" key={idx}>
      <TimelineTypeIcon activity={event} className="timeline-circ circ-sm style-primary"/>
      <div className="timeline-entry">
        <div className="timeline-time">{formattedBrokenDateTimeAMPM(event[sortBy])}</div>
        <div className="card style-default-bright">
          <div className="card-body small-padding">
            <span className="">{eventName}</span><br/>
          </div>
        </div>
      </div>
    </li>
  );
}

function renderActivity(activity, workflowRecords, sortBy, idx, componentName, record, authenticationUI) {
  const activityReplies = R.defaultTo([], activity.children);

  return (
    <li className="timeline-inverted" key={idx}>
      <TimelineTypeIcon activity={activity} className="timeline-circ circ-sm style-primary"/>
      <div className="timeline-entry">
        <div className="timeline-time">{formattedBrokenDateTimeAMPM(activity[sortBy])}</div>
        <Collapse id={idx + componentName}
                  name={componentName + "collapse"}
                  header={<RenderActivityCommentsHeader
                    activity={activity}
                    workflowRecords={workflowRecords}
                    showCreatedDate={sortBy !== "created"}
                    enableUnread={false}
                  />}
                  active={true}
                  classNameBody="no-y-top-bottom-padding"
                  classNameHeader="style-default-bright card-head-sm">
          <div className="" data-target={idx + componentName}>
            <ul className="timeline collapse-lg timeline-none no-card-shadow no-padding">
              <RenderReply
                index={0}
                activity={activity}
                dateField="created"
                record={record}
                authenticationUI={authenticationUI}
              />
              {R.addIndex(R.map)(
                (reply, idx2) => (<RenderReply
                  key={idx2}
                  index={idx2 + 1}
                  activity={reply}
                  record={record}
                  authenticationUI={authenticationUI}
                />),
                activityReplies
              )}
            </ul>
          </div>
        </Collapse>
      </div>
    </li>
  );
}

function renderTimelineActivites(timeline, activities) {
  activities = R.filter((_activity) => {
    if (R.contains(_activity.systemType, ["Information", "InformationConsent", "Change", "ChangeConsent"])
      && timeline.getIn(["activities", "requests"])) {
      return _activity
    }
    if (R.contains(_activity.systemType, ["Task", "TaskConsent"])
      && timeline.getIn(["activities", "tasks"])) {
      return _activity
    }
    if ( R.contains(_activity.systemType, ["Note", "NoteConsent", "Workflow", "WorkflowConsent"])
      && timeline.getIn(["activities", "notes"])) {
      return _activity
    }
    if ( R.contains(_activity.systemType, ["Decision", "DecisionConsent"])
      && timeline.getIn(["activities", "decisions"])) {
      return _activity
    }
  },activities)
  return activities
}

function renderFilters(timeline, onChange){
  return (
    <div className="hidden-xs">
      <div className="row" style={{fontSize: "72%", color: "gray", fontWeight: "400"}}>
        <div className="col-sm-12">
          <div className="col-sm-2">Sort by</div>
          <div className="col-sm-10 pull-left">Filter by</div>
        </div>
      </div>
      <div className="row" style={{borderBottom: "1px solid lightgray", paddingBottom: "0.5%"}}>
        <div className="col-sm-12">
          <div className="col-sm-2">
            <div className="form">
              <SelectBox
                id="timeline-sortBy"
                name="sortBy"
                value={timeline.getIn(["sortBy"])}
                label="Sort by"
                includeBlank={false}
                standalone={true}
                showLabel={false}
                hasFeedback={false}
                tableStyle={true}
                onChange={(event) => {
                  onChange(createSyntheticEvent("sortBy", getValue(event)));
                }}
                validation={{
                  "inclusion": {
                    "in": ["created", "modified"]
                  }
                }}
              />
            </div>
          </div>
          <div className="col-sm-10" style={{top: "5px"}}>
            <div className="col-sm-2">
              <CheckBox
                id="timeline-activitiesRequests"
                name="activitiesRequests"
                label="Requests"
                standalone={true}
                hasFeedback={false}
                value={timeline.getIn(["activities", "requests"])}
                onChange={(event) => {
                  onChange(createSyntheticEvent("requests", getValue(event)));
                }}
              />
            </div>
            <div className="col-sm-2">
              <CheckBox
                id="timeline-activitiesTasks"
                name="activitiesReminders"
                label="Tasks"
                standalone={true}
                hasFeedback={false}
                value={timeline.getIn(["activities", "tasks"])}
                onChange={(event) => {
                  onChange(createSyntheticEvent("tasks", getValue(event)));
                }}
              />
            </div>
            <div className="col-sm-2">
              <CheckBox
                id="timeline-activitiesNotes"
                name="activitiesNotes"
                label="Notes"
                standalone={true}
                hasFeedback={false}
                value={timeline.getIn(["activities", "notes"])}
                onChange={(event) => {
                  onChange(createSyntheticEvent("notes", getValue(event)));
                }}
              />
            </div>
            <div className="col-sm-2">
              <CheckBox
                id="timeline-activitiesDecisions"
                name="activitiesDecisions"
                label="Decisions"
                standalone={true}
                hasFeedback={false}
                value={timeline.getIn(["activities", "decisions"])}
                onChange={(event) => {
                  onChange(createSyntheticEvent("decisions", getValue(event)));
                }}
              />
            </div>
            <div className="col-sm-2">
              <CheckBox
                id="timeline-events"
                name="events"
                label="Events"
                standalone={true}
                hasFeedback={false}
                value={timeline.getIn(["events"])}
                onChange={(event) => {
                  onChange(createSyntheticEvent("events", getValue(event)));
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
