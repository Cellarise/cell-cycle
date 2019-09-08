import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import {logger} from '../globals';
import * as recordUtils from '../utils/recordUtils';
import {createSyntheticEvent} from '../utils/domDriverUtils';


export let contextTypes = {
  "actions": PropTypes.object.isRequired
};

export function getComponentHeight(windowDimensions, inherited, offset, showCardActionBar) {
  const height = windowDimensions.get('height');
  const inheritedOffset = inherited ? 67 : 0;
  const actionBarOffset = showCardActionBar ? 0 : -58;
  return height - (254 + inheritedOffset + R.defaultTo(0, offset) + actionBarOffset);
}

export function getStoreId(storeOrStoreId) {
  return R.is(String, storeOrStoreId) ? storeOrStoreId : storeOrStoreId.get("name");
}

export function isAuditHistoryEnabled(store) {
  return store.getIn(['props', 'auditPageState', 'auditHistoryEnabled']);
}

export function isCurrentRecordActive(store) {
  return recordUtils.isCurrentRecordActive(store);
}

export function getActiveRecord(store) {
  let record;
  if (isAuditHistoryEnabled(store) && !recordUtils.isCurrentRecordActive(store)) {
    const activeRecordIndex = store.getIn(['auditProps', 'activeRecordIndex']);
    // On the first time the audit history panel has been opened, wait for fetch to return
    if (store.getIn(['auditProps', 'record'])) {
      record = store.getIn(['auditRecords', activeRecordIndex]);
      record = recordUtils.updateRecordDeep(record, field => {
        return field.set('disabled', true)
          .set('error', '')
          .set('showError', false)
      });
    }
  }
  if (!record) {
    const activeRecordIndex = store.getIn(['props', 'activeRecordIndex']);
    record = store.getIn(['records', activeRecordIndex]);
  }
  return record;
}

export function getActiveRecordJS(store) {
  let record;
  if (isAuditHistoryEnabled(store) && !recordUtils.isCurrentRecordActive(store)) {
    // On the first time the audit history panel has been opened, wait for fetch to return
    if (store.getIn(['auditProps', 'record'])) {
      record = store.getIn(['auditProps', 'record']);
    }
  }
  if (!record) {
    record = store.getIn(['props', 'record']);
  }
  return record;
}

export function getFieldHandler(primaryEventHandler, actions, storeId, actionId) {
  if (primaryEventHandler) {
    return primaryEventHandler;
  }
  if (actions && storeId && actionId) {
    return (event) => {
      actions.push({
        "id": actionId,
        "storeId": storeId,
        "event": event
      });
    };
  }
}

export function getEventHandler(actions, store, actionId) {
  if (actions && store && actionId) {
    const eventHandlerAuthorised = (event) => {
      eventHandler(actions, store, actionId, event);
    };
    eventHandlerAuthorised.authorised = storeActionAuthorised(store, actionId);
    return eventHandlerAuthorised;
  }
  if (!actions) {
    logger.error("getEventHandler called without actions");
  }
  if (!actionId) {
    logger.error("getEventHandler called without actionId");
  }
}

export function getEventHandlerNoAuthorisation(actions, storeOrStoreId, actionId) {
  return (event) => {
    actions.push({
      "id": actionId,
      "storeId": getStoreId(storeOrStoreId),
      "event": event
    });
  };
}

export function eventHandler(actions, storeOrStoreId, actionId, event) {
  actions.push({
    "id": actionId,
    "storeId": getStoreId(storeOrStoreId),
    "event": event
  });
}

export function storeActionAuthorised(store, actionId) {
  return store.getIn(["actions", actionId, "authorised"]);
}

export function authoriseEventHandler(primaryEventHandler, store, actionId) {
  primaryEventHandler.authorised = storeActionAuthorised(store, actionId);
  return primaryEventHandler;
}

export function fieldDisabled(props) {
  if (props.disabled === true) {
    return true; //disabled
  }
  //disabled if access rights of user does not allow for update or create
  if (!R.isNil(props.access) && R.is(Object, props.access)) {
    if (!props.access.update && !props.access.create) {
      return true; //disabled
    }
  }
  //disabled if user does have access rights but the access mode is read
  if (props.accessMode === "read") {
    return true; //disabled
  }
  return false; //enabled
}

export function isCreateMode(activeRecord) {
  return activeRecord.has('id') && activeRecord.getIn(['id', 'value']) === null;
}

export function getEventHandlerByAccessMode(actions, store, activeRecord) {
  if (isCreateMode(activeRecord)) {
    return getEventHandler(actions, store, "create");
  }
  return getEventHandler(actions, store, "update");
}

export function changeAccordianPage(actions, storeOrStoreId, currentPage, page) {
  const store = getStoreId(storeOrStoreId);
  eventHandler(
    actions, store, 'onSetIn',
    createSyntheticEvent(
      'update',
      currentPage === page ? null : page,
      ['stores', store, 'props', 'accordian', 'currentPage']
    )
  );
}

export function getExportFileName(store, recordName) {
  if (!R.isNil(store) && !R.isNil(recordName)) {
    const _recordName = recordName + "Records_"
    const fileName =  _recordName + store.getIn(["props", "customerVehicle", "exportTimeStamp"]);
    return fileName + ".csv";
  }
  return null;
}
