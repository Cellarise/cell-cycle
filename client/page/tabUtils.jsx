"use strict";
import React from 'react';
import R from 'ramda';
import classnames from 'classnames';
import {tabLabel} from '../libraries/accessibility';

module.exports = {
  "renderTabs": function renderTabs(props, activeKey, errorKeys, renderContentFn1, renderContentFn2) {
    const {children, classNameTab, classNameTabNav, startIndex, onTabChange, tools} = props;
    let idx = 0;
    return (
      <ul className={classnames(classNameTabNav, tools ? "pull-left" : "")}
          data-toggle="tabs"
          role="tablist">
        {
          React.Children.map(children, child => {
              let activeTab, _classNames;
              if (!child) {
                // Ignore null/undefined children (tab may be conditional)
                return child;
              }
              activeTab = activeKey === idx;
              _classNames = classnames(
                classNameTab,
                {
                  "active": activeTab,
                  "done": R.is(Array, errorKeys) && (idx < activeKey) && (idx >= errorKeys.length || !errorKeys[idx]),
                  "error": R.is(Array, errorKeys) && idx < errorKeys.length && errorKeys[idx]
                }
              );
              idx = idx + 1;
              if (R.is(Object, child.props.label) && child.props['data-use-object-label'] !== true) {
                return child.props.label;
              }
              if (renderContentFn1 && renderContentFn2) {
                return (
                  <li className={_classNames}>
                    <a name="onTabChange"
                       data-toggle="tab"
                       data-type="JSON"
                       data-value={JSON.stringify({
                        "moveToIndex": startIndex + idx - 1,
                        "validationConfig": props.validationConfig
                      })}
                       data-record-idx={startIndex + idx - 1}
                       title={child.props.title ? child.props.title : null}
                       data-toggle-tooltip={child.props.title ? "tooltip" : null}
                       data-placement={child.props.title ? "top" : null}
                       aria-label={tabLabel(child.props.label, _classNames)}
                       role="tab"
                       href={null}
                       onClick={onTabChange}>
                      {renderContentFn1(child.props.label, idx)}
                      {renderContentFn2(child.props.label, idx)}
                    </a>
                  </li>
                );
              }
              return (
                <li className={_classNames}>
                  <a name="onTabChange"
                     data-toggle="tab"
                     data-type="JSON"
                     data-value={JSON.stringify({
                      "moveToIndex": startIndex + idx - 1,
                      "validationConfig": props.validationConfig
                    })}
                     data-record-idx={startIndex + idx - 1}
                     title={child.props.title ? child.props.title : null}
                     data-toggle-tooltip={child.props.title ? "tooltip" : null}
                     data-placement={child.props.title ? "top" : null}
                     aria-label={tabLabel(child.props.label, _classNames)}
                     role="tab"
                     href={null}
                     onClick={onTabChange}>
                    {renderContentFn1 ? renderContentFn1(child.props.label, idx) : null}
                  </a>
                </li>
              );
            }
          )
        }
      </ul>
    );
  },
  "renderTabPanes": function renderTabPanes(props, activeKey) {
    const {children, cardStyle, classNameTabBody, classNameTabPane, id} = props;
    const multipleChildren = React.Children.count(children) > 1;
    let idx = 0;
    return (
      <div className={classnames("tab-content", cardStyle ? "card-body" : "", classNameTabBody)}>
        {
          React.Children.map(children, child => {
              var activeTab = activeKey === idx;
              idx = idx + 1;
              if (!activeTab || R.isNil(child)) {
                return null; //only render the active tab - forces remounting tab for plugins requiring visibility
              }
              return React.cloneElement(child, {
                "id": multipleChildren ? id + "-" + (idx - 1) : null,
                "className": classnames("tab-pane", classNameTabPane, activeTab ? "active" : "")
              });
            }
          )
        }
      </div>
    );
  }
};
