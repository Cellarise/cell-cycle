import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types'; //eslint-disable-line
import {formattedDateTime} from '../utils';


export function routePlannerUrl(routeId, routeVersion, applicationId) {
  let url = "/#page=informationHub/routePlannerTool";
  if (routeId) {
    url += "&route-id=" + routeId;
    if (routeVersion) {
      url += "&route-version=" + routeVersion;

      if (applicationId) {
        url += "&application-id=" + applicationId;
      }
    }
  }
  return url;
}

export function routeFormatter(routeId, routeVersion) {
  const idPart = (R.defaultTo('', routeId) + '').toUpperCase();
  const versionPart = routeVersion ? " v" + routeVersion : '';
  return idPart ? idPart + versionPart + '' : '';
}

export function routeLinkFormatter(routeId, routeVersion, applicationId) {
  return <a href={routePlannerUrl(routeId, routeVersion, applicationId)} target="_blank" rel="noopener noreferrer">
    {routeFormatter(routeId, routeVersion)} <span className="glyphicon mdi-open-in-new"></span>
  </a>;
}

export function routeDateTime(routeVersions, routeVersion) {
  const version = R.find(v => (v.version === routeVersion), routeVersions);
  if (!version) {
    return "";
  }
  return formattedDateTime(version.date);
}


export function jurisdictionsFormatter(value) {
  return value.filter(j => j.getIn(['item', 'value'])).map(j => j.getIn(['label', 'value'])).join(", ");
}

export function operatingMassAccessLevelFormatter(value) {
  if (value) {
    return "✓";
  }
}
