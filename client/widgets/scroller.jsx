"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from 'ramda';
import classnames from 'classnames';
import {$} from '../globals';

module.exports = createReactClass({
  "displayName": "widgets/scroller",
  "propTypes": {
    "id": PropTypes.string.isRequired,
    "alwaysVisible": PropTypes.bool,
    "className": PropTypes.string,
    "classNameBody": PropTypes.string
  },
  "getDefaultProps": function getDefaultProps() {
    return {
      "alwaysVisible": true
    };
  },
  "componentDidMount": function componentDidMount() {
    if (!$().nanoScroller) {
      require('nanoscroller');
    }
    $("#" + this.props.id + "nano").nanoScroller({
      "alwaysVisible": this.props.alwaysVisible,
      "preventPageScrolling": true,
      "iOSNativeScrolling": true
    });
  },
  "componentDidUpdate": function componentDidUpdate() {
    $("#" + this.props.id + "nano").nanoScroller();
  },
  "componentWillUnmount": function componentWillUnmount() {
    $("#" + this.props.id + "nano").nanoScroller({"destroy": true});
  },
  "render": function render() {
    const {className, alwaysVisible, height, ...otherProps} = this.props; //eslint-disable-line no-unused-vars
    let style;
    if (!R.isNil(height)) {
      style = {"height": height < 50 ? 50 : height};
    }
    return (
      <div id={this.props.id + "nano"}
           style={style}
           className={classnames("nano", className, "has-scrollbar")}>
        <div className="nano-content">
          {renderChildren(otherProps)}
        </div>
        <div className="nano-pane">
          <div className="nano-slider"></div>
        </div>
      </div>
    );
  }
});

function renderChildren(props) {
  const {children, classNameBody, ...otherProps} = props;
  return React.Children.map(children, child => {
      if (R.isNil(child)) {
        return null;
      }
      return React.cloneElement(child, R.merge(R.defaultTo({}, otherProps), {
        "className": classNameBody,
        "style": {"height": "auto"}
      }));
    }
  );
}
