import R from "ramda";
import {isImmutable} from '../utils';

export function labelWithUom(field) {
  if (isImmutable(field)) {
    if (field.hasIn(['validation', 'uom'])) {
      return field.get('label') + " (" + field.getIn(['validation', 'uom']) + ")";
    }
    return R.defaultTo("", field.get('label'));
  }
  if (field.label && field.validation && field.validation.uom) {
    return field.label + " (" + field.validation.uom + ")";
  }
  return R.defaultTo("", field.label);
}

export function valueWithUom(field) {
  let value = "";
  if (isImmutable(field)) {
    value = field.get('value');
    if (value && field.hasIn(['validation', 'uom'])) {
      return value + field.getIn(['validation', 'uom']);
    }
    return R.defaultTo("", value);
  }
  if (field) {
    value = field.value;
  }
  if (value && field && field.validation && field.validation.uom) {
    return value + field.validation.uom;
  }
  return R.defaultTo("", value);
}
