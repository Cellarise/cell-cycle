"use strict";
import R from "ramda";

export function tabLabel(label, classNames) {
  const _classNames = R.defaultTo("", classNames);
  if (_classNames.indexOf("active") !== -1) {
    return label + " is active";
  }
  if (_classNames.indexOf("done") !== -1) {
    return label + " is complete";
  }
  if (_classNames.indexOf("error") !== -1) {
    return label + " contains errors";
  }
  return label;
}
export function menuLink(label){ return 'The ' + label + ' page'; }
export function menuPanelLink(label){ return 'Open the ' + label + ' page'; }
export function cardLink(label){ return 'A link to the ' + label; }
export function activateLink(label){ return 'Activate the ' + label; }
export function toggleLink(label) { return 'Toggle the ' + label; }
export function checkBox(label) { return 'A checkbox to toggle ' + label; }
export function icon(label) { return label; }
export function input(label) { return label; }
