import R from 'ramda';
import {getValue} from './domDriverUtils';
import {getActiveRecord, setActiveRecord} from './recordUtils';
import {mergeDeepL2} from '../utils';


export function getTourProgress(model, pageSpec) {
  const tours = pageSpec.get('tours');
  let tourProgress = model.getIn(['stores', 'routerUI', 'props', 'tourProgress']);
  const activeAccountType = model.getIn(['stores', 'authenticationUI', 'savedSettings', 'activeAccountType']);
  const pageLabels = model.getIn(['stores', 'routerUI', 'props', 'pageLabels']);
  const pageLabelsJS = R.isNil(pageLabels) ? [] : pageLabels.toJS();
  const userToursProgress = model.getIn(['stores', 'userModelUI', 'records', 0, 'tours', 'value']);
  if (R.isNil(tours) || tours.size === 0) {
    if (tourProgress.size === 0) {
      return tourProgress;
    }
    return tourProgress.clear();
  }

  const availableTours = tours.filter((tour) => {
    if (tour.hasIn(['blacklist', 'accountTypes'])) {
      return tour
          .getIn(['blacklist', 'accountTypes'])
          .findIndex((accountType) => (accountType === activeAccountType)) === -1;
    }
    if (tour.hasIn(['whitelist', 'accountTypes'])) {
      return tour
          .getIn(['whitelist', 'accountTypes'])
          .findIndex((accountType) => (accountType === activeAccountType)) > -1;
    }
    if (tour.hasIn(['blacklist', 'labels'])) {
      return tour
          .getIn(['blacklist', 'labels'])
          .findIndex((label) => (R.contains(label, pageLabelsJS))) === -1;
    }
    if (tour.hasIn(['whitelist', 'labels'])) {
      return tour
          .getIn(['whitelist', 'labels'])
          .findIndex((label) => (R.contains(label, pageLabelsJS))) > -1;
    }
    return true;
  });

  tourProgress = tourProgress.filter((tour, key) => (
    availableTours.has(key)
  ));

  availableTours.forEach(
    (tour, key) => {
      const userTourProgress = getUserTourProgress(userToursProgress, activeAccountType, key);
      tourProgress = tourProgress
        .setIn([key, 'completed'], userTourProgress.completed)
        .setIn([key, 'skipped'], userTourProgress.skipped);
    }
  );
  return tourProgress;
}

export function updateUserTourProgress(model, action, drivers, reset = false) {
  let nextModel = model;
  const fieldValue = R.defaultTo({}, getValue(action.event));
  const store = nextModel.getIn(["stores", action.storeId]);
  const activeAccountType = model.getIn(['stores', 'authenticationUI', 'savedSettings', 'activeAccountType']);
  const record = getActiveRecord(store);
  const origTours = R.defaultTo({}, record.getIn(['tours', 'value']));
  const tourUpdate = R.assoc(activeAccountType, fieldValue, {});
  nextModel = nextModel
    .setIn(["stores", action.storeId], setActiveRecord(
      store,
      null,
      record
        .setIn(['tours', 'value'], reset ? {} : mergeDeepL2(origTours, tourUpdate))
    ));

  return nextModel;
}

function getUserTourProgress(userToursProgress, activeAccountType, key) {
  return userToursProgress
  && userToursProgress.hasOwnProperty(activeAccountType)
  && userToursProgress[activeAccountType].hasOwnProperty(key)
    ? userToursProgress[activeAccountType][key]
    : {
    "completed": false,
    "skipped": false
  };
}
