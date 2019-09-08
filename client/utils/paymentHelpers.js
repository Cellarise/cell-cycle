import React from "react"; //eslint-disable-line no-unused-vars
import R from 'ramda';
import accounting from 'accounting';

export function summaryCodeFormatter(value) {
  if (R.isNil(value)) {
    return "-";
  }
  const map = {
    1: <span className="label label-success">APPROVED</span>,
    2: <span className="label label-danger">DECLINED</span>,
    3: <span className="label label-danger">DECLINED</span>,
    4: <span className="label label-danger">CANCELLED</span>
  };
  return map[value] || value;
}

export function resTextFormatter(value) {
  if (R.isNil(value)) {
    return "-";
  }
  if (value === "Approved") {
    return <span className="label label-success">Approved</span>;
  }
  return <span className="label label-danger">{value}</span>;
}

export function cardNumberFormatter(value) {
  if (R.isNil(value)) {
    return "-";
  }
  return value.substring(0, 4) + " " + value.substring(4, 6) + " ... " + value.substring(7, 10);
}

export function currencyFormatter(value /*, divisor = 1*/) {
  if (R.isNil(value)) {
    return "-";
  }
  return accounting.formatMoney(value);
}
