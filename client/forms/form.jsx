"use strict";
import React from 'react'; //eslint-disable-line no-unused-vars
import classnames from 'classnames';

/**
 * Form component
 * @param {Object} props - component properties
 * @param {String} [props.id] - form id (random id generated if not provided)
 * @param {Function} [props.onSubmit] - form ob submit function
 * @param {String} [props.className] - form classname
 * @return {React.Element} react element
 */
function Form(props) {
  var {id, name, onSubmit, className, renderForm} = props;
  if (!id) {
    id = name + "-form-id";
  }
  if (renderForm === false) {
    return (
      <div>
        {props.children}
      </div>
    );
  }
  return (
    <form id={id} className={classnames("form", className)} role="form" style={{"height": "100%"}}
          onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (onSubmit) {
                onSubmit(event);
              }
            }}>
      {props.children}
    </form>
  );
}

module.exports = Form;
