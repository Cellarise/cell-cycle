"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class'
import R from 'ramda';
import classnames from 'classnames';
import * as routerLibrary from '../libraries/router';
import {dropdown} from '../widgets/dropdown';
import Button from '../forms/button.jsx';
import {createSyntheticEvent} from '../utils/domDriverUtils';

module.exports = createReactClass({
  "displayName": "collection/dropdownBox",
  "propTypes": {
    "id": PropTypes.string.isRequired,
    "label": PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]),
    "value": PropTypes.string.isRequired,
    "placeholder": PropTypes.string,
    "records": PropTypes.array,
    "itemContent": PropTypes.func,
    "menuContent": PropTypes.bool,
    "className": PropTypes.string,
    "classNameDropdown": PropTypes.string,
    "idField": PropTypes.string,
    "onSearch": PropTypes.func,
    "alwaysShowAsDropdown": PropTypes.bool
  },
  "getDefaultProps": function getDefaultProps() {
    return {
      "id": ""
    };
  },
  "componentDidMount": function componentDidMount() {
    dropdown.mixin.componentDidMount();
  },
  "componentDidUpdate": function componentDidUpdate() {
    dropdown.mixin.componentDidUpdate();
  },
  "componentWillUnmount": function componentWillUnmount() {
    dropdown.mixin.componentWillUnmount();
  },
  "render": function render() {
    const {
      id, value, records, className, classNameGroup, classNameDropdown, menuContent, disabled,
      dropdownLabel, alwaysShowAsDropdown, tooltip} = this.props;
    const classNames = classnames(className, "btn-primary dropdown-toggle");
    const classNamesGroup = classnames(classNameGroup, "btn-group");
    const classNamesDropdown = classnames(classNameDropdown, "dropdown-menu animation-expand");
    const _dropdownLabel = R.defaultTo(
      (<span>{value}&nbsp;<span className="glyphicon mdi-chevron-down"/></span>), dropdownLabel
    );
    const _records = R.filter((item) => (!(item.disabled && item.hideIfDisabled)), R.defaultTo([], records));
    let buttonDisabled = disabled;
    if (!menuContent && (!_records || _records.length < 2)) {
      return <span></span>;
    }
    if (menuContent && _records.length === 0) {
      buttonDisabled = true;
    }
    let menuContentItems = [];
    if (menuContent && _records.length > 0) {
      menuContentItems = R.filter((item) => {
        if (item.divider === true) {
          return false;
        }
        if (!R.isNil(item.header)) {
          return false;
        }
        return true;
      }, _records);
    }
    if (menuContent && menuContentItems.length === 1 && alwaysShowAsDropdown !== true) {
      const menuItem = menuContentItems[0];
      return (
        <div className={classNamesGroup}>
          {!R.isNil(menuItem.href) && !menuItem.disabled ?
            <Button
              id={id + "-dropdownBox"}
              name={menuItem.label}
              disabled={buttonDisabled}
              label={menuItem.label}
              className={classNames}
              type="link"
              href={menuItem.href}
              target="_blank"
              rel="noopener noreferrer"
            />
            :
            <Button
              id={id + "-dropdownBox"}
              name={menuItem.label}
              disabled={buttonDisabled}
              label={menuItem.label}
              className={classNames}
              data-toggle-tooltip={tooltip ? "tooltip" : null}
              title={tooltip}
              onClick={() => {
                if (!menuItem.disabled) {
                  menuItem.action(createSyntheticEvent(menuItem.label));
                }
              }}
            />
          }
        </div>
      );
    }
    return (
      <div className={classNamesGroup}>
        {R.isNil(value) || value === "" ? null : (
          <Button
            id={id + "-dropdownBox"}
            name={value}
            disabled={buttonDisabled}
            label={_dropdownLabel}
            className={classNames}
            data-toggle="dropdown"
            aria-expanded="false"
            aria-haspopup="true"
          />
        )}
        <ul className={classNamesDropdown} aria-labelledby={id + "-dropdownBox"}>
          {this.renderItems(this.props, _records)}
        </ul>
      </div>
    );
  },
  "renderItems": function renderItems(props, records) {
    const {name, onSearch, idField, itemContent, menuContent} = props;
    if (menuContent) {
      return R.addIndex(R.map)((item, idx) => {
        if (item.divider === true) {
          return (
            <div className="dropdown-divider"></div>
          );
        }
        if (!R.isNil(item.header)) {
          //only render if this has non-hidden item following
          return (
            <header key={idx} className="dropdown-header">{item.header}</header>
          );
        }
        if (!R.isNil(item.href) && !item.disabled) {
          return (
            <li key={idx}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="dropdown-item"
              >
                {item.label}
              </a>
            </li>
          );
        }
        return (
          <li key={idx}>
            <a
              className={item.disabled ? "dropdown-item disabled" : "dropdown-item"}
              onClick={() => {
                if (!item.disabled) {
                  item.action(createSyntheticEvent(item.label));
                }
              }}
            >
              {item.label}
            </a>
          </li>
        );
      }, records);
    }
    return R.addIndex(R.map)((item, idx) => {
      return (
        <li key={idx}>
          <a
            href={routerLibrary.createALink(idField + "=" + item.id, {"cache": true})}
            onClick={() => {
              onSearch(createSyntheticEvent(name, item.name));
            }}
          >
            {itemContent ? itemContent(item) : item.name}
          </a>
        </li>
      );
    }, R.defaultTo([], records));
  }
});
