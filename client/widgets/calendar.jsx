import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from 'ramda';
import {$} from '../globals';
import moment from 'moment';
import fullCalendar from 'fullcalendar'; //eslint-disable-line
import 'fullcalendar/dist/fullcalendar.css';
import {getActivityName} from '../engines/engineUtils';


module.exports = createReactClass({
  propTypes: {
    id: PropTypes.string,
    taskField: PropTypes.object.isRequired,
    eventClick: PropTypes.func,
    eventSelect: PropTypes.func,
    eventChange: PropTypes.func,
    workflowRecords: PropTypes.array
  },
  getDefaultProps: function getDefaultProps() {
    return {
      id: "fullcalendar"
    };
  },
  componentDidMount: function componentDidMount() {
    const props = this.props;
    $('#' + props.id).fullCalendar({
      height: "parent",
      header: {
        left: 'prev,next today',
        center: 'title',
        right: 'agendaWeek,month,listMonth'
      },
      // timezone: "UTC",
      businessHours: {
        // days of week. an array of zero-based day of week integers (0=Sunday)
        dow: [1, 2, 3, 4, 5], // Monday - Friday
        start: '7:00', // a start time (7am in this example)
        end: '18:00', // an end time (6pm in this example)
      },
      views: {
        week: {
          weekends: false,
        },
        listMonth: {
          weekends: false,
        }
      },
      allDayText: "Reminders",
      slotDuration: '00:60:00',
      slotEventOverlap: true,
      minTime: '06:00:00',
      maxTime: '18:00:00',
      defaultView: "month",
      navLinks: true, // can click day/week names to navigate views
      selectable: true,
      selectHelper: true,
      editable: false,
      firstDay: 1,
      droppable: false, // this allows things to be dropped onto the calendar
      eventClick: props.eventClick,
      eventDragStart: props.eventSelect,
      eventResizeStart: props.eventSelect,
      eventDrop: props.eventChange,
      eventResize: props.eventChange,
      eventRender: function(event, element) {
        element.css(event.titleClassName);
      }
    });
    $('#' + props.id).fullCalendar('addEventSource', getTaskEventSource(props.taskField, props.workflowRecords));
  },
  UNSAFE_componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    const props = this.props;
    if (props.taskField !== nextProps.taskField) {
      $('#' + props.id).fullCalendar('removeEventSource', "tasks");
      $('#' + props.id).fullCalendar(
        'addEventSource',
        getTaskEventSource(nextProps.taskField, nextProps.workflowRecords)
      );
    }
  },
  componentWillUnmount: function componentWillUnmount() {
    // Destroy the calendar, this makes sure events such as resize are cleaned up and do not leak
    $('#' + this.props.id).fullCalendar('destroy');
  },
  render: function render() {
    return (
      <div id={this.props.id}></div>
    );
  }
});

function getTaskEventSource(taskField, workflowRecords) {
  const events = R.pipe(
    R.filter(
      (activity) => (!R.contains(activity.systemType, ["Note"]))
    ),
    R.addIndex(R.map)(
      (event, idx) => {
        event.index = idx;
        event.title = getActivityName(event, workflowRecords);
        event.titleClassName="glyphicon mdi-chemical-weapon";
        event.start = event.allDay === true
          ? moment.utc(event.start).startOf('day').toDate()
          : moment.utc(event.start).toDate();
        event.end = event.allDay === true
          ? moment.utc(event.start).endOf('day').toDate()
          : moment.utc(event.end).toDate();
        return event;
      })
  )(R.defaultTo([], taskField.getIn(["value"])));
  return {
    events: events,
    id: "tasks"
  };
}
