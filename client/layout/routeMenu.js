/* global window */
"use strict";
import R from 'ramda';
import {isLowerEnvironment} from '../globals';


export function renderMenu(component, actions, routes, filter) {
  var _filter = R.defaultTo({
    "hide": false,
    "userDropdown": false,
    "accountDropdown": false,
    "menuSkip": false
  }, filter);
  return R.pipe(
    R.defaultTo([]),
    R.filter(route => {
        if (route.hasOwnProperty("routes")) {
          return R.any(routesRoute => (
            R.and(R.propEq('authorised', true, routesRoute), R.propEq('hide', false, routesRoute))
          ))(R.defaultTo([], route.routes));
        }
        return true;
      }
    ),
    R.filter(R.propEq('authorised', true)),
    R.filter(R.propEq('hide', _filter.hide)),
    R.filter(R.propEq('userDropdown', _filter.userDropdown)),
    R.filter(R.propEq('accountDropdown', _filter.accountDropdown)),
    R.map((route) => (route.menuSkip && _filter.menuSkip ? route.routes : route)),
    R.addIndex(R.map)((route, idx) => (
      component(route, idx, actions, routes)
    ))
  )(routes || []);
}

export function renderMenuUnnest(component, actions, routes, filter) {
  var _filter = R.defaultTo({
    "hide": false,
    "hideInUpperEnvironment": false,
    "userDropdown": false,
    "accountDropdown": false,
    "menuSkip": false
  }, filter);
  return R.pipe(
    R.defaultTo([]),
    R.filter(route => {
        if (route.hasOwnProperty("routes")) {
          return R.any(routesRoute => (
            R.and(R.propEq('authorised', true, routesRoute))
          ))(R.defaultTo([], route.routes));
        }
        return true;
      }
    ),
    R.filter(R.propEq('authorised', true)),
    R.filter(R.propEq('hide', _filter.hide)),
    R.filter((route) => {
      if (R.isNil(route.userDropdown) && R.isNil(route.accountDropdown)) {
        return true;
      }
      if (!R.isNil(route.userDropdown) && route.userDropdown === _filter.userDropdown) {
        return true;
      }
      if (!R.isNil(route.accountDropdown) && route.accountDropdown === _filter.accountDropdown) {
        return true;
      }
      return false;
    }),
    R.map((route) => {
      return route.menuSkip && _filter.menuSkip ? route.routes : route;
    }),
    R.unnest,
    R.filter(route => {
        if (!isLowerEnvironment) {
          if (route.hideInUpperEnvironment === true) {
            return false;
          }
          if (route.hasOwnProperty("routes")) {
            return !R.any(routesRoute => {
              routesRoute.hideInUpperEnvironment === true
            })(R.defaultTo([], route.routes));
          }
        }
        return true;
      }
    ),
    R.filter(R.propEq('authorised', true)),
    R.filter(R.propEq('hide', _filter.hide)),
    R.addIndex(R.map)((route, idx) => {
      return component(route, idx, actions, routes);
    })
  )(routes || []);
}
