"use strict";
import React from "react"; //eslint-disable-line no-unused-vars
import R from "ramda";
import * as fieldRenderers from "../../../../client/source/view/features/access/_components/fieldRenderers";
import Button from "cell-cycle/client/forms/button";
import {openWindow} from "cell-cycle/client/libraries/router";


export function yesNoFormatter(value) {
  return value ? "Yes" : "No";
}

export function getMappedStatus(initialValue) {
  switch(initialValue) {
    case "Deleted":
      return "Delete";

    case "Updated":
      return "Update";

    case "Added":
        return "Add";

    default:
      return initialValue;
  }
}

export function defaultDash(value) {
  return R.isNil(value) || value === "" ? "-" : value;
}

export function subHeading(label) {
  return (
    <div className="">
      <span className="text-lg text-primary-dark">{label}</span>
    </div>
  );
}

export function subHeadingSmall(label, className) {
  return (
    <div className="">
      <span className={R.defaultTo("text-primary-dark", className)}>{label}</span>
    </div>
  );
}

export function subSubHeading(label) {
  return (
    <div className="">
      <span className="text-lg text-primary-dark">{label}</span>
    </div>
  );
}

export function subSubSubHeading(label) {
  return (
    <div className="">
      <span className="text-lg text-primary-dark">{label}</span>
    </div>
  );
}


export function renderJurisdictions(jurisdictions) {
  if (jurisdictions && R.is(Array, jurisdictions)) {
    return jurisdictions.join(",");
  }
  return "";
}


export function amendVehicleFormatter(value) {
  const classMap = {
    "Add": "success",
    "Remove": "danger"
  };
  return <span className={"label label-" + classMap[value]}>{value}</span>;
}

export function getPermitNumber(record) {
  const permit = record.getIn(['permit', 'value']);
  const permitNumber = record.getIn(['permitNumber', 'value']);
  const permitVersionRaw = record.getIn(['permitVersion', 'value']);
  let permitVersion = R.isNil(permitVersion) ? "" : "V" + permitVersion;
  if (R.isNil(permit) || R.isNil(permit.id)) {
    return R.defaultTo("-", permitNumber) + permitVersion;
  }
  permitVersion = "V" + R.defaultTo(1, R.defaultTo(permitVersionRaw, permit.permitVersion));
  return R.defaultTo(permit.id, permitNumber) + permitVersion;
}

export function getPermitBasedCaseNumber(record) {
  const permit = record.getIn(['permit', 'value']);
  const applicationId = record.getIn(['id', 'value']);
  const permitId = record.getIn(['permitId', 'value']);
  const permitRouteNumber = record.getIn(['permitRouteNumber', 'value']);
  const permitRouteVersion = record.getIn(['permitRouteVersion', 'value']);
  if (R.isNil(permit) || R.isNil(permitId) || R.isNil(permitRouteNumber)) {
    return applicationId;
  }
  return permitId + "r" + permitRouteNumber + "v" + R.defaultTo(1, permitRouteVersion);
}

export function getPermitBasedCaseNumberHeader(record) {
  const permit = record.getIn(['permit', 'value']);
  const applicationId = record.getIn(['id', 'value']);
  const permitId = record.getIn(['permitId', 'value']);
  const permitRouteNumber = record.getIn(['permitRouteNumber', 'value']);
  const permitRouteVersion = record.getIn(['permitRouteVersion', 'value']);
  if (R.isNil(permit) || R.isNil(permitId) || R.isNil(permitRouteNumber)) {
    return " Case: "
      + R.defaultTo("", applicationId) + " - "
      + R.defaultTo("", record.getIn(['applicationClass', 'value'])).replace(" Permit", "") + " - "
      + R.defaultTo("", record.getIn(['applicationType', 'value']));
  }
  return <span>
    {" Case: " + permitId}
    <span className="text-xs">{
      "r" + R.defaultTo(1, permitRouteNumber) + "v" + R.defaultTo(1, permitRouteVersion)
    }</span>
    {" - "
    + R.defaultTo("", record.getIn(['applicationClass', 'value'])).replace(" Permit", "") + " - "
    + R.defaultTo("", record.getIn(['applicationType', 'value']))}
    </span>;
}

export function getAccountHeader(account, accountType, showChannel) {
  let fileListField, title, accountPrefix;
  if (R.isNil(account)) {
    return null;
  }
  if (accountType === "customer") {
    accountPrefix = "Customer";
    title = "Customer:";
  } else if (accountType === "partner") {
    accountPrefix = "Partner";
    title = "Road Mgr:";
  }
  fileListField = accountPrefix + "Account.fileList";
  return (
    <React.Fragment>
      <span className="summary-label">{title}
        <fieldRenderers.accountLogo
          account={account}
          column={fileListField}
          size="x-small"
        />
        <span className="summary-value">
        <fieldRenderers.account
          account={account}
          maxLen={30}
        />
        </span>
        {showChannel ?
          <Button
            name={"accountLink"}
            label={<span className={"glyphicon mdi-open-in-new mdi-sm"}/>}
            title="Open account"
            className="btn-xs btn-icon-toggle btn-primary margin-top--5"
            onClick={(event) => {
              event.preventDefault();
              openWindow(
                "/#page=regulator/admin/accounts/manageCustomerAccounts/manageCustomerAccount&customerAccountId="
                + account.id,
                "_blank"
              );
            }}
          />
          : null
        }
        {showChannel ? <span>&nbsp;&nbsp;</span> : <span>&nbsp;&nbsp;&nbsp;</span>}
      </span>
      {showChannel === true && !R.isNil(account.channel) ?
          <span className="summary-label">Channel:&nbsp;
            <span className="summary-value">
              <fieldRenderers.channel item={{"channel": account.channel}}/>
            </span>
            <span>&nbsp;&nbsp;&nbsp;</span>
          </span>
        : null
      }
    </React.Fragment>
  );
}



export function getUserHeader(assignedTo, accountType) {
  return (
    <span className="summary-label">{accountType === "customer" ? "Contact: " : "Assigned to: "}
      <span className="summary-value">
        <fieldRenderers.userProfile
          item={assignedTo}
          column="name"
          maxLen={30}
        />
      </span>
      <span>&nbsp;&nbsp;&nbsp;</span>
    </span>
  );
}

export function getPriorityHeader(priority, accountType) {
  if (accountType === "customer" || priority !== true) {
    return null;
  }
  return (
    <span className="summary-label">
      <span className="summary-value">
        <fieldRenderers.priority
          item={{"priority": priority}}
        />
      </span>
      <span>&nbsp;&nbsp;</span>
    </span>
  );
}

export function getFlagHeader(flag) {
  if (R.isNil(flag) || flag === "clear") {
    return null;
  }
  return (
    <span>
      <span className="summary-label">Flag:&nbsp;
        <span className="summary-value">
          <fieldRenderers.flag
            item={{"flag": flag}}
          />
        </span>
        </span>
    </span>
  );
}
