"use strict";
import React from "react";
import R from "ramda";
import Button from './button';
import {createSyntheticEvent} from "../utils/domDriverUtils";
import {eventHandler, getActiveRecord, getEventHandler} from "../utils/viewUtils";
import Label from "./label";
import NumberBox from "./numberBox.jsx";
import RadioButtonGroup from "../../../../client/source/view/features/admin/permitType/upsert";

function CounterNumberBox(props) {
  const {field, label, actions, store, embeddedPath, editable} = props;
  if (R.isNil(field) || R.isNil(field.get('value'))) {
    return null;
  }
  //if embeddedPath provided then assume this is a list record add/destroy control
  const isRecordListControl = !R.isNil(embeddedPath);
  const isEditable = R.defaultTo(false, editable) && !isRecordListControl; //must increment/decrement record list by 1

  const recordSize = isRecordListControl ? field.get('value').size : field.get('value');
  let incrementEventHandler, decrementEventHandler;
  if (isRecordListControl) {
    const onDestroyById = getEventHandler(actions, store, "onDestroyById");
    const onAddNewRecord = getEventHandler(actions, store, "onAddNewRecord");
    incrementEventHandler = () => onAddNewRecord(createSyntheticEvent("id", null, R.append(recordSize, embeddedPath)));
    decrementEventHandler = () => onDestroyById(createSyntheticEvent("", "", R.append(recordSize - 1, embeddedPath)));
  } else {
    const fieldName = field.get("name");
    const storeId = field.get("storeId");
    //normal counter
    incrementEventHandler = () => eventHandler(
      actions, store, 'onSetIn',
      createSyntheticEvent('incrementOnChange', recordSize, ['stores', storeId, 'records', 0, fieldName, 'value'])
    );
    decrementEventHandler = () => eventHandler(
      actions, store, 'onSetIn',
      createSyntheticEvent('decrementOnChange', recordSize, ['stores', storeId, 'records', 0, fieldName, 'value'])
    );
  }
  return (
    <div>
      <Label label={label} legend={true} className="standalone-label-wrap" field={field}/>
      <div className="input-group collapsed">
        {_renderIncrement(props, false, decrementEventHandler, recordSize)}
        {isEditable ?
          <NumberBox
            field={field}
            label={<span>{recordSize}</span>}
            showLabel={false}
            hasFeedback={false}
            actions={actions}
            store={store}
            className="text-center"
          />
          :
          <Button className="btn-secondary btn-sm"
                  name={field.get("name")}
                  label={<span>{recordSize}</span>}
          />
        }
        {_renderIncrement(props, true, incrementEventHandler, recordSize)}
      </div>
    </div>
  );
}

function _renderIncrement(props, up, onClick, recordSize) {
  const field = props.field;
  let disabled = field.get("disabled");
  if (up && recordSize >= R.defaultTo(2000, props.max)) {
    disabled = true;
  }
  if (!up && recordSize <= R.defaultTo(1, props.min)) {
    disabled = true;
  }

  return (
    <span style={{
      "display": "table-cell",
      "verticalAlign": "middle"
    }}>
        <Button className="btn-default btn-sm"
                name={field.get("name")}
                label={<span className={"glyphicon mdi-" + (up ? "plus" : "minus")}/>}
                onClick={disabled ? null : onClick} />
      </span>
  );
}

/**
 * @ignore
 */
module.exports = CounterNumberBox;
