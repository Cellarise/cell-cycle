"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class'
import R from 'ramda';
import classnames from 'classnames';
import ButtonsFooter from '../forms/buttonsFooter.jsx';
import {createChainedFunction} from '../utils';
import {getFirstPageWithError} from '../utils/recordUtils';
import {$, doc} from '../globals';

module.exports = createReactClass({
  "displayName": "widgets/modal",
  "propTypes": {
    "id": PropTypes.string,
    "title": PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]),
    //validation
    "validationConfig": PropTypes.object,
    //modal display
    "fade": PropTypes.bool,
    "size": PropTypes.string,
    "header": PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]),
    "footer": PropTypes.object,
    "onCancel": PropTypes.func,
    "onClick": PropTypes.func,
    "onReject": PropTypes.func,
    "onApprove": PropTypes.func,
    "rejectText": PropTypes.string,
    "approveText": PropTypes.string,
    "cancelText": PropTypes.string,
    "okText": PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.object
    ]),
    "okHref": PropTypes.string,
    "rejectDisabledText": PropTypes.string,
    "approveDisabledText": PropTypes.string,
    "okDisabled": PropTypes.bool,
    "showReject": PropTypes.bool,
    "showApprove": PropTypes.bool,
    "showOk": PropTypes.bool,
    "showCancel": PropTypes.bool,
    "classNameReject": PropTypes.string,
    "classNameApprove": PropTypes.string,
    "classNameCancel": PropTypes.string,
    "classNameOk": PropTypes.string,
    "className": PropTypes.string,
    "classNameHeader": PropTypes.string,
    "classNameBody": PropTypes.string,
    "classNameFooter": PropTypes.string,
    "dismissable": PropTypes.bool,
    "ignoreValidationConfig": PropTypes.bool,
    "showCounter": PropTypes.number,
    "passEventHandlersPropsToBody": PropTypes.bool,
    "optionField": PropTypes.object,
    "optionOnChange": PropTypes.func,
    "optionOnBlur": PropTypes.func,
    "classNameOption": PropTypes.string,
    "actions": PropTypes.object
  },
  "getDefaultProps": function getDefaultProps() {
    return {
      "classNameReject": "btn-danger btn-flat",
      "classNameApprove": "btn-success btn-flat",
      "classNameCancel": "btn-default btn-flat",
      "classNameOk": "btn-primary btn-flat",
      "rejectText": "Reject",
      "approveText": "Approve",
      "cancelText": "Cancel",
      "okText": "Ok",
      "rejectDisabledText": null,
      "approveDisabledText": null,
      "okDisabled": false,
      "showReject": false,
      "showApprove": false,
      "showOk": true,
      "showCancel": true,
      "fade": false,
      "ignoreValidationConfig": false,
      "size": "",
      "dismissable": true,
      "showCounter": 0,
      "passEventHandlersPropsToBody": true //@todo need to remove sending event handlers to body
    };
  },
  "justClickedOk": false,
  UNSAFE_componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    if (nextProps.ignoreValidationConfig !== true && this.justClickedOk
      && getFirstPageWithError(nextProps.validationConfig ? nextProps.validationConfig.toJS() : []) === null) {
      this.modalHide();
    } else if (this.props.showCounter < nextProps.showCounter) {
      this.modalShow();
    }
    this.justClickedOk = false;
  },
  "componentDidMount": function componentDidMount() {
    if (!$().modal) {
      require('../../vendor/bootstrap@v4-dev/js/umd/modal');
    }
    $(doc).on('shown.bs.modal', '.modal', function() {
      $(this).find('[data-auto-focus]').focus();
    });
    //Plugin uses delegated event binding which means events bubble up to event handler established by
    // initiating the plugin. Do not call:
    // $('[data-toggle="modal"]').modal();
    if (this.props.draggable === true) {
      this.setupDrag(this.props.id);
    }
  },
  "componentWillUnmount": function componentWillUnmount() {
    if (this.props.draggable === true) {
      this.destroyDrag(this.props.id);
    }
    const $model = $("#" + this.props.id);
    if (!R.isNil($model) && !R.isNil($model.modal)) {
      $("#" + this.props.id).modal('hide');
      $(doc).off('shown.bs.modal', '.modal');
    }
  },
  "setupDrag": function setupDrag(id) {
    $("#" + id + " .modal-dialog").draggable({
      handle: ".modal-header"
    });
  },
  "destroyDrag": function destroyDrag(id) {
    const $modalDialog = $("#" + id + " .modal-dialog");
    if (!R.isNil($modalDialog) && $modalDialog.data("ui-draggable")) {
      $modalDialog.draggable("destroy");
    }
  },
  "callMethod": function callMethod(id, method) {
    $("#" + id).modal(method);
  },
  "render": function render() {
    var {
      id, title, fade, size, dismissable, classNameHeader, className, classNameFooter,
      classNameOk, classNameCancel, classNameReject, classNameApprove,
      cancelText, onCancel, showCancel,
      okText, okDisabled, onClick, showOk, okHref,
      approveText, approveDisabledText, onApprove, showApprove,
      rejectText, rejectDisabledText, onReject, showReject,
      showCounter, validationConfig, ignoreValidationConfig, //eslint-disable-line
      optionField, actions, optionOnChange, optionOnBlur, classNameOption,
      ...bodyProps //eslint-disable-line
    } = this.props;
    const _onCancel = (event) => {
      if (onCancel) {
        onCancel(event, this.modalHide);
      } else {
        this.modalHide();
      }
    };
    const _onClick = (event) => {
      this.justClickedOk = true;
      if (onClick) {
        onClick(event, this.modalHide);
      } else {
        this.modalHide();
      }
    };
    const _onReject = (event) => {
      this.justClickedOk = true;
      if (onReject) {
        onReject(event, this.modalHide);
      } else {
        this.modalHide();
      }
    };
    const _onApprove = (event) => {
      this.justClickedOk = true;
      if (onApprove) {
        onApprove(event, this.modalHide);
      } else {
        this.modalHide();
      }
    };
    const dismissableProps = dismissable ? {} : {"data-backdrop": "static", "data-keyboard": false};
    return (
      <div id={id}
           className={classnames("modal", {"fade": fade}, className)}
           tabIndex="-1"
           role="dialog"
           aria-labelledby={id + "Label"}
           aria-hidden="true"
           {...dismissableProps}
      >
        <div className={classnames("modal-dialog", {
          "modal-lg": size === "large", "modal-sm": size === "small"
        })}
             role="document">
          <div className="modal-content">
            {this.renderHeader(id, title, classNameHeader, dismissable)}
            {this.renderBody(bodyProps, id, _onCancel, _onClick)}
            <ButtonsFooter
              classNameFooter={classNameFooter}
              showCancel={showCancel}
              cancelText={cancelText}
              classNameCancel={classNameCancel}
              onCancel={_onCancel}
              showOk={showOk}
              okText={okText}
              okHref={okHref}
              classNameOk={classNameOk}
              okDisabled={okDisabled}
              onClick={_onClick}
              showReject={showReject}
              rejectText={rejectText}
              classNameReject={classNameReject}
              rejectDisabledText={rejectDisabledText}
              onReject={_onReject}
              showApprove={showApprove}
              approveText={approveText}
              classNameApprove={classNameApprove}
              approveDisabledText={approveDisabledText}
              onApprove={_onApprove}
              optionField={optionField}
              optionOnChange={optionOnChange}
              optionOnBlur={optionOnBlur}
              classNameOption={classNameOption}
              actions={actions}
            />
          </div>
        </div>
      </div>
    );
  },
  "renderHeader": function renderHeader(id, title, classNameHeader, dismissable) {
    return !title ? null : (
      <div className={classnames("modal-header", classNameHeader)} id={id +"modalHeader"}>
        {
          dismissable &&
          <button type="button" className="close" data-dismiss="modal" aria-label="Close">
            <span aria-hidden="true">&times;</span>
            <span className="sr-only">Close</span>
          </button>
        }
        <header className="modal-title" id={id + "Label"}>{title}</header>
      </div>
    );
  },
  "renderBody": function renderBody(bodyProps, id, onCancel, onClick) {
    var {children, classNameBody, passEventHandlersPropsToBody, ...propsForChild} = bodyProps;
    var child = React.Children.only(children);

    if (passEventHandlersPropsToBody) {
      return (
        <div className={classnames("modal-body", classNameBody)}>
          {React.cloneElement(child, R.merge(propsForChild, {
            "onClick": createChainedFunction(child.props.onClick, onClick),
            "onCancel": createChainedFunction(child.props.onCancel, onCancel)
          }))}
        </div>
      );
    }
    return (
      <div className={classnames("modal-body", classNameBody)}>
        {React.cloneElement(child, propsForChild)}
      </div>
    );
  },
  "modalHide": function modalHide() {
    $("#" + this.props.id).modal('hide');
  },
  "modalShow": function modalShow() {
    $("#" + this.props.id).modal('show');
  }
});
