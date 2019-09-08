"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import moment from 'moment';
import classnames from 'classnames';
import R from 'ramda';
import {$, isLowerEnvironment, devOrTestMode} from '../globals';
import * as routerLibrary from '../libraries/router';
import * as aria from '../libraries/accessibility';
import {renderMenuUnnest} from './routeMenu';
import {onMenubarUpdate, onMenuToggle, onMenuItemClick} from './menubarUtils';


const Menubar = createReactClass({
  displayName: "layouts/menu/menubar",
  propTypes: {
    pagePath: PropTypes.string,
    routes: PropTypes.object,
    windowDimensions: PropTypes.object,
    copyright: PropTypes.string.isRequired,
    buildTimestamp: PropTypes.string.isRequired,
    build: PropTypes.string.isRequired,
    version: PropTypes.string.isRequired
  },
  componentDidMount: function componentDidMount() {
    const props = this.props;
    if (!$().nanoScroller) {
      require('nanoscroller');
    }

    // Add the nanoscroller
    $('.menubar-scroll-panel').closest('.nano')
      .nanoScroller({"preventPageScrolling": true, "iOSNativeScrolling": true});

    //set menu state
    onMenubarUpdate(props, props);
  },
  componentDidUpdate: function componentDidUpdate(prevProps) {
    const props = this.props;
    //set menu state
    onMenuToggle(prevProps.menuToggle === true, props.menuToggle === true);
    onMenubarUpdate(prevProps, props);
    $('.menubar-scroll-panel').closest('.nano').nanoScroller({"destroy": true});
    $('.menubar-scroll-panel').closest('.nano')
      .nanoScroller({"preventPageScrolling": true, "iOSNativeScrolling": true});
  },
  componentWillUnmount: function componentWillUnmount() {
    $('.menubar-scroll-panel').closest('.nano').nanoScroller({"destroy": true});
  },
  render: function render() {
    const {routes, actions, secureTokenRoute,
      pagePath, name, copyright, version, build, buildTimestamp, windowDimensions} = this.props;
    const routesJS = routes.toJS();
    const scrollHeight = windowDimensions.get('height') - 50;

    if (secureTokenRoute === true) {
      return null;
    }
    return (
      <div id="menubar" className="menubar-inverse animate hidden-print" role="navigation">
        <div className="menubar-fixed-panel">
          <div>
            <a aria-label={aria.toggleLink("menu bar")}
               className="btn btn-icon-toggle btn-default menubar-toggle"
               onClick={() =>  {
                 onMenuToggle();
               }}
               onKeyPress={(event) => {
                 if (event.key === "ENTER") {
                   onMenuToggle();
                 }
               }}
               data-toggle="menubar">
              <span className="glyphicon mdi-menu mdi-lg"/>
            </a>
          </div>
          <div className="expanded">
            <a href="#">
              <span className="text-lg text-bold text-primary ">{name}</span>
            </a>
          </div>
        </div>
        <div className="nano" style={{"height": scrollHeight}}>
          <div className="nano-content">
            <div className="menubar-scroll-panel" style={{"paddingBottom": 50}}>
              <ul id="main-menu" className="gui-controls gui-controls-tree">
                {renderLevel0(actions, routesJS, pagePath)}
                {renderLevel1(actions, routesJS[0].routes, pagePath)}
              </ul>
              <div className="menubar-foot-panel">
                <small className="hidden-folded">
                  <span className="opacity-75">{copyright}</span>
                  <br/>
                  <span className="opacity-75" style={{"fontSize": "10px"}}>{
                    "Version: " + version + " - " + build
                  }</span>
                  <br/>
                  <span className="opacity-75" style={{"fontSize": "10px"}}>{
                    "Released: " + moment(buildTimestamp).format("DD MMM YY HH:mm")
                  }</span>
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
});

function renderLevel0(actions, routes, pagePath) {
  return (
    <li onClick={onMenuItemClick}
        className={(pagePath.replace("page=", "") === "" ? " active" : "")}>
      <a aria-label={aria.menuLink("Home")}
         href="/#">
        <div data-toggle="tooltip" data-placement="right"
             data-original-title="Home" className="gui-icon"><span className="glyphicon mdi-home"/></div>
        <span className="title">Home</span>
      </a>
    </li>
  );
}

function renderLevel1(actions, routes, pagePath) {
  return renderMenuUnnest((route, idx, _actions) => {
    return renderLevel1Component(route, idx, _actions, pagePath);
  }, actions, routes, {
    "hide": false,
    "userDropdown": false,
    "accountDropdown": false,
    "menuSkip": true
  });
}

function renderLevel1Component(route, idx, actions, pagePath) {
  const homePageSelected = pagePath.replace("page=", "") === "";
  const subRoutes = R.pipe(
    R.filter(route => {
        if (!isLowerEnvironment) {
          if (route.hideInUpperEnvironment === true) {
            return false;
          }
        }
        return true;
      }
    ),
    R.filter(R.propEq('authorised', true)),
    R.filter(R.propEq('hide', false))
  )(R.defaultTo([], route.routes));
  return (
    <li key={idx}
        className={classnames({
          "gui-folder": subRoutes.length > 0,
          "active": pagePath.replace("page=", "").indexOf(route.path) === 0,
          "menubarExpanded": pagePath.replace("page=", "").indexOf(route.path) === 0
          || !devOrTestMode && homePageSelected && R.contains(route.path, [
            "regulator/accessPermits", "customer/accessPermits", "partner/accessPermits"])
        })}
        onClick={onMenuItemClick}>
      <a tabIndex="0"
         onClick={subRoutes.length === 0 ? getSubMenuLinkOnClickFunction(actions, route) : null}
         aria-label={aria.menuLink(route.name)}
         role="link"
         className={(pagePath.replace("page=", "").indexOf(route.path) === 0 ? "active" : "")}>
        <div data-toggle="tooltip" data-placement="right"
             data-original-title={route.name} className="gui-icon">
          <span className={"glyphicon " + route.icon + ""}/></div>
        {R.isNil(route.beta)
          ? <span className="title">{route.name}</span>
          : <span className="title no-linebreak">{route.name}
              <span className="badge-right-20">
                <span className={"label label-danger text-right no-linebreak"}>BETA</span>
              </span>
            </span>
        }
      </a>
      {renderSubMenus(actions, subRoutes, pagePath)}
    </li>
  );
}

function renderSubMenus(actions, routes, pagePath) {
  const _routes = R.defaultTo([], routes);
  if (_routes.length === 0) {
    return null;
  }
  return (
    <ul>
      {R.addIndex(R.map)((route, idx) => {
          const subRoutes = R.pipe(
            R.filter(route => {
                if (!isLowerEnvironment) {
                  if (route.hideInUpperEnvironment === true) {
                    return false;
                  }
                }
                return true;
              }
            ),
            R.filter(R.propEq('authorised', true)),
            R.filter(R.propEq('hide', false))
          )(R.defaultTo([], route.routes));
          return (
            <li key={idx}
                className={classnames({
                  "gui-folder": subRoutes.length > 0,
                  "active": pagePath.replace("page=", "").indexOf(route.path) === 0,
                  "menubarExpanded": pagePath.replace("page=", "").indexOf(route.path) === 0
                })}
                onClick={onMenuItemClick}>
              <a tabIndex="0"
                 onClick={subRoutes.length === 0 ? getSubMenuLinkOnClickFunction(actions, route) : null}
                 aria-label={aria.menuLink(route.name)}
                 role="link"
                 className={(pagePath.replace("page=", "").indexOf(route.path) === 0 ? "active" : "")}>
                <span className="title">
                  <span><span className={"glyphicon " + route.icon + ""}/></span>
                  <span>{"   " + route.name}</span>
                  {R.isNil(route.beta) ? null : <span>{""}
                     <div className="badge-right">
                         <span className={"label label-danger text-right no-linebreak"}>BETA</span>
                     </div>
                  </span>}
                </span>
              </a>
              {renderSubMenus(actions, subRoutes, pagePath)}
            </li>
          );
        },
        _routes)}
    </ul>
  );
}

function getSubMenuLinkOnClickFunction(actions, route) {
  if (route.hasOwnProperty("routes")) {
    //@todo do we want to allow link to submenu group header
    //return (e) => (e.preventDefault());
  } else if (route.triggerAction) {
    return () => (actions.push(route.triggerAction));
  }
  return () => (routerLibrary.linkSelect.call(
    routerLibrary, null, routerLibrary.createALink("page=" + route.path)));
}

/**
 * @ignore
 */
module.exports = Menubar;
