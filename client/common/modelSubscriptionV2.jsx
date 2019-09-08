"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class'
import R from 'ramda';
import {shallowEqual} from '../utils';
import {dissocCommonState, hasSubscribedState, bindModelSubscriptions} from '../libraries/viewV2';
import {$, win, logger} from '../globals';

//Higher order component to subscribe to the model and pass state as props to a ONE child component
module.exports = createReactClass({
  "displayName": "__modelSubscription",
  "propTypes": {
    "modelSubscriptions": PropTypes.array,
    "onPageLoad": PropTypes.array,
    "displayName": PropTypes.string,
    "loadingComponent": PropTypes.func
  },
  "contextTypes": {
    "model": PropTypes.object.isRequired,
    "actions": PropTypes.object.isRequired
  },
  "getPageDisplayName": function getPageDisplayName(displayName) {
    if (displayName) {
      return "__MS_" + displayName;
    }
    return "__MS_" + this.props.displayName || this.constructor.displayName;
  },
  "unsubscribeFromModelStream": function unsubscribeFromModelStream() {
    if (R.is(Function, this._boundModelStream)) {
      this._boundModelStream(); //calling this un-subscribes from modelStream
      logger.info("%s - component UNSUBSCRIBED to model", this.getPageDisplayName());
    } else {
      logger.error("%s - component FAILED UNSUBCRIDE to model", this.getPageDisplayName());
    }
  },
  "componentDidMount": function componentDidMount() {
    //add global widgets
    if (!win.Tether) {
      win.Tether = require('tether');
    }
    if (!$.fn.tooltip) {
      require('../../vendor/bootstrap@v4-dev/js/umd/tooltip');
    }
    if (!$().collapse) {
      require('../../vendor/bootstrap@v4-dev/js/umd/collapse');
    }
    $('[data-toggle="tooltip"]').tooltip();
    $('[data-toggle-tooltip="tooltip"]').tooltip();
    //start observing model
    //call page onload actions
    this._boundModelStream = bindModelSubscriptions(
      this.context.actions,
      this.context.model,
      this.props,
      this.getPageDisplayName(),
      this.replaceState.bind(this),
      this.isMounted.bind(this)
    );
    logger.info("%s - component mounted", this.getPageDisplayName());
  },
  "componentDidUpdate": function componentDidUpdate () {
    //update global widgets
    $('[data-toggle="tooltip"]').tooltip('dispose');
    $('[data-toggle-tooltip="tooltip"]').tooltip('dispose');
    $('.bs-tether-enabled').remove();
    $('.tooltip.fade.in').remove();
    $('[data-toggle="tooltip"]').tooltip();
    $('[data-toggle-tooltip="tooltip"]').tooltip();
  },
  "componentWillUnmount": function componentWillUnmount() {
    //dispose of global widgets
    $('[data-toggle="tooltip"]').tooltip('dispose');
    $('[data-toggle-tooltip="tooltip"]').tooltip('dispose');
    //stop observing model - this method should not be called on PageFactory as root component will never unmount
    // PageFactory, only send new props for new pages
    this.unsubscribeFromModelStream();
  },
  UNSAFE_componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    if (!R.equals(this.props.modelSubscriptions || [], nextProps.modelSubscriptions || [])) {
      logger.info("%s - receiving new modelSubscriptions - CLEAR state", this.getPageDisplayName());
      //@todo trigger page exit actions
      //NB: Ensure that new pages do not receive the state for previous pages with the same key
      this.replaceState({});
      this.unsubscribeFromModelStream();
      this._boundModelStream = bindModelSubscriptions(
        this.context.actions,
        this.context.model,
        nextProps,
        this.getPageDisplayName(nextProps.displayName),
        this.replaceState.bind(this),
        this.isMounted.bind(this)
      );
    } else {
      logger.info("%s - receiving existing modelSubscriptions - LEAVE state", this.getPageDisplayName());
    }
  },
  "shouldComponentUpdate": function shouldComponentUpdate(nextProps, nextState) {
    // if (!R.equals(this.props.modelSubscriptions || [], nextProps.modelSubscriptions || [])) {
    //   return true;
    // }
    //NB: state is set as an object with keys equal to the modelsubscriptionNames with properties that are immutable
    // and so can be identity matched by shallowEqual
    if (shallowEqual(this.props, nextProps)
      && shallowEqual(dissocCommonState(this.state), dissocCommonState(nextState))) {
      logger.log("%s - shouldComponentUpdate: false", this.getPageDisplayName(nextProps.displayName));
      return false;
    }
    return true;
  },
  "render": function render() {
    if (hasSubscribedState(this.props, this.state)) {
      if (this.props.child) {
        //render child from class provided as an attribute
        return React.createElement(
          this.props.child,
          R.mergeAll([{"actions": this.context.actions}, this.props.props, this.state])
        );
      }
      //render child from this.props.children
      return React.cloneElement(
        this.props.children,
        R.merge({"actions": this.context.actions}, this.state)
      );
    } else if (this.props.loadingComponent) {
      return React.createElement(this.props.loadingComponent, {"title": "Loading page..."});
    }
    return null;
  }
});
