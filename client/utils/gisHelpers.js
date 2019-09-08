import R from 'ramda';
import {getAccountTypeLabelPrefix} from './authHelpers';

/**
 * Indicates the type of marker given a current index of the record in a list
 * @param {Number} index current position in the list
 * @param {Number} listLength the number of items in the list
 * @returns {String} type of marker
 */
export function markerType(index, listLength) {
  let type;
  if (index === 0) {
    type = 'start';
  } else if (index === listLength - 1 || index === 1 && listLength < 2) {
    type = 'destination';
  } else {
    type = 'waypoint';
  }
  return type;
}

export function isAlternateRouteSelected(activeRecord) {
  const originalRouteAltId = activeRecord.getIn(['permitApplicationRouteAltId', 'origValue']);
  const newRouteAltId = activeRecord.getIn(['permitApplicationRouteAltId', 'value']);
  if (R.isNil(originalRouteAltId) && R.isNil(newRouteAltId)) {
    return false;
  }
  if (R.isNil(originalRouteAltId) && !R.isNil(newRouteAltId)) {
    return true;
  }
  return originalRouteAltId !== newRouteAltId;
}

export function isAlternateRouteSelectedOrInProgress(activeRecord) {
  return isAlternateRouteSelected(activeRecord) &&
    !R.isNil(activeRecord.getIn(['permitApplicationRouteAltId', 'value']));
}


export function renderAlternateRouteOption(value, records) {
  if (R.isNil(value) || value.length === 0 || !R.is(Array, records) || records.length === 0) {
    return null;
  }
  const suggestionObject = R.find(R.propEq("id", value), records);
  if (R.isNil(suggestionObject)) {
    return null;
  }
  return (suggestionObject.status === "Submission" ? 'Original-' : 'Alternate-' ) +
    suggestionObject.version + ' ' +
    getAccountTypeLabelPrefix(suggestionObject.accountType) +
    (R.isNil(suggestionObject.RMID) || suggestionObject.accountType !== 'partner'
        ? ''
        : ' (' + suggestionObject.RMID + ')'
    );
}
