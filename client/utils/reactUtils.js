"use strict";
import React from 'react';

export function renderChildren(children, props) {
  return React.Children.map(children, child => {
    return React.cloneElement(child, props);
  });
}
