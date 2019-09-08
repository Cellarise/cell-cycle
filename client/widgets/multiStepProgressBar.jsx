"use strict";
/* eslint no-unused-vars:0 */
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import R from 'ramda';

function renderSteps(props) {
  return R.addIndex(R.map)(function mapStep(step, idx) {
    var classes = classnames({
      "multiStepProgressBar-issue": step.issue,
      "multiStepProgressBar-done": step.done && !step.issue,
      "multiStepProgressBar-inProgress": step.inProgress && !step.issue,
      "multiStepProgressBar-todo": !step.done && !step.inProgress && !step.issue && !step.delegated,
      "multiStepProgressBar-delegated": step.delegated
    });
    return (
        <li
          key={idx}
          title={step.tooltip}
          data-toggle="tooltip"
          data-placement="top"
          className={classes}></li>
    );
  }, props.steps);
}

module.exports = function render(props) {
  var classes = {};
  if (props.className && props.className.length > 0) {
    classes[props.className] = true;
  } else {
    classes.multiStepProgressBar = true;
  }
  return (
    <ol className={classnames(classes)} data-multistepprogressbar-steps={props.steps.length + 1}>
      {renderSteps(props)}
    </ol>
  );
};
