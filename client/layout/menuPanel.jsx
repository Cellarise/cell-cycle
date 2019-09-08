"use strict";
import React from 'react';
import PropTypes from 'prop-types'; //eslint-disable-line no-unused-vars
import R from 'ramda';
import {menuPanelLink} from '../libraries/accessibility';
import * as routerLibrary from '../libraries/router';

/**
 * MenuPanel component
 * @param {Object} props - component properties
 * @param {String} props.state - the menu state to render
 * @param {Object} props.actions - the this.context.actions passed from parent component
 * @return {React.Element} react element
 */
function MenuPanel({state, actions, className, home, ...otherProps}) {
  if (!R.isNil(home) && home === true) {
    return (
      <div className={className}>
        <a aria-label="Return to home"
           href={routerLibrary.createALink("page=#")}>
          <div className="panel panel-primary">
            <div className="panel-heading menu-panel">
              <div className="row">
                <div className="col-xs-12">
                  <span className={"glyphicon mdi-3x mdi-home"}/>
                  <div className="h4">Home</div>
                </div>
              </div>
            </div>
            <div className="panel-footer height-3 overflow-auto">
              <div className="panel-footer-icon">
                <span className="glyphicon mdi-arrow-left-bold-circle mdi-2x"/>
              </div>
              <div className="">Return back to the home page</div>
            </div>
          </div>
        </a>
      </div>
    );
  }
  return (
    <div className={className +  " " + state.name.replace(/\s+/, "")}>
      <a aria-label={menuPanelLink(state.name)}
         onClick={state.triggerAction
                  ? (event) => {
                    if (R.is(Function, state.triggerAction)) {
                      state.triggerAction(event);
                    } else if (R.is(Object, state.triggerAction)) {
                      actions.push(state.triggerAction);
                    }
                  }
                  : null}
         data-toggle={otherProps["data-toggle"]}
         data-target={otherProps["data-target"]}
         href={routerLibrary.createALink("page=" + state.path)}>
        <div className= "panel panel-primary">
          <div className="panel-heading menu-panel">
            <div className="row">
              <div className="col-xs-12">
                <span className={"glyphicon mdi-3x " + state.icon}/>
                <div className="h4">{state.name}</div>
              </div>
            </div>
          </div>
          <div className="panel-footer height-3 overflow-auto">
            <div className="panel-footer-icon">
              <span className="glyphicon mdi-arrow-right-bold-circle mdi-2x"/>
            </div>
            <div className="">{state.description}</div>
          </div>
        </div>
      </a>
    </div>
  );
}
MenuPanel.displayName = "MenuPanel";
MenuPanel.propTypes = {
  "state": PropTypes.object,
  "actions": PropTypes.object,
  "home": PropTypes.bool,
  "className": PropTypes.string,
  "data-toggle": PropTypes.string,
  "data-target": PropTypes.string
};
MenuPanel.defaultProps = {
  "className": "col-xs-6 col-sm-4 col-md-3 cursor-hand"
};

/**
 * @ignore
 */
module.exports = MenuPanel;
