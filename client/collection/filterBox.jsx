"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class'
import R from 'ramda';
import themeable from 'react-themeable';
import Label from '../forms/label.jsx';
import TextBox from '../forms/textBox.jsx';
import NumberBox from '../forms/numberBox.jsx';
import DatePicker from '../forms/datePicker.jsx';
import SelectBox from '../forms/selectBox.jsx';
import SelectBoxV2 from './selectBox.jsx';
import UserContactPanel from './userContactPanel.jsx';
import AccountLookupField from './accountLookupField.jsx';
import {getWorkgroupRecords, getAccountFlagRecords} from '../utils/accountUtils';
import {flagMultiSelectSuggestionRenderer} from '../utils/accountHelpers';
import Button from '../forms/button.jsx';
import {createSyntheticEvent, getFieldName, getValue, getObjectData} from '../utils/domDriverUtils';
import {formattedDate} from '../utils';
import {testMode, $} from '../globals';


const USER_FIELDS_RENDERERS = ["userProfile", "userProfileAll"];
const ACCOUNT_FIELD_RENDERERS = [
  "customerAccount", "partnerAccount", "customerAccountActivity", "partnerAccountActivity","operationsAccount"
];
const REPORT_FIELD_RENDERERS = ["dateReportByYear", "dateReportByMonth", "dateReportByDay"]
const WORKGROUP_FIELD_NAMES = ["workGroupId", "PartnerConsentState.workGroupId", "PermitApplicationActivity.workGroupId"];


function filterTypeToText(filterType) {
  if (R.isNil(filterType)) {
    return null;
  }
  switch (filterType) {
    case "eq":
      return "equal to";
    case "neq":
      return "not equal to";
    case "eqTrue":
      return "selected";
    case "eqFalse":
      return "not selected";
    case "empty":
      return "empty";
    case "nEmpty":
      return "not empty";
    case "lt":
      return "less than";
    case "gt":
      return "greater than";
    case "lt-date":
      return "less than date";
    case "gt-date":
      return "greater than date";
    case "like":
      return "starts with";
    case "nLike":
      return "does not start with";
    case "contains":
      return "contains";
    case "nContains":
      return "does not contain";
    case "inq":
      return "includes";
    case "nin":
      return "does not include";
    case "bt-date":
      return "between dates";
    case "bt":
      return "between";
    case "today":
      return "today";
    case "expired":
      return "expired";
    case "nExpired":
      return "not expired";
    case "gt-8":
      return "last 7 days";
    case "gt-31":
      return "last 30 days";
    case "gt-91":
      return "last 90 days";
    case "gt+41":
      return "due in 42 days";
    case "gt+20":
      return "due in 21 days";
    case "gt+6":
      return "due in 7 days";
    case "gt+0":
      return "due tomorrow";
    case "gt-1":
      return "overdue";
    case "activeUser":
      return "current user";
    case "activeAccount":
      return "current account";
    case "currentMonth":
      return "current month";
    case "previousMonth":
      return "previous month";
    case "last3Months":
      return "last 3 months";
    case "last6Months":
      return "last 6 months";
    case "last12Months":
      return "last 12 months";
    case "currentFinYear":
      return "current financial year";
    case "previousFinYear":
      return "previous financial year";
    case "currentYear":
      return "current year";
    case "previousYear":
      return "previous year";
    default:
      //contains
      return filterType;
  }
}
function filterTypeToCode(filterType) {
  if (R.isNil(filterType)) {
    return null;
  }
  switch (filterType) {
    case "equal to":
      return "eq";
    case "not equal to":
      return "neq";
    case "selected":
      return "eqTrue";
    case "not selected":
      return "eqFalse";
    case "read":
      return "eqTrue";
    case "unread":
      return "eqFalse";
    case "empty":
      return "empty";
    case "not empty":
      return "nEmpty";
    case "less than date":
      return "lt-date";
    case "greater than date":
      return "gt-date";
    case "less than":
      return "lt";
    case "greater than":
      return "gt";
    case "starts with":
      return "like";
    case "does not start with":
      return "nLike";
    case "contains":
      return "contains";
    case "does not contain":
      return "nContains";
    case "includes":
      return "inq";
    case "does not include":
      return "nin";
    case "between":
      return "bt";
    case "between dates":
      return "bt-date";
    case "today":
      return "today";
    case "last 7 days":
      return "gt-8";
    case "last 30 days":
      return "gt-31";
    case "last 90 days":
      return "gt-91";
    case "due in 42 days":
      return "gt+41";
    case "due in 21 days":
      return "gt+20";
    case "due in 7 days":
      return "gt+6";
    case "due tomorrow":
      return "gt+0";
    case "overdue":
      return "gt-1";
    case "expired":
      return "expired";
    case "not expired":
      return "nExpired";
    case "current user":
      return "activeUser";
    case "current account":
      return "activeAccount";
    case "current month":
      return "currentMonth";
    case "previous month":
      return "previousMonth";
    case "last 3 months":
      return "last3Months";
    case "last 6 months":
      return "last6Months";
    case "last 12 months":
      return "last12Months";
    case "current financial year":
      return "currentFinYear";
    case "previous financial year":
      return "previousFinYear";
    case "current year":
      return "currentYear";
    case "previous year":
      return "previousYear";
    default:
      //contains
      return filterType;
  }
}
function filterDisplay(whereValue, name, type, fieldRenderer) {
  const filterType = whereValue.filterType, foreignValue = whereValue.foreignValue;
  let from = whereValue.value;
  let to;
  if (R.contains(filterType, ["activeUser", "activeAccount"]) && type === "number") {
    return filterTypeToText(filterType);
  }
  if (R.contains(filterType, ["currentMonth", "previousMonth",
      "currentFinYear" ,"previousFinYear",
      "currentYear" ,"previousYear",
      "last3Months", "last6Months", "last12Months"]) &&
    type === "string") {
    return filterTypeToText(filterType);
  }
  if (fieldRenderer === "activityRead") {
    if (filterType === "eqTrue") {
      return "read";
    }
    if (filterType === "eqFalse") {
      return "unread";
    }
    return "";
  }
  if (R.contains(fieldRenderer, USER_FIELDS_RENDERERS) && type === "number") {
    if (R.is(Object, foreignValue)) {
      if (R.contains(filterType, ["neq", "nLike", "nContains"])) {
        return "Not: " + foreignValue.firstName + " " + foreignValue.name;
      }
      return foreignValue.firstName + " " + foreignValue.name;
    }
    return "";
  }
  if (!R.isNil(foreignValue)) {
    if (R.is(Array, foreignValue) && foreignValue.length > 0) {
      if (filterType === "inq") {
        return R.join(", ", R.map(R.path(['name']), foreignValue));
      }
      if (filterType === "nin") {
        return "Not: " + R.join(", ", R.map(R.path(['name']), foreignValue));
      }
    }
    if (R.is(Object, foreignValue)) {
      if (R.contains(filterType, ["neq", "nLike", "nContains"])) {
        return "Not: " + R.defaultTo("", foreignValue.name);
      }
      return R.defaultTo("", foreignValue.name);
    }
    return "";
  }
  if (R.contains(filterType, [
      "gt-91", "gt-31", "gt-8", "gt-1", "gt+0", "gt+6", "gt+20", "gt+41", "today", "nEmpty",
      "empty", "eqTrue", "eqFalse", "expired", "nExpired"
    ])) {
    return filterTypeToText(filterType);
  }
  if (R.isNil(from) || R.isNil(filterType)) {
    return "";
  }
  if (R.contains(filterType, ["bt", "bt-date"])) {
    if (!R.isNil(whereValue) && !R.isNil(whereValue.value)) {
      from = R.defaultTo(null, whereValue.value.from);
      to = R.defaultTo(null, whereValue.value.to);
    }
    if ((type === "date" || type === "dateTime") && R.is(String, from) && R.is(String, to)) {
      return formattedDate(from) + " to " + formattedDate(to);
    }
    return R.defaultTo("", from) + " to " + R.defaultTo("", to);
  }
  if ((type === "date" || type === "dateTime") && R.is(String, from)) {
    if (filterType === "gt-date") {
      return "> " + formattedDate(from);
    } else if (filterType === "lt-date") {
      return "< " + formattedDate(from);
    }
    return formattedDate(from);
  }
  if (filterType === "inq" && R.is(Array, from)) {
    return R.join(", ", from);
  }
  if (filterType === "nin" && R.is(Array, from)) {
    return "Not: " + R.join(", ", from);
  }
  if (R.contains(filterType, ["neq", "nLike", "nContains"])) {
    return "Not: " + R.defaultTo("", from);
  }
  if (filterType === "gt") {
    return "> " + R.defaultTo("", from);
  } else if (filterType === "lt") {
    return "< " + R.defaultTo("", from);
  }
  return R.defaultTo("", from);
}

function getId(props) {
  const field = props.field;
  const mergedProps = R.mergeAll([field ? field.toJS() : {}, props]);
  return R.defaultTo(mergedProps.name, mergedProps.id).replace(".", "");
}

/**
 * Based on search component module react-search - https://github.com/StevenIseki/react-search
 */
module.exports = createReactClass({
  "displayName": "FilterBox",
  "propTypes": {
    "filterLabel": PropTypes.bool,
    "field": PropTypes.object,
    "localCache": PropTypes.object,
    "name": PropTypes.string,                 // Name to reference this control (defaults to this.props.label)
    "label": PropTypes.string,
    "actions": PropTypes.object,              // Required if search store provided
    "loading": PropTypes.bool,
    "onChange": PropTypes.func,
    "onBlur": PropTypes.func.isRequired,
    "value": PropTypes.string,             // Controlled value of the selected suggestion
    // hover or Up/Down keys
    "onReset": PropTypes.func,                // This function is called when clear button pressed
    "id": PropTypes.string,                   // Used in aria-* attributes. If multiple Autosuggest's are rendered
    "theme": PropTypes.object              // Custom theme. See: https://github.com/markdalgleish/react-themeable
  },
  "getDefaultProps": function getDefaultProps() {
    if (testMode === true) {
      return {
        "theme": {
          "root": 'react-autosuggest-filter-TESTMODE',
          "rootExpanded": 'react-autosuggest-filter-TESTMODE',
          "panel": 'react-autosuggest-filter__panel'
        }
      };
    }
    return {
      "theme": {
        "root": 'react-autosuggest-filter',
        "rootExpanded": 'react-autosuggest-filter',
        "panel": 'react-autosuggest-filter__panel'
      }
    };
  },
  "getInitialState": function getInitialState() {
    const field = this.props.field;
    const isEditableTable = this.props.editableTable
    const fieldName = field.get('name');
    const fieldRenderer = field.get('renderer');
    const whereValue = R.defaultTo({}, field.get('value'));
    const type = isEditableTable ? field.getIn(["validation", "type"]) : field.get('type');
    const whereForeignValue = R.defaultTo(null, whereValue.foreignValue);
    let fromValue, toValue = null;
    let filterType = R.defaultTo("starts with", isEditableTable ? filterTypeToText(type) :
      filterTypeToText(whereValue.filterType));
    let filterTypeList = [
      "starts with",
      "does not start with",
      "empty",
      "not empty"
    ];
    let filterRecords = null; //used for localCache filters

    if (R.contains(filterType, ["between", "between dates"])) {
      whereValue.value = R.defaultTo({}, whereValue.value);
      fromValue = R.defaultTo(null, whereValue.value.from);
      toValue = R.defaultTo(null, whereValue.value.to);
    } else {
      fromValue = R.defaultTo(null, whereValue.value);
      toValue = null;
    }
    if (fieldRenderer === "activityRead") {
      filterType = null;
      if (whereValue.filterType === "eqTrue") {
        filterType = "read";
      } else if (whereValue.filterType === "eqFalse") {
        filterType = "unread";
      }
      filterTypeList = [
        "read",
        "unread"
      ];
    } else if (this.props.localCache &&
      (R.contains(fieldName, WORKGROUP_FIELD_NAMES) || R.contains(fieldRenderer, [
        "accreditationWorkflow",
        "permitApplicationWorkflowCase",
        "permitApplicationWorkflowConsent",
        "permitApplicationWorkflowCaseClosed",
        "permitApplicationWorkflowConsentClosed",
        "permitApplicationWorkflowCaseClosedTXT",
        "permitApplicationWorkflowConsentClosedTXT",
        "permitApplicationWorkflowActivity",
        "permitWorkflowCase",
        "permitWorkflowCaseClosed",
        "vehicleComponentSetType",
        "vehicleComponentSetTypeTXT",
        "accountWorkgroup"
      ]))) {
      filterType = R.defaultTo("includes", filterTypeToText(whereValue.filterType));
      filterTypeList = [
        "includes",
        "does not include",
        "empty",
        "not empty"
      ];
      if (fieldRenderer === "accreditationWorkflow") {
        filterRecords = R.filter(
          (item) => (R.contains(item.id, [62, 64, 65, 66])),
          R.defaultTo([], this.props.localCache.PermitApplicationWorkflow)
        );
      } else if (fieldRenderer === "permitApplicationWorkflowCase") {
        filterRecords = R.filter(
          (item) => (item.group === "Case" && item.archived !== true),
          R.defaultTo([], this.props.localCache.PermitApplicationWorkflow)
        );
      } else if (fieldRenderer === "permitApplicationWorkflowConsent") {
        filterRecords = R.filter(
          (item) => (item.group === "Consent" && item.archived !== true),
          R.defaultTo([], this.props.localCache.PermitApplicationWorkflow)
        );
      } else if (fieldRenderer === "permitApplicationWorkflowActivity") {
        filterRecords = R.defaultTo([], this.props.localCache.PermitApplicationWorkflow);
      } else if (fieldRenderer === "permitWorkflowCase") {
        filterRecords = R.filter(
          (item) => (item.group === "Permit" && item.archived !== true),
          R.defaultTo([], this.props.localCache.PermitApplicationWorkflow)
        );
      } else if (fieldRenderer === "permitApplicationWorkflowCaseClosed"
        || fieldRenderer === "permitApplicationWorkflowCaseClosedTXT") {
        filterRecords = R.filter(
          (item) => (item.group === "Case" && item.archived !== true && (item.close || item.decision)),
          R.defaultTo([], this.props.localCache.PermitApplicationWorkflow)
        );
      } else if (fieldRenderer === "permitApplicationWorkflowConsentClosed"
        || fieldRenderer === "permitApplicationWorkflowConsentClosedTXT") {
        filterRecords = R.filter(
          (item) => (item.group === "Consent" && item.archived !== true && (item.close || item.decision)),
          R.defaultTo([], this.props.localCache.PermitApplicationWorkflow)
        );
      } else if (fieldRenderer === "permitWorkflowCaseClosed") {
        filterRecords = R.filter(
          (item) => (item.group === "Permit" && item.archived !== true && (item.close || item.decision)),
          R.defaultTo([], this.props.localCache.PermitApplicationWorkflow)
        );
      } else if (fieldRenderer === "vehicleComponentSetType"
        || fieldRenderer === "vehicleComponentSetTypeTXT") {
        filterRecords = R.filter(
          (item) => (item.archived !== true),
          R.defaultTo([], this.props.localCache.VehicleComponentSetType)
        );
      } else if (R.contains(fieldName, WORKGROUP_FIELD_NAMES)) {
        filterRecords = getWorkgroupRecords(this.props.localCache.DatabaseAccountCache);
      }
    } else if (R.contains(fieldRenderer, ACCOUNT_FIELD_RENDERERS) && type === "number") {
      filterType = R.defaultTo(null, filterTypeToText(whereValue.filterType));
      filterTypeList = [
        "current account",
        "equal to",
        "not equal to"
      ];
    }  else if (R.contains(fieldRenderer, REPORT_FIELD_RENDERERS) && type === "string") {
      if (fieldRenderer === "dateReportByYear"){
        filterType = R.defaultTo(null, filterTypeToText(whereValue.filterType));
        filterTypeList = [
          "current year",
          "previous year",
          "starts with",
          "does not start with"
        ];
      } else if (fieldRenderer === "dateReportByMonth"){
        filterType = R.defaultTo(null, filterTypeToText(whereValue.filterType));
        filterTypeList = [
          "current financial year",
          "previous financial year",
          "current year",
          "previous year",
          "starts with",
          "does not start with"
        ];
      } else {
        filterType = R.defaultTo(null, filterTypeToText(whereValue.filterType));
        filterTypeList = [
          "current month",
          "previous month",
          "last 3 months",
          "last 6 months",
          "current financial year",
          "previous financial year",
          "current year",
          "previous year",
          "starts with",
          "does not start with"
        ];
      }
    } else if (R.contains(fieldRenderer, USER_FIELDS_RENDERERS) && type === "number") {
      filterType = R.defaultTo(null, filterTypeToText(whereValue.filterType));
      filterTypeList = [
        "current user",
        "equal to",
        "not equal to"
      ];
    } else if (type === "string" && field.hasIn(['validation', 'inclusion', 'in'])) {
      filterType = R.defaultTo("includes", filterTypeToText(whereValue.filterType));
      filterTypeList = [
        "includes",
        "does not include",
        "empty",
        "not empty"
      ];
      if (R.contains(fieldRenderer, ["flag", "flagConsent"]) && this.props.localCache) {
        filterRecords = getAccountFlagRecords(
          field.getIn(['validation', 'inclusion', 'in']).toJS(),
          this.props.localCache.DatabaseAccountCache
        );
      } else {
        filterRecords = R.map(
          (item) => ({"id": item, "name": item}),
          R.defaultTo([], field.getIn(['validation', 'inclusion', 'in']).toJS())
        );
      }
    } else if (type === "date" && !R.isNil(fieldRenderer)
      && (fieldRenderer.indexOf("dueDate") > -1)) {
      filterType = R.defaultTo(null, filterTypeToText(whereValue.filterType));
      filterTypeList = [
        "due in 42 days",
        "due in 21 days",
        "due in 7 days",
        "due tomorrow",
        "overdue",
        "greater than date",
        "less than date",
        "between dates",
        "empty",
        "not empty"
      ];
    } else if (type === "date" && !R.isNil(fieldRenderer)
      && (fieldRenderer.indexOf("expiryDate") > -1)) {
      filterType = R.defaultTo(null, filterTypeToText(whereValue.filterType));
      filterTypeList = [
        "not expired",
        "expired",
        "greater than date",
        "less than date",
        "between dates",
        "empty",
        "not empty"
      ];
    } else if (type === "date" || type === "dateTime") {
      filterType = R.defaultTo(null, filterTypeToText(whereValue.filterType));
      filterTypeList = [
        "today",
        "last 7 days",
        "last 30 days",
        "last 90 days",
        "greater than date",
        "less than date",
        "between dates",
        "empty",
        "not empty"
      ];
    } else if (type === "boolean") {
      filterType = R.defaultTo(null, filterTypeToText(whereValue.filterType));
      filterTypeList = [
        "selected",
        "not selected"
      ];
    } else if (type === "number") {
      filterType = R.defaultTo("equal to", filterTypeToText(whereValue.filterType));
      filterTypeList = [
        "equal to",
        "not equal to",
        "greater than",
        "less than",
        "between",
        "empty",
        "not empty"
      ];
    } else if (R.contains(".", fieldName)
      && R.isNil(field.get('fullTextSearch')) && R.isNil(field.get('wildcardSearch'))) {
      filterType = R.defaultTo("starts with", filterTypeToText(whereValue.filterType));
      filterTypeList = [
        "starts with",
        "does not start with",
        "empty",
        "not empty"
      ];
    } else if (!R.isNil(field.get('fullTextSearch') && field.get('fullTextSearch'))) {
      filterType = R.defaultTo("contains", filterTypeToText(whereValue.filterType));
      filterTypeList = [
        "contains",
        "does not contain",
        "starts with",
        "does not start with",
        "empty",
        "not empty"
      ];
    } else if (!R.isNil(field.get('wildcardSearch') && field.get('wildcardSearch'))) {
      filterType = R.defaultTo("contains", filterTypeToText(whereValue.filterType));
      filterTypeList = [
        "contains",
        "does not contain",
        "starts with",
        "does not start with",
        "empty",
        "not empty"
      ];
    }
    return {
      "showdropdown": false,
      "filterRecords": filterRecords,
      "filterType": filterType,
      "filterTypeList": filterTypeList,
      "from": fromValue,
      "to": toValue,
      "foreignValue": whereForeignValue
    };
  },
  "componentDidUpdate": function componentDidUpdate(prevProps) {
    const props = prevProps;
    const nextProps = this.props;
    if (props.id !== nextProps.id) {
      this.setState(this.getInitialState());
    }
  },
  "onToggle": function onToggle(event) {
    if (this.state.showdropdown) {
      this.onInputBlur(event);
    } else {
      this.onInputFocus(event);
    }
  },
  "onInputBlur": function onInputBlur(event) {
    const fieldName = getFieldName(event);
    let fromValue = null, toValue = null;
    if (this.props.field.get('type') === "date" || this.props.field.get('type') === "dateTime") {
      fromValue = new Date();
      toValue = new Date();
    }
    if (this.props.activeFilter === fieldName) {
      this.props.onChange(createSyntheticEvent("_activeFilter", null));
    }
    this.setState({
      "showdropdown": false,
      "from": fromValue,
      "to": toValue,
      "foreignValue": null
    });
  },
  "onInputFocus": function onInputFocus(event) {
    if (this.props.editableTable) {
      this.setState({"filterValue": getValue(event), "showdropdown": true});
      return;
    }
    const fieldName = getFieldName(event);
    if (this.props.activeFilter !== fieldName) {
      this.props.onChange(createSyntheticEvent("_activeFilter", fieldName));
    }
    this.setState({"showdropdown": true});
    const id = getId(this.props);
    const type = this.props.field.get('type');
    $("#" + id).blur();
    if (type === "date" || type === "dateTime") {
      setTimeout(() => ($("#" + id + "-fromDate").focus()), 100);
    } else if (!R.isNil(this.state.filterType)) {
      setTimeout(() => ($("#" + id + "-from").focus()), 100);
    }
  },
  "onKeyDown": function onKeyDown(event) {
    if (event.keyCode === 13) {
      this.onApply();
    } else if (event.keyCode === 27) {
      this.onInputBlur();
    }
  },
  "onChange": function onChange(event) {
    const id = getId(this.props);
    const fieldName = getFieldName(event);
    const value = getValue(event);
    const foreignValue = getObjectData(event);
    switch (fieldName) {
      case "filterType":
        this.setState({"filterType": value});
        break;
      case "from":
        if (!R.isNil(this.state.filterRecords)) {
          this.setState({
            "from": value,
            "foreignValue": foreignValue
          });
        } else {
          this.setState({
            "from": value,
            "foreignValue": null
          });
        }
        break;
      case "fromDate":
      case id + "-fromDate":
        this.setState({
          "from": value,
          "foreignValue": null
        });
        break;
      case "to":
      case "toDate":
      case id + "-toDate":
        this.setState({
          "to": value,
          "foreignValue": null
        });
        break;
      case "foreignKey":
        if (value && value.id) {
          this.setState({
            "from": value.id,
            "foreignValue": value
          });
          //this.props.onChange(createSyntheticEvent(fieldName, value.id, null, null, value));
        }
        break;
      default:
        break;
    }
  },
  "onApply": function onApply() {
    const fieldName = this.props.field.get('name');
    let whereValue = {
      "value": R.contains(this.state.filterType, ["between", "between dates"])
        ?
        {
          "from": this.state.from,
          "to": this.state.to
        }
        :
        this.props.editableTable && R.isNil(this.state.from) && !R.isNil(this.props.filterValue) &&
        R.is(Object, this.props.filterValue) ? this.props.filterValue.value : this.state.from,
      "foreignValue": this.state.foreignValue,
      "filterType": filterTypeToCode(this.state.filterType)
    };
    whereValue = this.props.editableTable ? R.merge(whereValue, {"fieldName": fieldName}) : whereValue;
    this.props.onChange(createSyntheticEvent(fieldName, whereValue,
      this.props.editableTable ? this.props.embededPath : null, "JSON"));
    this.onInputBlur();
  },
  "onReset": function onReset() {
    const fieldName = this.props.field.get('name');
    const whereValue = null;
    this.props.onChange(createSyntheticEvent(fieldName, whereValue,
      this.props.editableTable ? this.props.embededPath : null, "JSON"));
    this.onInputBlur();
  },
  "render": function render() {
    const props = this.props;
    let {field} = props;
    let updatedField = field
      .set('value', this.state.from)
      .set('foreignValue', this.state.foreignValue);
    const mergedProps = R.mergeAll([field ? field.toJS() : {}, props]);
    const {
      theme, name, renderer, loading, width, label, validation, type, ...inputProps
    } = mergedProps;

    const id = getId(props);
    const _theme = themeable(theme);
    const isExpanded = this.state.showdropdown && this.props.activeFilter === name;
    let showFrom = true, showTo = false;
    if (R.contains(this.state.filterType, ['between', 'between dates'])) {
      showTo = true;
    }
    if (R.contains(
        this.state.filterType,
        [
          null, 'today', 'expired', 'not expired', 'last 7 days', 'last 30 days', 'last 90 days',
          'overdue', 'due tomorrow', 'due in 7 days', 'due in 21 days', 'due in 42 days',
          'selected', 'not selected',
          'current user', 'current account',
          "current financial year", "previous financial year",
          "current year", "previous year",
          'current month', "previous month",  "last 3 months", "last 6 months",
          'empty', 'not empty'
        ]
      )
    ) {
      showFrom = false;
      showTo = false;
    }
    //get input field type
    let inputFieldType = "";
    if (type === "number" && R.contains(renderer, ACCOUNT_FIELD_RENDERERS)) {
      inputFieldType = "AccountLookup";
    } else if (type === "number" && R.contains(renderer, USER_FIELDS_RENDERERS)) {
      inputFieldType = "UserLookup";
    } else if (!R.isNil(this.state.filterRecords)) {
      inputFieldType = "MultiSelectBox";
    } else if (type === "number") {
      inputFieldType = "NumberBox";
    } else if (type === "date" || type === "dateTime") {
      inputFieldType = "DatePicker";
    } else if (type === "string" || (!R.isNil(field.get('fullTextSearch') && field.get('fullTextSearch')))) {
      inputFieldType = "TextBox";
    }

    let rendererAccountType = renderer;
    if (rendererAccountType === "customerAccountActivity") {
      rendererAccountType = "customerAccount";
    } else if (rendererAccountType === "partnerAccountActivity") {
      rendererAccountType = "partnerAccount";
    }
    const editableTableValueFrom = !R.isNil(this.props.filterValue) && R.is(Object, this.props.filterValue)
      ? this.props.filterValue.value
      : this.state.from

    return (
      <div {..._theme('root', 'root')}
           style={props.filterLabel === true && !isExpanded ? {"position": "relative"} : null}>
        <div style={R.isNil(width) ? null : {"width": width}}>
          {props.filterLabel === true ? <Label label={label} /> : null}
          <TextBox
            label={label}
            {...inputProps}
            type="text"
            key="autosuggest"
            id={id}
            name={name}
            value={
                filterDisplay(R.defaultTo({}, this.props.editableTable &&
                !R.isNil(this.props.filterValue) && R.is(Object, this.props.filterValue) ?
                  this.props.filterValue : field.get('value')), name, type, renderer)
            }
            addonAfter={<Button
              className="btn-primary btn-search"
              title="Toggle dropdown"
              aria-controls={'react-autosuggest-' + id}
              label={<span className="glyphicon mdi-menu-down mdi-lg"/>}
              onClick={() => {
                let event = createSyntheticEvent(name, null);
                this.onToggle(event);
              }}/>}
            onChange={() => (null)}
            onFocus={this.onInputFocus}
            validation={validation ? validation : {"type": "string"}}
            showValidating={this.state.showdropdown && loading}
            autoComplete="off"
            role="combobox"
            aria-autocomplete="list"
            aria-owns={'react-autosuggest-' + id}
            aria-expanded={isExpanded}
          />
        </div>
        <div id={'react-autosuggest-' + id}
             {..._theme('panel', 'panel')}
             style={isExpanded ? null : {"display": "none"}}
        >
          <div className="form">
            <div className="row">
              <div className="col-xs-12">
                <SelectBox
                  id={id + "-select"}
                  name="filterType"
                  label="Filter type"
                  value={this.state.filterType}
                  onChange={this.onChange}
                  validation={{
                    "inclusion": {
                      "in": this.state.filterTypeList
                    }
                  }}
                  includeBlank={true}
                  standalone={true}
                />
              </div>
            </div>
            <div className="row" id={id + "-rangeDate"}>
              {!showFrom ? null :
                <div className={showTo ? "col-xs-6" : "col-xs-12"}>
                  {
                    inputFieldType === "DatePicker"
                      ?
                      <DatePicker
                        id={id + "-fromDate"}
                        name="fromDate"
                        label={showTo ? "From" : "Value"}
                        value={this.state.from}
                        validation={{"type": type}}
                        standalone={true}
                        onChange={this.onChange}
                        rangeId={showTo ? id + "-rangeDate" : null}
                        toId={showTo ? id + "-toDate" : null}
                        onKeyDown={this.onKeyDown}
                      />
                      : null
                  }
                  {
                    inputFieldType === "NumberBox"
                      ?
                      <NumberBox
                        id={id + "-from"}
                        name="from"
                        label={showTo ? "From" : "Value"}
                        value={this.props.editableTable ? editableTableValueFrom : this.state.from}
                        step={0.1}
                        validation={{"type": type}}
                        standalone={true}
                        onChange={this.onChange}
                        onKeyDown={this.onKeyDown}
                      />
                      : null
                  }
                  {
                    inputFieldType === "TextBox"
                      ?
                      <TextBox
                        id={id + "-from"}
                        name="from"
                        label="Value"
                        inputWhiteList={"[^A-Za-z0-9\\s@\\s_.,#&=/\\(\\)\\-\\\"\\'\\/\\<\\>]+"}
                        value={this.props.editableTable ? editableTableValueFrom : this.state.from}
                        validation={{"type": type}}
                        standalone={true}
                        onChange={this.onChange}
                        onKeyDown={this.onKeyDown}
                      />
                      : null
                  }
                  {
                    inputFieldType === "MultiSelectBox"
                      ?
                      <SelectBoxV2
                        id={id + "-from"}
                        theme={{
                          "root": 'react-autosuggest-expanded',
                          "rootExpanded": 'react-autosuggest-expanded',
                          "suggestions": 'react-autosuggest-expanded__suggestions',
                          "suggestion": 'react-autosuggest__suggestion',
                          "suggestionIsFocused": 'react-autosuggest-expanded__suggestion--focused',
                          "suggestionIsSelected": 'react-autosuggest-expanded__suggestion--selected',
                          "suggestionIsSelectedFocussed": 'react-autosuggest-expanded__suggestion--selectedFocused'
                        }}
                        field={updatedField}
                        width={width}
                        name="from"
                        value={this.props.editableTable ? editableTableValueFrom : this.state.from}
                        onChange={this.onChange}
                        onBlur={() => (null)}
                        records={this.state.filterRecords}
                        standalone={true}
                        showLabel={false}
                        showAsDropdown={false}
                        idFieldName={!this.props.editableTable && R.defaultTo("", renderer).indexOf("TXT") > -1 ? "name" : "id"}
                        displayFieldName="name"
                        boxType="multiSelect"
                        suggestionRenderer={R.contains(renderer, ['flag', 'flagConsent'])
                          ? flagMultiSelectSuggestionRenderer
                          : null
                        }
                      />
                      :
                      null
                  }
                  {
                    inputFieldType === "UserLookup"
                      ?
                      <UserContactPanel
                        id={id + "-from"}
                        theme={{
                          "root": 'react-autosuggest-static',
                          "rootExpanded": 'react-autosuggest-static',
                          "suggestions": 'react-autosuggest-static__suggestions',
                          "suggestion": 'react-autosuggest__suggestion',
                          "suggestionIsFocused": 'react-autosuggest-static__suggestion--focused',
                          "suggestionIsSelected": 'react-autosuggest-static__suggestion--selected',
                          "suggestionIsSelectedFocussed": 'react-autosuggest-static__suggestion--selectedFocused'
                        }}
                        alwaysExpanded={true}
                        name="foreignKey"
                        userIdField={updatedField}
                        onChange={this.onChange}
                        searchAllUsers={renderer === "userProfileAll"}
                      />
                      : null
                  }
                  {
                    inputFieldType === "AccountLookup"
                      ?
                      <AccountLookupField
                        id={id + "-from"}
                        theme={{
                          "root": 'react-autosuggest-static',
                          "rootExpanded": 'react-autosuggest-static',
                          "suggestions": 'react-autosuggest-static__suggestions',
                          "suggestion": 'react-autosuggest__suggestion',
                          "suggestionIsFocused": 'react-autosuggest-static__suggestion--focused',
                          "suggestionIsSelected": 'react-autosuggest-static__suggestion--selected',
                          "suggestionIsSelectedFocussed": 'react-autosuggest-static__suggestion--selectedFocused'
                        }}
                        alwaysExpanded={true}
                        name="foreignKey"
                        field={updatedField}
                        accountType={rendererAccountType}
                        onChange={this.onChange}
                      />
                      : null
                  }
                </div>
              }
              {!showTo ? null :
                <div className="col-xs-6">
                  {type === "date" || type === "dateTime"
                    ?
                    <DatePicker
                      id={id + "-toDate"}
                      name="toDate"
                      label="To"
                      value={this.state.to}
                      validation={{"type": type}}
                      standalone={true}
                      rangeId={id + "-rangeDate"}
                      toId={id + "-toDate"}
                      onKeyDown={this.onKeyDown}
                    />
                    :
                    <NumberBox
                      id={id + "-to"}
                      name="to"
                      label="To"
                      value={this.state.to}
                      step={0.1}
                      validation={{"type": type}}
                      standalone={true}
                      onChange={this.onChange}
                      onKeyDown={this.onKeyDown}
                    />
                  }
                </div>
              }
            </div>
            <div className="row">
              <div className="col-xs-4">
                <Button
                  className="btn-default btn-flat btn-block btn-sm"
                  title="Toggle dropdown"
                  aria-controls={'react-autosuggest-' + id}
                  label="Cancel"
                  onClick={this.onInputBlur}
                />
              </div>
              <div className="col-xs-4">
                <Button
                  className="btn-danger btn-flat btn-block btn-sm"
                  title="Toggle dropdown"
                  aria-controls={'react-autosuggest-' + id}
                  label="Reset"
                  onClick={this.onReset}
                />
              </div>
              <div className="col-xs-4">
                <Button
                  className="btn-primary btn-flat btn-block btn-sm"
                  title="Toggle dropdown"
                  aria-controls={'react-autosuggest-' + id}
                  label="Apply"
                  onClick={this.onApply}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});
