"use strict";
import React from 'react'; //eslint-disable-line  no-unused-vars
import {renderChildren} from '../utils/reactUtils';


function Section(props) {
  return (
    <section>
      {renderChildren(props.children, props)}
    </section>
  );
}

Section.displayName = "Section";
/**
 * @ignore
 */
module.exports = Section;
