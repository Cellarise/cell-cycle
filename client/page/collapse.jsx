"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import Card from './card.jsx';

module.exports = createReactClass({
  "displayName": "layouts/container/collapse",
  "propTypes": {
    "id": PropTypes.string.isRequired,
    "className": PropTypes.string,
    "classNameHeader": PropTypes.string,
    "defaultActiveKey": PropTypes.number,
    "accordian": PropTypes.bool
  },
  "getDefaultProps": function getDefaultProps() {
    return {
      "defaultActiveKey": 0,
      "accordian": false
    };
  },
  "render": function render() {
    const {accordian, ...otherProps} = this.props;
    const showChildren = accordian === false || this.props.active === true;
    return (
      <Card
        {...otherProps}
        collapsable={true}
        data-target={this.props.id + "-collapse"}
        >
        {showChildren ? this.props.children : null}
      </Card>
    );
  }
});
