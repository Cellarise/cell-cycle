import accounting from 'accounting';
import {toNumber} from '../utils';

/*
 * Formats the number to a file size representation (e.g. 1500 yields 1.5 KB).
 *
 * Derived from https://github.com/emcien/number-helpers-coffeescript/blob/master/src/number_helpers.coffee
 *
 * @number [Number] the number to format
 * @options precision [Number] sets the fractional precision of the number (defaults to 2)
 * @returns [String] file size with label
 */
export function numberToFileSize(number, options = {}) {
  const precision = options.precision || 2;

  // Power of 10 to Bytes Converter
  if (number > 1000)          { number = number / 1.024; }
  if (number > 1000000)       { number = number / 1.024; }
  if (number > 1000000000)    { number = number / 1.024; }
  if (number > 1000000000000) { number = number / 1.024; }

  // Remove the sign of the number for easier comparision
  const absFloat = Math.abs(number);

  // Less than Thousand does not need text or a insignifiant digits
  let denom, label;
  if (absFloat < Math.pow(10, 3)) {
    denom = 1;
    label = 'Bytes';
  } else if (absFloat >= Math.pow(10, 3) && absFloat < Math.pow(10, 6)) {
    denom = Math.pow(10, 3);
    label = 'KB';
  } else if (absFloat >= Math.pow(10, 6) && absFloat < Math.pow(10, 9)) {
    denom = Math.pow(10, 6);
    label = 'MB';
  } else if (absFloat >= Math.pow(10, 9) && absFloat < Math.pow(10, 12)) {
    denom = Math.pow(10, 9);
    label = 'GB';
  } else if (absFloat >= Math.pow(10, 12) && absFloat < Math.pow(10, 15)) {
    denom = Math.pow(10, 12);
    label = 'TB';
  }

  // Process the number into a presentable format
  const present = number / denom;
  let precise = present;
  if (denom > 1) { // Bytes doesn't need fractional part
    precise = present.toFixed(precision);
  }

  return precise + " " + label;
}

export function toFixed(number, decimalPlaces) {
  return accounting.unformat(accounting.toFixed(toNumber(number), decimalPlaces));
}


export function formatNumber(number) {
  return accounting.formatNumber(number);
}
