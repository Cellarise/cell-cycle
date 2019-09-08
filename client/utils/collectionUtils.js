"use strict";
import R from 'ramda';
import Immutable from 'immutable';
import {resetRecords} from '../libraries/storeResets';
import * as recordUtils from './recordUtils';
import {userHasRole} from './authHelpers';


function setFilterModel(model, result) {
  const queryData = R.defaultTo({}, result.data);
  const filter = R.defaultTo([], queryData.filter);
  const fieldGroups = R.defaultTo([], queryData.fieldGroups);
  const fieldSpecs = R.defaultTo([], queryData.fieldSpecs);
  let filterModel = model.getIn(["stores", result.storeId, "collection", "filterModel"]);

  //clear filterModel
  filterModel = clearFilterModel(filterModel);

  //add models for each field in filter
  if (filter.length > 0) {
    filterModel = addFilterModels(filterModel, filter);
  }

  //set filter model columns for editing
  if (fieldSpecs.length > 0) {
    filterModel = collectionUtils.setFilterModelColumns(filterModel, fieldGroups, fieldSpecs, filter);
  }

  return filterModel;
}

function clearFilterModel(filterModel) {
  return filterModel
    .filter((item, key) => {
      return R.contains(key, ["_updatedFilter", "_modelTemplate", "_filterName"]);
    });
}

function addFilterModels(filterModel, filter) {
  let nextFilterModel = filterModel;
  const modelTemplate = nextFilterModel.get('_modelTemplate');
  R.forEach(
    (filterField) => {
      const whereValue = R.defaultTo(null, filterField.where);
      nextFilterModel = nextFilterModel.set(
        filterField.field,
        modelTemplate
          .set('id', filterField.field)
          .set('name', filterField.field)
          .set('label', filterField.label)
          .set('className', filterField.className)
          .set('renderer', filterField.renderer)
          .set('description', filterField.description)
          .set('help', filterField.help)
          .set('fullTextSearch', filterField.fullTextSearch)
          .set('wildcardSearch', filterField.wildcardSearch)
          .set('width', filterField.width)
          .set('value', whereValue)
          // .set('foreignValue', R.defaultTo({}, whereValue).foreignValue)
          .set('type', filterField.type)
          .set('validation', Immutable.fromJS(R.defaultTo({}, filterField.validation)))
      );
    },
    filter
  );
  return nextFilterModel;
}


const collectionUtils = {
  "setFilterModelColumns": function setFilterModelColumns(filterModel, fieldGroups, fieldSpecs, filter) {
    let nextFilterModel = filterModel;
    const availableColumns = R.filter(
      (fieldSpec) => (fieldSpec.hidden !== true), fieldSpecs
    );

    return nextFilterModel
      .setIn(["_updatedFilter", "groups"], Immutable.fromJS(fieldGroups))
      .setIn(["_updatedFilter", "records"], Immutable.fromJS(availableColumns))
      .setIn(["_updatedFilter", "value"], Immutable.fromJS(filter));
  },
  /**
   * Set store model from collection based on props.id. If props.id is not found in collection.records then no change.
   * @param {Immutable} model - current model
   * @param {Object} action - the action
   * param {Object} drivers - map containing drivers for triggering events
   * @return {Immutable} - the next model with the current store model set from collection based on props.id.
   */
  "setModelFromCollection": function setModelFromCollection(model, action) {
    var primaryKeyId = model.getIn(["stores", action.storeId, "props", "id"]);
    var collectionRecords = R.defaultTo([], model.getIn(["stores", action.storeId, "collection", "records"]));
    return collectionUtils.setModelFromActiveRecordIndex(model.setIn(
      ["stores", action.storeId, "collection", "activeRecordIndex"],
      R.findIndex((row) => (row.id === primaryKeyId), collectionRecords)
      ),
      action
    );
  },
  /**
   * Set store model from collection based on activeRecord.
   * @param {Immutable} model - current model
   * @param {Object} action - the action
   * param {Object} drivers - map containing drivers for triggering events
   * @return {Immutable} - the next model with the current store model set from collection based on props.id.
   */
  "setModelFromActiveRecordIndex": function setModelFromActiveRecordIndex(model, action) {
    var collectionRecords = R.defaultTo([], model.getIn(["stores", action.storeId, "collection", "records"]));
    var syncWithRecords = model.getIn(["stores", action.storeId, "collection", "syncWithRecords"]);
    var records = model.getIn(["stores", action.storeId, "records"]);
    var currentModelIndex = model.getIn(["stores", action.storeId, "collection", "activeRecordIndex"]);
    var activeRecordIndex = syncWithRecords ? currentModelIndex : 0;
    var displayField = R.defaultTo(
      'name',
      model.getIn(['stores', action.storeId, 'collection', 'recordDisplayField'])
    );
    if (currentModelIndex === -1 || currentModelIndex > collectionRecords.length) {
      return model;
    }
    if (syncWithRecords) {
      //assumes collectionModelRecords in sync with collectionRecords (collection mutated by upsert and remove only)
    } else {
      records = records.set(activeRecordIndex, recordUtils.setRecordValues(
        model.getIn(["stores", action.storeId]),
        collectionRecords[currentModelIndex]
      ));
    }
    return model
      .setIn(["stores", action.storeId, "records"], records)
      .setIn(["stores", action.storeId, "props", "id"], records.getIn([activeRecordIndex, 'id', 'value']))
      .setIn(["stores", action.storeId, "props", "activeRecordIndex"], activeRecordIndex)
      .setIn(["stores", action.storeId, "collection", "search", "term"], records
        .getIn([activeRecordIndex, displayField, 'value'])
      );
  },
  /**
   * Set collection records based on response result
   * @param {Immutable} model - current model
   * @param {Object} result - the result
   * param {Object} drivers - map containing drivers for triggering events
   * @return {Immutable} - the next model with collection records set based on response result
   */
  "setSearchResult": function setSearchResult(model, result) {
    let nextModel = model;
    const searchData = R.defaultTo({}, result.data);
    let searchCount = 0, searchHasPrev = false, searchHasNext = false, searchResults = [];
    if (R.isNil(result.error) && !R.isNil(searchData.results) && R.is(Array, searchData.results)) {
      searchResults = searchData.results;
      searchCount = R.defaultTo(0, searchData.count);
      searchHasPrev = R.defaultTo(false, searchData.hasPrev);
      searchHasNext = R.defaultTo(false, searchData.hasNext);
    }
    nextModel = nextModel
      .setIn(["stores", result.storeId, "collection", "records"], searchResults)
      .setIn(["stores", result.storeId, "collection", "recordCount"], searchCount)
      .setIn(["stores", result.storeId, "collection", "hasPrev"], searchHasPrev)
      .setIn(["stores", result.storeId, "collection", "hasNext"], searchHasNext)
      .setIn(["stores", result.storeId, "collection", "activeRecordIndex"], -1);
    if (nextModel.getIn(["stores", result.storeId, "collection", "syncWithRecords"]) && searchResults.length === 0) {
      //set blank record
      nextModel = resetRecords(nextModel, result);
    } else if (nextModel.getIn(["stores", result.storeId, "collection", "syncWithRecords"])
      && searchResults.length > 0) {
      //set records
      nextModel = nextModel.setIn(
        ["stores", result.storeId, "records"],
        recordUtils.recordsFromJS(nextModel.getIn(["stores", result.storeId]), searchResults)
      );
    }
    return nextModel;
  },
  /**
   * Set collection records based on response result
   * @param {Immutable} model - current model
   * @param {Object} result - the result
   * param {Object} drivers - map containing drivers for triggering events
   * @return {Immutable} - the next model with collection records set based on response result
   */
  "setQueryLookupResult": function setQueryLookupResult(model, result) {
    let nextModel = model;
    const queryData = R.defaultTo({}, result.data);
    let refreshCounter;
    if (R.isNil(result.error) && !R.isNil(queryData.results) && R.is(Array, queryData.results)) {
      const activeAccountType = model.getIn(['stores', 'authenticationUI', 'savedSettings', 'activeAccountType']);
      const isAccountUser = userHasRole(
        model.getIn(['stores', 'authenticationUI', 'props']), "User (general)", activeAccountType + "Account"
      );
      const isAccountAdmin = userHasRole(
        model.getIn(['stores', 'authenticationUI', 'props']), "Administrator", activeAccountType + "Account"
      );
      const isSystemAdmin = userHasRole(
        model.getIn(['stores', 'authenticationUI', 'props']), "System Administrator", "operationsAccount"
      );
      const querySpecs = R.defaultTo([], queryData.querySpecs);
      const rawFieldSpecs = R.defaultTo([], queryData.fieldSpecs);
      const selectedQuerySpec = R.defaultTo({}, R.find((querySpec) => (querySpec.selected === true), querySpecs));
      const editableFilter =
        (isAccountAdmin && selectedQuerySpec.level === "account" || selectedQuerySpec.locked !== true) ||
        (isSystemAdmin && selectedQuerySpec.level === "system");
      let labelColumnSpec = R.find((fieldSpec) => (fieldSpec.field === queryData.labelColumn), rawFieldSpecs);
      let pictureColumnSpec = R.find((fieldSpec) => (fieldSpec.field === queryData.pictureColumn), rawFieldSpecs);
      refreshCounter = R.defaultTo(0, nextModel.getIn(["stores", result.storeId, "collection", "refreshCounter"]));
      nextModel = nextModel
        .setIn(["stores", result.storeId, "collection", "addFilterFlag"], false)
        .setIn(["stores", result.storeId, "collection", "editFilterFlag"], false)
        .setIn(["stores", result.storeId, "collection", "editableFilter"], editableFilter)
        .setIn(["stores", result.storeId, "collection", "editableAccountFilter"], editableFilter && isAccountAdmin)
        .setIn(["stores", result.storeId, "collection", "editableSystemFilter"], editableFilter && isSystemAdmin)
        .setIn(["stores", result.storeId, "collection", "selectedQuerySpec"], selectedQuerySpec)
        .setIn(["stores", result.storeId, "collection", "view"], selectedQuerySpec.view)
        .setIn(["stores", result.storeId, "collection", "chart"], queryData.chart)
        .setIn(["stores", result.storeId, "collection", "name"], queryData.name)
        .setIn(["stores", result.storeId, "collection", "icon"], queryData.icon)
        .setIn(["stores", result.storeId, "collection", "label"], queryData.label)
        .setIn(["stores", result.storeId, "collection", "views"], queryData.views)
        .setIn(["stores", result.storeId, "collection", "labelColumnSpec"], labelColumnSpec)
        .setIn(["stores", result.storeId, "collection", "pictureColumnSpec"], pictureColumnSpec)
        .setIn(["stores", result.storeId, "collection", "exportable"], queryData.exportable === true && isAccountUser)
        .setIn(["stores", result.storeId, "collection", "customisable"], queryData.customisable === true)
        .setIn(["stores", result.storeId, "collection", "account"],
          (isAccountAdmin && selectedQuerySpec.level === "account" && selectedQuerySpec.locked === true) ||
          (isSystemAdmin && selectedQuerySpec.level === "system" && selectedQuerySpec.locked === true)
        )
        .setIn(["stores", result.storeId, "collection", "locked"], selectedQuerySpec.locked)
        .setIn(["stores", result.storeId, "collection", "filterModel"], setFilterModel(model, result))
        .setIn(["stores", result.storeId, "collection", "exportCounter"], 0) //reset export on each refresh
        .setIn(["stores", result.storeId, "collection", "refreshCounter"], refreshCounter + 1)
        .setIn(["stores", result.storeId, "collection", "records"], R.defaultTo([], queryData.results))
        .setIn(["stores", result.storeId, "collection", "recordCount"], R.defaultTo(0, queryData.count))
        .setIn(["stores", result.storeId, "collection", "selectedAll"], false)
        .setIn(["stores", result.storeId, "collection", "filter"], Immutable.fromJS(R.defaultTo([], queryData.filter)))
        .setIn(["stores", result.storeId, "collection", "filterName"], queryData.filterName)
        .setIn(["stores", result.storeId, "collection", "page"], R.defaultTo(1, queryData.page))
        .setIn(["stores", result.storeId, "collection", "pageSize"], R.defaultTo(20, queryData.pageSize))
        .setIn(["stores", result.storeId, "collection", "fieldGroups"], R.defaultTo([], queryData.fieldGroups))
        .setIn(["stores", result.storeId, "collection", "fieldSpecs"], R.defaultTo([], queryData.fieldSpecs))
        .setIn(["stores", result.storeId, "collection", "querySpecs"], querySpecs);
    } else if (R.defaultTo([], queryData.results).length === 0) {
      //set blank record
      nextModel = resetRecords(nextModel, result);
    }
    return nextModel;
  },
  /**
   * Set collection records based on response result
   * @param {Immutable} model - current model
   * @param {Object} result - the result
   * param {Object} drivers - map containing drivers for triggering events
   * @return {Immutable} - the next model with collection records set based on response result
   */
  "setSearchLookupResult": function setSearchLookupResult(model, result) {
    let nextModel = model;
    const searchData = R.defaultTo({}, result.data);
    let searchCount = 0, searchResults = [];
    if (R.isNil(result.error) && !R.isNil(searchData.results) && R.is(Array, searchData.results)) {
      searchResults = searchData.results;
      searchCount = R.defaultTo(0, searchData.count);
    }
    nextModel = nextModel
      .setIn(["stores", result.storeId, "search", "records"], searchResults)
      .setIn(["stores", result.storeId, "search", "recordCount"], searchCount);
    if (searchResults.length === 0) {
      //set blank record
      nextModel = resetRecords(nextModel, result);
    }
    return nextModel;
  },
  /**
   * Set collection records based on response result
   * @param {Immutable} model - current model
   * @param {Object} result - the result
   * param {Object} drivers - map containing drivers for triggering events
   * @return {Immutable} - the next model with collection records set based on response result
   */
  "setCollectionRecords": function setCollectionRecords(model, result) {
    var nextModel = model;
    var resultData = [];
    if (result.error) {
      resultData = [];
    } else if (result.data && R.is(Array, result.data)) {
      resultData = result.data;
    }
    nextModel = nextModel
      .setIn(["stores", result.storeId, "collection", "records"], resultData)
      .setIn(["stores", result.storeId, "collection", "activeRecordIndex"], -1);
    if (nextModel.getIn(["stores", result.storeId, "collection", "syncWithRecords"]) && resultData.length === 0) {
      //set blank record
      nextModel = resetRecords(nextModel, result);
    } else if (nextModel.getIn(["stores", result.storeId, "collection", "syncWithRecords"]) && resultData.length > 0) {
      //set records
      nextModel = nextModel.setIn(
        ["stores", result.storeId, "records"],
        recordUtils.recordsFromJS(nextModel.getIn(["stores", result.storeId]), resultData)
      );
    }
    return nextModel;
  },
  /**
   * Set collection records based on response result and set recordCount
   * @param {Immutable} model - current model
   * @param {Object} result - the result
   * param {Object} drivers - map containing drivers for triggering events
   * @return {Immutable} - the next model with collection records set based on response result
   */
  "setCollectionRecordsAndCount": function setCollectionRecordsAndCount(model, result) {
    var nextModel = model;
    var resultData = [];
    if (result.error) {
      resultData = [];
    } else if (result.data && R.is(Array, result.data)) {
      resultData = result.data;
    }
    nextModel = nextModel
      .setIn(["stores", result.storeId, "collection", "records"], resultData)
      .setIn(["stores", result.storeId, "collection", "recordCount"], resultData.length)
      .setIn(["stores", result.storeId, "collection", "activeRecordIndex"], -1);
    if (nextModel.getIn(["stores", result.storeId, "collection", "syncWithRecords"]) && resultData.length === 0) {
      //set blank record
      nextModel = resetRecords(nextModel, result);
    } else if (nextModel.getIn(["stores", result.storeId, "collection", "syncWithRecords"]) && resultData.length > 0) {
      //set records
      nextModel = nextModel.setIn(
        ["stores", result.storeId, "records"],
        recordUtils.recordsFromJS(nextModel.getIn(["stores", result.storeId]), resultData)
      );
    }
    return nextModel;
  },
  /**
   * Get child records from an array of parent records
   * @param {Array} arr - the parent record array
   * @param {String} childField - the field containing the child record
   * @return {Array} - the child records
   */
  "getChildRecordsFromArray": function getChildRecordsFromArray(arr, childField) {
    return R.map(R.prop(childField), arr);
  }
};

module.exports = collectionUtils;
