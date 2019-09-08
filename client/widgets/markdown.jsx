"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import marked from 'marked';

marked.setOptions({
  gfm: true,
  tables: false,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false
});

function Markdown({markdown, id, className, style}) {
  /* eslint-disable react/no-danger */
  return (
    <div
      id={id}
      style={style}
      className={className}
      dangerouslySetInnerHTML={createMarkup(markdown)}/>
  );
}
function createMarkup(markdown) {
  return {__html: marked(markdown || "")};
}

Markdown.displayName = "widgets/Markdown";
Markdown.propTypes = {
  "markdown": PropTypes.string
};
/**
 * @ignore
 */
module.exports = Markdown;
