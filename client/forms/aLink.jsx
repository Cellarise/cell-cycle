"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import {createALink} from "../libraries/router";


/**
 * A link component
 * @param {Object} props - component properties
 * @param {String} props.text - link text
 * @param {String} [props.hashStr] - hash string for local page links
 * @param {String} [props.href] - link
 * @param {String} [props.rel] - security tags for opening link
 * @param {String} [props.className] - classes to add to a link
 * @param {String} [props.style] - styles to add to a link
 * @return {React.Element} react element
 */
function ALink({text, href, hashStr, className, rel, openInNew, inputBoxLink}) {
  return (
    <a
      href={R.defaultTo(createALink(hashStr), href)}
      target={openInNew && !inputBoxLink ? "_blank" : null}
      rel={openInNew && !inputBoxLink ? rel : null}
      className={className}
      style={inputBoxLink ? {"color": "#313435"} : null}
    >{text}{openInNew && !inputBoxLink ? <span className="glyphicon mdi-open-in-new" /> : null}</a>
  );
}
ALink.displayName = "ALink";
ALink.propTypes = {
  "text": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  "href": PropTypes.string,
  "hashStr": PropTypes.string,
  "rel": PropTypes.string,
  "className": PropTypes.string,
  "openInNew": PropTypes.bool
};
ALink.defaultProps = {
  "text": "",
  "href": null,
  "hashStr": "",
  "rel": "noopener noreferrer",
  "className": "",
  "openInNew": true,
  "inputBoxLink": false
};
/**
 * @ignore
 */
module.exports = ALink;
