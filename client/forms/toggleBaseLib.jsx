"use strict";
import React from 'react';
import R from 'ramda';
import classnames from "classnames";
import * as inputBaseLib from './inputBaseLib.jsx';


export {
  inputSizeClass, dataProps, ariaDescribedBy, ariaProps, propsStartsWith,
  getFieldId, getValueClass
} from './inputBaseLib.jsx';


export function renderLabel(props, children) {
  if (props.showLabel && !R.isNil(props.help) && props.help.length > 0) {
    return (
      <label htmlFor={props.id ? props.id : props.name + "-input"}
             key="label"
      >
        {children}
        <span>
          <span>{props.label}</span>
          <span>
            <span>&nbsp;&nbsp;</span>
            <span className="glyphiconSuperScript mdi-help-circle text-primary"
                                  title={props.help}
                                  data-toggle-tooltip="tooltip"
                                  data-placement="top"/>
          </span>
        </span>
      </label>
    );
  }
  return (
    <label htmlFor={props.id ? props.id : props.name + "-input"} key="label">
      {children}
      <span><span>{props.showLabel ? props.label : ""}</span></span>
    </label>
  );
}

export function render(props, base) {
  const _base = R.merge(inputBaseLib, base);

  if (props.hide) {
    return <span></span>;
  }

  let groupClasses = {
    "form-group": !props.standalone,
    "has-feedback": props.hasFeedback && !props.disabled && (props.help || props.showError),
    "has-success": props.bsStyle === "success",
    "has-warning": props.bsStyle === "warning",
    "has-error": props.bsStyle === "error" || props.showError,
    "text-right": props.labelPos === "right",
    "pull-right": props.labelPos === "right"
  };

  return (
    <div className={classnames(groupClasses, props.groupClassName)}>
      {
        _base.renderWrapper(props, [
          _base.renderInputGroup(props, [
            _base.renderLabelWrapper(props,
              _base.renderLabel(props,
                _base.renderInput(props)
              )
            ),
            _base.renderError(props),
            _base.renderHelp(props)
          ])
        ])
      }
    </div>
  );
}


export let propTypes = R.merge(inputBaseLib.propTypes, {
  className: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.array,
    React.PropTypes.object
  ]),
  style: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.array,
    React.PropTypes.object
  ]),
  onBlur: React.PropTypes.func,
  onChange: React.PropTypes.func,
  onFocus: React.PropTypes.func,
  disabled: React.PropTypes.bool,
  type: React.PropTypes.oneOf(["checkbox", "radio"]),

  hide: React.PropTypes.bool, // Whether the component should be rendered
  showLabel: React.PropTypes.bool,
  standalone: React.PropTypes.bool, // Whether the control should NOT be part of a form-group (standalone=true)
  groupClassName: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.array,
    React.PropTypes.object
  ]),
  labelWrapperClassName: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.array,
    React.PropTypes.object
  ]),
  bsStyle: React.PropTypes.string,
  labelPos: React.PropTypes.oneOf(["left", "right"])
});

export let defaultProps = R.merge(inputBaseLib.defaultProps, {
  labelPos: "left",
  showLabel: true
});
