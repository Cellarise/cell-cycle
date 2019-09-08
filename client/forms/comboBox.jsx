"use strict";
import React from 'react'; //eslint-disable-line no-unused-vars
import PropTypes from 'prop-types';
import R from 'ramda';
import SelectBox from './selectBox';
import Button from './button.jsx';

/**
 * ComboBox component
 * @param {Object} props - component properties
 * @return {React.Element} react element
 */
function ComboBox (props) {
    return (
      <div className="input-group">
        {_renderIncrement(props, false)}
        <SelectBox
          {...props}
          value={props.currentItem.id}
        />
        {_renderIncrement(props, true)}
      </div>
    );
  }

function _renderIncrement(props, up) {
  const field = props.field;
  let nextIndex;
  const currentIndex = R.findIndex((item) => (item.id === parseInt(props.currentItem.id, 10)), props.items);
  if (up && currentIndex === (props.items.length - 1)) {
    nextIndex = 0;
  } else if (!up && currentIndex === 0) {
    nextIndex = props.items.length - 1;
  } else {
    nextIndex = currentIndex + (up ? 1 : -1);
  }
  return (
    <span style={{
          "display": "table-cell",
          "verticalAlign": "middle"
        }}>
        <Button className="btn-secondary btn-sm"
                name={field ? field.get("name") : props.name}
                disabled={field ? field.get("disabled") : props.disabled}
                label={<span className={"glyphicon mdi-chevron-" + (up ? "right" : "left")}/>}
                data-type="number"
                data-value={props.items[nextIndex].id}
                onClick={props.onChange}>
        </Button>
      </span>
  );
}

ComboBox.propTypes = {
  currentItem: PropTypes.object,
  className: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array
  ]),
  multiple: PropTypes.bool,
  type: PropTypes.string,
  readOnly: PropTypes.bool,

  value: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
    PropTypes.bool
  ]),
  items: PropTypes.any,
  valueField: PropTypes.string,
  textField: PropTypes.string,
  includeBlank: PropTypes.bool
};
/**
 * @ignore
 */
module.exports = ComboBox;
