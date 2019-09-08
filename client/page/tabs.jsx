"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from 'ramda';
import classnames from 'classnames';
import tabUtils from './tabUtils.jsx';
import {getInvalidPagesFromValidationConfig} from '../utils/recordUtils';


module.exports = createReactClass({
  "displayName": "layouts/tabbed/tabs",
  "propTypes": {
    "id": PropTypes.string.isRequired,
    //validation
    "validationConfig": PropTypes.object,
    "activeKey": PropTypes.number,
    "className": PropTypes.string,
    "classNameTabHead": PropTypes.string,
    "classNameTabNav": PropTypes.string,
    "classNameTab": PropTypes.string,
    "classNameTabPane": PropTypes.string,
    "pagesWithErrors": PropTypes.array,
    "tabs": PropTypes.object,
    "onTabChange": PropTypes.func,
    "startIndex": PropTypes.number,
    "cardStyle": PropTypes.bool,
    "tools": PropTypes.object
  },
  "getDefaultProps": function getDefaultProps() {
    return {
      "startIndex": 0,
      "classNameTabNav": "nav nav-tabs",
      "classNameTab": "",
      "classNameTabPane": "",
      "cardStyle": false
    };
  },
  "getInitialState": function getInitialState() {
    return {
      "activeKey": 0
    };
  },
  "render": function render() {
    var {className, classNameTabHead, validationConfig, pagesWithErrors, collapsable, ...tabProps} = this.props;
    var {onTabChange, tabs, ...paneProps} = tabProps;
    let activeKey = this.props.activeKey ? this.props.activeKey : this.state.activeKey;
    //Get validation status of all fields and check pages with invalid fields
    const _pagesWithErrors = pagesWithErrors
      ? pagesWithErrors
      : getInvalidPagesFromValidationConfig(validationConfig ? validationConfig.toJS() : []);
    if (!R.isNil(onTabChange) && !R.isNil(tabs)) {
      activeKey = tabs.get('currentPage');
    } else {
      tabProps.onTabChange = (event) => {
        event.preventDefault();
        //@todo check if unmounted
        this.setState({"activeKey": JSON.parse(event.currentTarget.getAttribute("data-value")).moveToIndex});
      };
    }
    return (
      <div id={this.props.id}
           role="navigation"
           aria-multiselectable="true"
           className={classnames(this.props.cardStyle ? "card" : "", className)}>
        <div className={classnames(this.props.cardStyle ? "card-head" : "", classNameTabHead)}
             style={this.props.styleTabHead}
             data-parent={collapsable ? "#" + this.props.id + "tabParent" : null}
             data-toggle={collapsable ? "collapse" : null}
             data-tabcollapse={collapsable ? "true" : null}
             data-target={collapsable ? "#" + this.props.id + "tabTarget" : null}
             aria-expanded={collapsable ? true : null}
        >
          {renderHeaderTools(this.props)}
          {tabUtils.renderTabs(tabProps, activeKey, _pagesWithErrors, (label) => (label))}
        </div>
        <div id={this.props.id + "tabTarget"} className={collapsable ? "collapse in" : null}>
          {tabUtils.renderTabPanes(paneProps, activeKey)}
        </div>
      </div>
    );
  }
});

function renderHeaderTools(props) {
  return (
    <div className="tools"
         style={{"zIndex": 999}}>
      {props.tools}
      {!props.collapsable ? null :
        <a className="btn btn-icon-toggle"
           title="Click to expand or collapse section"
           data-placement="left"
           data-toggle="tooltip"
        >
          <span className="glyphicon mdi-chevron-down mdi-lg"/>
        </a>}
    </div>
  );
}
