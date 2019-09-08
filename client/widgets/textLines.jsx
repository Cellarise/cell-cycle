"use strict";
import React from "react"; // eslint-disable-line no-unused-vars


export function TextLines(props) {
  return (
    <span>
      {props.text && props.text.split("\n").map((split, index) => <span key={index}>{split}<br /></span>)}
    </span>
  );
}

export default TextLines;
