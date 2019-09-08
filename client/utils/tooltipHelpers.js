import React from "react"; //eslint-disable-line no-unused-vars
import R from "ramda";
import {getAccountPictureUrl, getUserProfilePictureUrl} from './fileHelpers';
import {sanitise} from '../utils';


export function tooltipForVehicleComponents(vehicleComponent, customerVehicle, src, imageOffset, imageRearOffset) {
  const _customerVehicles = R.defaultTo([], customerVehicle);
  const top10Registrations = R.take(10, R.reduce((accRegistrations, item) => {
    if (R.isNil(item.registration) || R.isNil(item.state)) {
      return accRegistrations;
    }
    accRegistrations.push(item.registration + " (" + item.state + ")");
    return accRegistrations;
  }, [], _customerVehicles));
  const tooltip = '<div style="max-width: 200px">' +
    '<img src=' + src + ' style="width: 50%;margin-left: -' + (imageOffset / 4) + 'em;' +
    'margin-right: -' + (imageRearOffset / 4) + 'em;" ' +
    'alt=' + sanitise(vehicleComponent.name) + '/><div>' + sanitise(vehicleComponent.name) + '</div>' +
    (_customerVehicles.length === 0 ? '</div>' :
      '<table class="table table-condensed-top-align">' +
      '<thead>' +
      '<tr>' +
      '<th style="text-align: center;">Registration numbers</th>' +
      '</tr>' +
      '</thead>' +
      '<tbody>' +
      '<tr><td style="white-space: normal">' +
      sanitise(top10Registrations.join(" ")) +
      (_customerVehicles.length > 10
          ? ' ... +' + (_customerVehicles.length - 10) + ' more'
          : ''
      ) +
      '</td></tr>' +
      '</tbody>' +
      '</table></div>');
  return tooltip.replace(/,/g, '');
}

export function tooltipForCustomerAccount(account, name) {
  const getImageURL = getAccountPictureUrl(account.fileList);
  return '<div class="hbox-xs">' +
    '<div class="pull-right">' +
    '<div class="hbox-column width-2">' +
    '<img class="profile-image-account-lg center-block pull-left" style="background: #fff" src="' + getImageURL + '" alt="" />' +
    '</div><!--end .hbox-column -->' +
    '</div>' +
    '<div class="hbox-column v-top">' +
    '<div class="clearfix">' +
    '<div class="col-lg-12 margin-bottom-lg">' +
    '<a class="text-lg text-medium opacity-15">' + sanitise(account.name) + '</a>' +
    '</div>' +
    '</div>' +
    '<div class="clearfix">' +
    '<div class="col-lg-12">' +
    '<a class="pull-left text-lg text-medium opacity-15">Legal name: ' + sanitise(R.defaultTo("-", name)) + '</a>' +
    '</div>' +
    '</div>' +
    '<div class="clearfix">' +
    '<div class="col-lg-12">' +
    '<a class="pull-left text-lg text-medium opacity-15">RCN: ' + sanitise(account.RCN) + '</a>' +
    '</div>' +
    '</div>' +
    '<div class="clearfix">' +
    '<div class="col-lg-12">' +
    '<a class="pull-left text-lg text-medium opacity-15">ABN: ' + sanitise(account.ABN) + '</a>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>';
}

export function tooltipForUserAccount(name, phone, fileList, email) {
  const getImageURL = getUserProfilePictureUrl(fileList);
  return '<div class="hbox-xs">' +
    '<div class="pull-right">' +
    '<div class="hbox-column width-2">' +
    '<img class="img-responsive img-circle center-block pull-left" style="background: #fff" src="' + getImageURL + '" alt="" />' +
    '</div><!--end .hbox-column -->' +
    '</div>' +
    '<div class="hbox-column v-top">' +
    '<div class="clearfix">' +
    '<div class="col-lg-12 margin-bottom-lg">' +
    '<a class="text-lg text-medium opacity-15 pull-left">' + sanitise(name) + '</a>' +
    '</div>' +
    '</div>' +
    '<div class="clearfix">' +
    '<div class="col-lg-12">' +
    '<span class="pull-left text-lg text-medium opacity-15">' +
    '<span class="glyphicon mdi-phone mdi-lg"></span> ' + sanitise(phone) + '</span>' +
    '</div>' +
    '</div>' +
    '<div class="clearfix">' +
    '<div class="col-lg-12">' +
    '<span class="pull-left text-lg text-medium opacity-15">' +
    '<span class="glyphicon mdi-email mdi-lg text-lg text-medium"></span> ' + sanitise(email) + '</span>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>';
}
