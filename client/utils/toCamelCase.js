"use strict";


export function toCamelCase(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, function rep(match, index) {
    if (+match === 0) {
      return ""; // or if (/\s+/.test(match)) for white spaces
    }
    return index === 0 ? match.toLowerCase() : match.toUpperCase();
  });
}

export function fromCamelCase(str) {
  return str.trim().replace(/([A-Z]+)/g, " $1").trim();
}
