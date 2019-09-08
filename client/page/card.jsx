"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import classnames from 'classnames';
import Tab from './tabs.jsx';
import Scroller from '../widgets/scroller.jsx';
import Form from '../forms/form.jsx';
import Button from '../forms/button.jsx';
import JumpToTabButton from './jumpToTabButton.jsx';
import ButtonsFooter from '../forms/buttonsFooter.jsx';
import ConfirmModal from '../dialogs/confirmModal.jsx';
import {getFirstPageWithError} from '../utils/recordUtils';


/**
 * Card component
 * @param {Object} props - component properties
 * @return {React.Element} react element
 */
function Card(props) {
  //form properties
  const {id, name, form, onSubmit} = props;

  const classNames = {
    "card": true,
    "panel": props.collapsable
  };
  const _id = id ? id : R.defaultTo("", name).replace(/[.#%$]/g, "") + "-card-id";
  const _card = (
    <div id={_id}
         style={props.style}
         className={classnames(classNames, props.className)}>
      {renderHeader(props)}
      {renderBody(props, _id)}
      {renderActionBar(props, _id)}
    </div>
  );

  if (form) {
    return (
      <Form
        id={_id + "-formWrapper"}
        name={name}
        onSubmit={onSubmit}
      >
        {_card}
      </Form>
    );
  }
  return _card;
}

function renderHeader(props) {
  return !props.header ? null : (
    <div data-toggle={props.collapsable && !props.onCollapseChange ? "collapse" : null}
         data-parent={props["data-parent"] ? "#" + props["data-parent"] : null}
         data-target={props["data-target"] ? "#" + props["data-target"] : null}
         className={classnames(
           "card-head", props.classNameHeader, !props.active && props.collapsable ? "collapsed" : ""
         )}
         aria-expanded={props.collapsable ? props.active : null}
         onClick={props.collapsable ? props.onCollapseChange : null}>
      {renderHeaderPreTools(props)}
      <header>{props.header}</header>
      {renderHeaderTools(props)}
    </div>
  );
}
function renderHeaderPreTools(props) {
  return (
    <span className="tools tools-left">
      {props.preTools}
    </span>
  );
}
function renderHeaderTools(props) {
  return (
    <div className="tools">
      {props.tools}
      {!props.auditLink ? null :
        <a className="btn btn-icon-toggle"
           title="Audit history"
           data-placement="left"
           data-toggle="tooltip" href={props.auditLink}>
        <span className="glyphicon mdi-history mdi-lg"/>
      </a>}
      {R.isNil(props.jumpToTabIdx) ? null :
        <JumpToTabButton
          store={props.store}
          actions={props.actions}
          jumpToTabIdx={props.jumpToTabIdx}
        />
      }
      {!props.collapsable ? null :
        <a className="btn btn-icon-toggle btn-collapse"
           title="Click to expand or collapse section"
           data-placement="left"
           data-toggle="tooltip">
        <span className="glyphicon mdi-chevron-down mdi-lg"/>
      </a>}
    </div>
  );
}
function renderBody(props, id) {
  if (props.tabbable && props.scrollable) {
    //Note: the onTabChange event has been added because the onClick event is passed down through the renderCardBody
    return (
      <Tab id={id + "-tabs"}
           tabs={props.tabs}
           onTabChange={props.onTabChange}
           pagesWithErrors={props.pagesWithErrors}
           cardStyle={true}
           className={props.classNameTabs}
           styleTabHead={props.styleTabHead}
           classNameTabNav={props.classNameTabNav}
           classNameTabHead={props.classNameTabHead}
           classNameTabBody={props.classNameTabBody}
           validationConfig={props.validationConfig}
           collapsable={props.collapsable}
           animation={false}>
        {React.Children.map(props.children, (child) => {
          return (<Scroller
            label={child.props.label}
            id={props.id + "-scroll"}
            style={props.style}
            onClick={props.onClick}
            data-value={props["data-value"]}
            className={props.classNameBody}
            height={props.bodyHeight}
            classNameBody={classnames("card-body", "scroll", props.classNameBody)}>
            {child}
          </Scroller>)
        })}
      </Tab>
    );
  }
  if (props.collapsable) {
    return (
      <div id={props["data-target"]}
           className={props.active ? "collapse in" : "collapse"}
           aria-expanded={props.active || false}>
        {renderCardBody(props)}
      </div>
    );
  }
  if (props.tabbable) {
    //Note: the onTabChange event has been added because the onClick event is passed down through the renderCardBody
    return renderCardBody(
      props,
      <Tab id={id + "-tabs"}
           tabs={props.tabs}
           onTabChange={props.onTabChange}
           pagesWithErrors={props.pagesWithErrors}
           cardStyle={true}
           className={props.classNameTabs}
           styleTabHead={props.styleTabHead}
           classNameTabNav={props.classNameTabNav}
           classNameTabHead={props.classNameTabHead}
           classNameTabBody={props.classNameTabBody}
           validationConfig={props.validationConfig}
           animation={false}>
        {props.children}
      </Tab>
    );
  }
  return renderCardBody(props);
}
function renderCardBody(props, children) {
  var _children = R.isNil(children) ? props.children : children;
  if (props.scrollable) {
    return (
      <Scroller
        id={props.id + "-scroll"}
        style={props.style}
        onClick={props.onClick}
        data-value={props["data-value"]}
        className={props.classNameBody}
        height={props.bodyHeight}
        classNameBody={classnames("card-body", "scroll", props.classNameBody)}>
        {_children}
      </Scroller>
    );
  }
  return (
    <div
      style={props.styleBody}
      onClick={props.onClick}
      data-type={props["data-type"]}
      data-value={props["data-value"]}
      className={classnames("card-body", props.classNameBody)}>
      {_children}
    </div>
  );
}
function renderActionBar(props, id) {
  if (!props.actionBar) {
    return null;
  }
  if (R.is(Object, props.actionBar)) {
    return (
      props.actionBar
    );
  }
  // if (!props.onSave || (props.onSave.hasOwnProperty("authorised") && !props.onSave.authorised)) {
  //   return (
  //     <div className={classnames("card-actionbar", props.classNameActionBar)}>
  //       <div className={classnames("card-actionbar-row", props.classNameActionBarRow)}>
  //         {renderActionBarButtons(props)}
  //       </div>
  //     </div>
  //   );
  // }
  let validationError = false;
  if (props.hasOwnProperty("validationError")) {
    validationError = props.validationError;
  } else if (props.hasOwnProperty("validationConfig")) {
    validationError = getFirstPageWithError(props.validationConfig.toJS()) !== null;
  }
  const confirmSaveExitModalId = id + "ConfirmSaveAndExit";
  return (
    <div className={classnames("card-actionbar", props.classNameActionBar)}>
      <ConfirmModal
        id={confirmSaveExitModalId}
        title="Save and exit"
        classNameOk="btn-primary btn-flat"
        label={validationError === true
          ? "Fix validation errors and save changes before exit?"
          : "Save changes before exit?"
        }
        onClick={(event, hide) => {
          props.onCancel(event);
          hide();
        }}
        onCancel={(event, hide) => {
          if (props.onCancelNoSave) {
            props.onCancelNoSave(event);
          } else {
            props.onCancel(event);
          }
          hide();
        }}
        okText="Yes"
        cancelText="No"
        showCounter={props.saveProp.saveCounter}
      />
      <div className={classnames("card-actionbar-row", props.classNameActionBarRow)}>
        {renderActionBarButtons(props)}
      </div>
    </div>
  );
}
function renderActionBarButtons(props) {
  var validationError = false;
  if (props.approvalButtons) {
    return (
      <ButtonsFooter
        classNameFooter={props.classNameFooter}
        showCancel={props.showCancel}
        cancelText={props.cancelText}
        classNameCancel={props.classNameCancel}
        onCancel={props.onCancel}
        showOk={props.showOk}
        okText={props.okText}
        classNameOk={props.classNameOk}
        okDisabled={props.okDisabled}
        onClick={props.onOkClick}
        showReject={props.showReject}
        rejectText={props.rejectText}
        classNameReject={props.classNameReject}
        rejectDisabledText={props.rejectDisabledText}
        onReject={props.onReject}
        showRejected={props.showRejected}
        rejectedText={props.rejectedText}
        classNameRejected={props.classNameRejected}
        rejectedDisabledText={props.rejectedDisabledText}
        onRejected={props.onRejected}
        showApprove={props.showApprove}
        approveText={props.approveText}
        classNameApprove={props.classNameApprove}
        approveDisabledText={props.approveDisabledText}
        onApprove={props.onApprove}
        optionField={props.optionField}
        optionOnChange={props.optionOnChange}
        optionOnBlur={props.optionOnBlur}
        classNameOption={props.classNameOption}
        actions={props.actions}
      />
    )
  }
  if (!props.onSubmit && !props.onSave) {
    return (
      <div className="col-sm-12">
        {
          !props.print ? null : (
            <Button
              label="Print"
              onClick={() => {window.print();}}
              className={props.classNameOnPrint}
            />
          )
        }
        <Button
          {...props.onCancelBtnProps}
          label={props.onCancelLabel}
          className={props.classNameOnCancel}
          onClick={props.onCancel}
        />
      </div>
    );
  }
  if (props.hasOwnProperty("validationError")) {
    validationError = props.validationError;
  } else if (props.hasOwnProperty("validationConfig")) {
    validationError = getFirstPageWithError(props.validationConfig.toJS()) !== null;
  }
  return (
    <div className="col-sm-12">
      {
        !props.print ? null : (
          <Button
            label="Print"
            onClick={() => {window.print();}}
            className={props.classNameOnPrint}
          />
        )
      }
      {
        props.onCancel && (!props.onSave || (props.onSave.hasOwnProperty("authorised") && !props.onSave.authorised))
          ? ( //cancel button
            <Button
              {...props.onCancelBtnProps}
              label={props.onCancelLabel}
              labelInProgress={props.cancelLabelInProgress || props.onCancelLabel}
              inProgress={props.cancelInProgress}
              disabled={props.disableActions}
              className={props.classNameOnCancel}
              onClick={(event) => {
                if (props.onCancelNoSave) {
                  props.onCancelNoSave(event);
                } else {
                  props.onCancel(event);
                }
              }}
            />
          )
          : null
      }
      {
        !props.onSave || (props.onSave.hasOwnProperty("authorised") && !props.onSave.authorised)
          ? null
          : ( //save and exit button
          <Button
            {...props.onCancelBtnProps}
            label={props.onExitSaveLabel}
            labelInProgress={props.cancelLabelInProgress || props.onCancelLabel}
            inProgress={props.cancelInProgress}
            disabled={props.disableActions}
            className={props.classNameOnCancel}
            onClick={(event) => {
              if (props.onCancelNoSave) {
                props.onCancelNoSave(event);
              } else {
                props.onCancel(event);
              }
            }}
          />
        )
      }
      {
        !props.onSave || (props.onSave.hasOwnProperty("authorised") && !props.onSave.authorised)
          ? null
          : (
          <Button
            {...props.onSaveBtnProps}
            label={props.onSaveLabel}
            labelInProgress={props.saveLabelInProgress || props.onSaveLabel}
            inProgress={props.saveInProgress}
            disabled={props.disableActions || !props.saveProp.hasChangesToSave}
            className={props.classNameOnSave}
            onClick={props.onSave}
          />
        )
      }
      {
        !props.onPrevious
          ? null
          : (
          <Button
            {...props.onPreviousBtnProps}
            label={props.onPreviousLabel}
            className={props.classNameOnPrevious}
            onClick={props.onPrevious}
          />
        )
      }
      {
        props.onSubmit
          ? (
          <Button
            {...props.onSubmitBtnProps}
            data-toggle-tooltip={validationError ? "tooltip" : null}
            data-placement={validationError ? "top" : null}
            title={validationError ? "Form validation errors must be corrected to continue" : null}
            label={props.onSubmitLabel}
            labelInProgress={props.labelInProgress || props.onSubmitLabel}
            inProgress={props.inProgress}
            disabled={props.disableSubmit || props.disableActions || validationError}
            className={props.classNameOnSubmit}
            onClick={props.onSubmit}
          />
        )
          : null
      }
    </div>
  );
}

Card.displayName = "Card";
Card.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string.isRequired,
  //header
  header: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
  //form
  form: PropTypes.bool,
  onSave: PropTypes.func,
  saveProp: PropTypes.object,
  onSubmit: PropTypes.func,
  onCancel: PropTypes.func,
  onCancelNoSave: PropTypes.func,
  onPrevious: PropTypes.func,
  onClick: PropTypes.func,
  //new tabs
  tabs: PropTypes.object,
  onTabChange: PropTypes.func,
  pagesWithErrors: PropTypes.array,
  //tabs
  tabbable: PropTypes.bool,
  validationConfig: PropTypes.object,
  validationError: PropTypes.bool, //provided if validationConfig already computed by parent
  //collapse
  collapsable: PropTypes.bool,
  "data-parent": PropTypes.string,
  "data-target": PropTypes.string,
  //scroll
  scrollable: PropTypes.bool,
  //body
  "data-value": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool,
    PropTypes.object
  ]),
  "data-type": PropTypes.string,
  //actionbar
  actionBar: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object
  ]),
  auditLink: PropTypes.string,
  onPrintLabel: PropTypes.string,
  onSaveLabel: PropTypes.string,
  onSubmitLabel: PropTypes.string,
  onCancelLabel: PropTypes.string,
  onExitSaveLabel: PropTypes.string,
  onPreviousLabel: PropTypes.string,
  onSubmitBtnProps: PropTypes.object,
  onCancelBtnProps: PropTypes.object,
  onPreviousBtnProps: PropTypes.object,

  labelInProgress: PropTypes.string,
  saveLabelInProgress: PropTypes.string,
  cancelLabelInProgress: PropTypes.string,
  inProgress: PropTypes.bool,
  saveInProgress: PropTypes.bool,
  cancelInProgress: PropTypes.bool,

  disableActions: PropTypes.bool,
  disableSubmit: PropTypes.bool,

  //approvalButtons config
  approvalButtons: PropTypes.bool,
  "onOkClick": PropTypes.func,
  "onReject": PropTypes.func,
  "onApprove": PropTypes.func,
  "rejectText": PropTypes.string,
  "approveText": PropTypes.string,
  "cancelText": PropTypes.string,
  "okText": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]),
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
  "classNameFooter": PropTypes.string,
  "classNameOption": PropTypes.string,
  "optionField": PropTypes.object,
  "optionOnChange": PropTypes.func,
  "optionOnBlur": PropTypes.func,
  "actions": PropTypes.object,

  //style and classes
  style: PropTypes.object,
  className: PropTypes.string,
  classNameHeader: PropTypes.string,
  classNameBody: PropTypes.string,
  classNameActionBar: PropTypes.string,
  classNameActionBarRow: PropTypes.string,
  classNameOnCancel: PropTypes.string,
  classNameOnSubmit: PropTypes.string,
  classNameOnSave: PropTypes.string,
  classNameOnPrint: PropTypes.string,
  classNameOnPrevious: PropTypes.string,
  print: PropTypes.bool
};
Card.defaultProps = {
  tabbable: false,
  collapsable: false,
  scrollable: false,
  print: false,
  form: false,
  approvalButtons: false,
  saveProp: {
    "hasChangesToSave": true,
    "saveCounter": 0
  },
  onPrintLabel: "Print",
  onSaveLabel: "Save",
  onSubmitLabel: "Submit",
  onCancelLabel: "Exit",
  onExitSaveLabel: "Exit",
  onPreviousLabel: "Previous",
  onSaveBtnProps: {},
  onSubmitBtnProps: {},
  onPreviousBtnProps: {},
  onCancelBtnProps: {},
  classNameHeader: "card-head",
  classNameBody: "",
  classNameOnCancel: "btn btn-default",
  classNameOnPrevious: "btn btn-default",
  classNameOnSave: "btn btn-primary",
  classNameOnSubmit: "btn btn-primary",
  classNameOnPrint: "btn btn-default"
};

/**
 * @ignore
 */
module.exports = Card;
