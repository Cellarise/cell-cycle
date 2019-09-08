"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from 'ramda';
import classnames from 'classnames';

module.exports = createReactClass({
  "displayName": "layouts/container/accordian",
  "propTypes": {
    "id": PropTypes.string.isRequired,
    "className": PropTypes.string,
    "defaultActiveKey": PropTypes.number
  },
  "getDefaultProps": function getDefaultProps() {
    return {
      "defaultActiveKey": null
    };
  },
  "render": function render() {
    return (
      <div id={this.props.id}
           role="tablist"
           aria-multiselectable="true"
           className={classnames("panel-group", this.props.className)}>
        {this.renderChildren(this.props)}
      </div>
    );
  },
  "renderChildren": function renderChildren(props) {
    var {children, defaultActiveKey, id, ...otherProps} = props;
    var idx = -1;
    return React.Children.map(children, child => {
        idx = idx + 1;
        return React.cloneElement(child, R.merge(otherProps, {
          "active": idx === defaultActiveKey,
          "collapsable": true,
          "data-parent": id,
          "data-target": id + "-" + idx
        }));
      }
    );
  }
});
