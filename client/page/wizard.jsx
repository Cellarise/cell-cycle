"use strict";
import React from 'react';
import R from 'ramda';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import Immutable from 'immutable';
import classnames from 'classnames';
import {$} from '../globals';
import tabUtils from './tabUtils.jsx';
import Card from './card.jsx';
import * as domDriverUtils from '../utils/domDriverUtils';
import {getInvalidPagesFromValidationConfig, findFirstPageWithError} from '../utils/recordUtils';

module.exports = createReactClass({
  "displayName": "layouts/tabbed/wizard",
  "propTypes": {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    tabs: PropTypes.object.isRequired,
    header: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]),
    //validation
    validationConfig: PropTypes.object,
    activeKey: PropTypes.number,
    startIndex: PropTypes.number,
    className: PropTypes.string,
    classNameTab: PropTypes.string,
    classNameTabNav: PropTypes.string,
    classNameTabPane: PropTypes.string,
    classNameOnSave: PropTypes.string,
    onClick: PropTypes.func,
    onSubmit: PropTypes.func.isRequired,
    onSave: PropTypes.func,
    saveProp: PropTypes.object,
    onSaveLabel: PropTypes.string,
    onCancel: PropTypes.func,
    onTabChange: PropTypes.func.isRequired,

    labelInProgress: PropTypes.string,
    saveLabelInProgress: PropTypes.string,
    cancelLabelInProgress: PropTypes.string,
    inProgress: PropTypes.bool,
    saveInProgress: PropTypes.bool,
    cancelInProgress: PropTypes.bool,
    disableActions: PropTypes.bool,
    disableSubmit: PropTypes.bool,

    pagerStart: PropTypes.string,
    pagerLast: PropTypes.string,
    pagerNext: PropTypes.string,
    pagerPrevious: PropTypes.string,
    showPagerOnLast: PropTypes.bool,
    showCancel: PropTypes.bool,
    auditLink: PropTypes.string,
    tools: PropTypes.any
  },
  "getDefaultProps": function getDefaultProps() {
    return {
      classNameTabNav: "nav nav-pills nav-justified",
      pagerFirst: "Cancel",
      pagerPrevious: "Previous",
      pagerNext: "Next",
      pagerLast: null,
      onSaveLabel: "Save",
      classNameOnSave: "btn btn-primary",
      showPagerOnLast: true,
      showCancel: false,
      startIndex: 0,
      validationConfig: Immutable.List()
    };
  },
  "componentDidMount": function componentDidMount() {
    if (!$().bootstrapWizard) {
      require('../../vendor/bootstrapWizard/jquery.bootstrap.wizard');
    }
    //NB: The form is created in the component Card. Component card will add '-form' to the props.id.
    //The Card component guarantees existence of a DOM element with "#" + this.props.id + "-formWrapper". However, the
    //Card component does not guarantee that a DOM element with "#" + this.props.id will always exist because the
    // form which wraps the Card may unmount the card to display error or success messages (see /form.jsx).
    $("#" + this.props.id + "-formWrapper").bootstrapWizard({
      "onTabClick": (activeTab, navigation, currentIndex, clickedIndex) => {
        this.onTabChange(clickedIndex, this.props);
        return true;
      },
      "onInit": (activeTab, navigation) => {
        var total = navigation.find('li').length;
        var percentWidth = 99 - (100 / total) + '%';
        $("#" + this.props.id + "-formWrapper").find('.progress').css({"width": percentWidth});
        return true;
      }
    });
  },
  "componentDidUpdate": function componentDidUpdate() {
    var activeKey = this.props.tabs.get('currentPage');
    var total = React.Children.count(this.props.children);
    var percent = (activeKey / (total - 1)) * 100;
    var percentWidth = 99 - (100 / total) + '%';
    $("#" + this.props.id + "-formWrapper").find('.progress-bar').css({"width": percent + '%'});
    $("#" + this.props.id + "-formWrapper").find('.progress').css({"width": percentWidth});
  },
  "componentWillUnmount": function componentWillUnmount() {
    $("#" + this.props.id + "-formWrapper").bootstrapWizard('remove');
  },
  "onTabChange": function onTabChange(moveToIndex, props) {
    props.onTabChange(
      domDriverUtils.createSyntheticEvent('tab', JSON.stringify({
        "moveToIndex": Number(moveToIndex),
        "validationConfig": props.validationConfig.toJS()
      }), null, "JSON")
    );
  },
  "render": function render() {
    const {
      className, name, header, classNameHeader, classNameBody, style, styleBody, onSubmit, validationConfig,
      onCancel, onCancelNoSave, tabs, auditLink, tools, labelInProgress, inProgress, disableActions, disableSubmit,
      ...otherProps
    } = this.props;

    //Get validation status of all fields and check pages with invalid fields
    const pagesWithErrors = getInvalidPagesFromValidationConfig(validationConfig ? validationConfig.toJS() : []);
    let validationError = findFirstPageWithError(pagesWithErrors) !== null;

    const activeKey = tabs.get('currentPage');
    const total = React.Children.count(this.props.children);

    const onPagerSubmit = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (activeKey < (total - 1)) {
        this.onTabChange(activeKey + 1, this.props);
      } else if (activeKey === (total - 1) && onSubmit.authorised) {
        onSubmit(event);
      }
    };

    if (activeKey < (total - 1)) {
      //authorise the next page button
      onPagerSubmit.authorised = true;
      validationError = validationConfig.get('tabMoveValidated') === true && pagesWithErrors[activeKey];
    } else if (activeKey === (total - 1)) {
      onPagerSubmit.authorised = onSubmit.authorised;
    }

    const actionBarButtons = this
      .getWizardPagerButtons(otherProps, activeKey, onCancel, onCancelNoSave, this.onTabChange);


    return (
      <Card
        id={this.props.id}
        role="form"
        name={name}
        header={header}
        className={classnames("form-wizard", "form-wizard-horizontal", className)}
        style={style}
        styleBody={styleBody}
        classNameHeader={classNameHeader}
        classNameBody={classNameBody}
        {...actionBarButtons.onCancel}
        {...actionBarButtons.onPrevious}
        {...actionBarButtons.onSave}
        {...actionBarButtons.onSubmit}
        validationError={validationError}
        labelInProgress={labelInProgress}
        inProgress={inProgress}
        disableActions={disableActions}
        onSubmit={onPagerSubmit}
        disableSubmit={R.defaultTo(false, disableSubmit)}
        form={true}
        actionBar={true}
        auditLink={auditLink}
        tools={tools}
      >
        <div id={this.props.id + "-tab"}
             role="navigation"
             aria-multiselectable="true">
          <div className="form-wizard-nav">
            <div className="progress">
              <div className="progress-bar progress-bar-primary"></div>
            </div>
            {tabUtils.renderTabs(
              otherProps,
              activeKey,
              pagesWithErrors,
              (label, idx) => (<span className="step">{idx}</span>),
              (label) => (<span className="title">{label}</span>)
            )}
          </div>
          {tabUtils.renderTabPanes(otherProps, activeKey)}
        </div>
      </Card>
    );
  },
  "getWizardPagerButtons": function getWizardPagerButtons(props, activeKey, onCancel, onCancelNoSave, onTabChange) {
    const {children, showPagerOnLast, onSave, showCancel} = props;
    const activeCount = activeKey + 1;
    const stepCount = React.Children.count(children);
    const isFirst = activeCount === 1;
    const notLast = activeCount < stepCount;
    let onCancelProps = {}, onPreviousProps = {}, onSubmitProps = {}, onSaveProps = {};
    if ((activeCount < stepCount) || showPagerOnLast) {
      onCancelProps = {
        "onCancelLabel": props.pagerFirst,
        "onExitSaveLabel": props.pagerFirst,
        "classNameOnCancel": "btn btn-default",
        "onCancel": (event) => {
          event.preventDefault();
          event.stopPropagation();
          onCancel(event);
        },
        "onCancelNoSave": onCancelNoSave,
        "cancelLabelInProgress": props.cancelLabelInProgress,
        "cancelInProgress": props.cancelInProgress,
        "onCancelBtnProps": {
          "data-move-to-index": 0,
          "tabIndex": -1
        }
      };
      onPreviousProps = {
        "onPreviousLabel": props.pagerPrevious,
        "classNameOnPrevious": "btn btn-default",
        "onPrevious": (event) => {
          event.preventDefault();
          event.stopPropagation();
          onTabChange(event.currentTarget.getAttribute("data-move-to-index"), this.props);
        },
        "onPreviousBtnProps": {
          "data-move-to-index": activeKey - 1,
          "disabled": isFirst
        }
      };
      if (!showCancel) {
        if (!isFirst) {
          onCancelProps = {
            "onCancelLabel": props.pagerPrevious,
            "classNameOnCancel": "btn btn-default",
            "onCancel": (event) => {
              event.preventDefault();
              event.stopPropagation();
              onTabChange(event.currentTarget.getAttribute("data-move-to-index"), this.props);
            },
            "onCancelBtnProps": {
              "data-move-to-index": activeKey - 1,
              "tabIndex": -1
            }
          };
        }
        onPreviousProps = {};
      }
      if (onSave) {
        onSaveProps = {
          "onSaveLabel": props.onSaveLabel,
          "saveLabelInProgress": props.saveLabelInProgress,
          "saveInProgress": props.saveInProgress,
          "classNameOnSave": props.classNameOnSave,
          "saveProp": props.saveProp,
          "onSave": props.onSave
        };
      }
      if (notLast) {
        onSubmitProps = {
          "onSubmitLabel": props.pagerNext,
          "classNameOnSubmit": "btn btn-primary",
          "onSubmitBtnProps": {
            "data-move-to-index": activeKey + 1
          }
        };
      } else {
        onSubmitProps = {
          "onSubmitLabel": props.pagerLast,
          "classNameOnSubmit": "btn btn-primary btn-raised",
          "onSubmitBtnProps": {
            "data-move-to-index": stepCount - 1
          }
        };
      }
    }
    return {
      "onCancel": onCancelProps,
      "onSave": onSaveProps,
      "onPrevious": onPreviousProps,
      "onSubmit": onSubmitProps
    };
  }
});
