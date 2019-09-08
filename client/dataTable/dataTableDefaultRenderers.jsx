"use strict";
import React from 'react'; //eslint-disable-line
import R from 'ramda';
import classnames from 'classnames';
import {icon as ariaIcon} from '../libraries/accessibility';
import {numberToFileSize} from '../utils/numberHelpers';
import Button from '../forms/button.jsx';
import TextBox from '../forms/textBox.jsx';
import NumberBox from '../forms/numberBox.jsx';
import CheckBox from '../forms/checkBox.jsx';
import RadioButtonGroup from '../forms/radioButtonGroup.jsx';
import DatePicker from '../forms/datePicker.jsx';
import SelectBox from '../forms/selectBox.jsx';
import AddressLookup from '../collection/addressLookup.jsx';
import WaypointLookup from '../collection/waypointLookup.jsx';
import SuggestionBox from '../collection/suggestionBox.jsx';
import {isImmutable, fixedLength, sanitise, toCamelCase, formattedDate, formattedDateTime} from '../utils';
import {UserProfilePicture, AccountPicture, cleanFileName} from '../utils/fileHelpers';


function getActionButton(checkResult, label, iconClass, action, item, idFieldName, actionButton, dEmbeddedPath,
                         rowKey) {
  const itemImmutable = isImmutable(item);
  const icon = <span className={classnames("glyphicon", iconClass)}/>;
  const onClick = (event) => (action(event, item, rowKey));
  onClick.authorised = action.authorised;
  return (
    <Button
      key={label}
      name={label}
      label={icon}
      disabled={checkResult.length > 0}
      title={checkResult.length > 0 ? checkResult : label}
      data-record-id={itemImmutable ? item.getIn([idFieldName, 'value']) : item[idFieldName]}
      data-toggle-tooltip="tooltip"
      data-placement="left"
      data-embedded-path={dEmbeddedPath}
      className={actionButton}
      onClick={onClick}
    />
  );
}
function getActionModalButton( //eslint-disable-line
  checkResult, label, iconClass, action, item, idFieldName, modalButton, dTarget, dEmbeddedPath
) {
  const itemImmutable = isImmutable(item);
  const icon = <span className={classnames("glyphicon", iconClass)}/>;
  const onClick = (event) => (action(event, item));
  onClick.authorised = action.authorised;
  return (
    <Button
      key={label}
      name={label}
      label={icon}
      disabled={checkResult.length > 0 || (itemImmutable && item.getIn([idFieldName, 'disabled']))}
      title={checkResult.length > 0 ? checkResult : label}
      data-record-id={itemImmutable ? item.getIn([idFieldName, 'value']) : item[idFieldName]}
      data-toggle-tooltip="tooltip"
      data-placement="left"
      data-toggle="modal"
      data-target={dTarget}
      data-embedded-path={dEmbeddedPath}
      className={modalButton}
      onClick={onClick}
    />
  );
}

let defaultRenderers = {
  /**
   * ActionButtonCell provides standard renderer for trigerring update, detailed view, or delete actions
   * @param {object} props - passed down props
   * @param {string} props.title - the singular name of the table
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @param {string} [props.classNameIcon] - a custom icon class name
   * @param {object} props.actions - the actions
   * @return {React.Element} react element
   */
  "actionButtonCell": function actionButtonCell({item, actions, embeddedPath, rowKey, title, ...otherProps}) {
    const _props = R.merge({
      "moveUpIcon": "mdi-arrow-up mdi-lg",
      "moveDownIcon": "mdi-arrow-down mdi-lg",
      "viewIcon": "mdi-file-document mdi-lg",
      "updateIcon": "mdi-pencil mdi-lg",
      "undoDeleteIcon": "mdi-undo-variant mdi-lg",
      "deleteIcon": "mdi-delete mdi-lg",
      "customIcon": "mdi-content-copy mdi-lg",
      "actionButton": "btn-xs btn-icon-toggle btn-primary",
      "modalButton": "btn-xs btn-icon-toggle btn-primary",
      "moveUpCheck": null,
      "moveDownCheck": null,
      "deleteCheck": null,
      "label": "Are you sure you want to delete this record?",
      "inProgress": false,
      "inkEffect": true,
      "idFieldName": "id",
      "moveUpLabel": "Move row up",
      "moveDownLabel": "Move row down",
      "deleteLabel": "Delete row",
      "undoDeleteLabel": "Undo delete row"
    }, otherProps);
    const {idFieldName, modalButton, actionButton,
      customLabel, undoDeleteLabel, deleteLabel,
      viewIcon, customIcon, moveUpIcon, moveDownIcon, updateIcon, undoDeleteIcon, deleteIcon,
      customCheck, customDeleteCheck,
      moveUpCheck, moveDownCheck, viewCheck, updateCheck, deleteCheck, undoDeleteCheck} = _props;
    const itemImmutable = isImmutable(item);
    const dEmbeddedPath = embeddedPath ? JSON.stringify(R.concat(embeddedPath, [rowKey])) : null;
    let actionButtons = [], dTarget, checkResult,
      moveUpCheckResult, moveDownCheckResult,
      undoCheckResult, viewCheckResult, updateCheckResult, customCheckResult, customDeleteCheckResult;

    if (itemImmutable && (R.isNil(item.get(idFieldName)) || R.isNil(item.getIn([idFieldName, "value"])))) {
      return <span className="text-right no-linebreak"></span>;
    } else if (!itemImmutable && (R.isNil(item[idFieldName])
      || (item[idFieldName].hasOwnProperty("value") && R.isNil(item[idFieldName].value)))) {
      return <span className="text-right no-linebreak"></span>;
    }

    if (actions.custom) {
      customCheckResult = customCheck ? customCheck(item, rowKey) : "";
      actionButtons.push(
        getActionButton(
          customCheckResult, customLabel, customIcon, actions.custom, item,
          idFieldName, actionButton, dEmbeddedPath, rowKey
        )
      );
    }
    if (actions.moveDown) {
      moveDownCheckResult = moveDownCheck ? moveDownCheck(item, rowKey) : "";
      actionButtons.push(
        getActionButton(
          moveDownCheckResult, "Move Down", moveDownIcon, actions.moveDown, item,
          idFieldName, actionButton, dEmbeddedPath
        )
      );
    }
    if (actions.moveUp) {
      moveUpCheckResult = moveUpCheck ? moveUpCheck(item, rowKey) : "";
      actionButtons.push(
        getActionButton(
          moveUpCheckResult, "Move Up", moveUpIcon, actions.moveUp, item, idFieldName, actionButton, dEmbeddedPath
        )
      );
    }
    if (actions.view) {
      viewCheckResult = viewCheck ? viewCheck(item) : "";
      actionButtons.push(
        getActionButton(
          viewCheckResult, "View", viewIcon, actions.view, item, idFieldName, actionButton, dEmbeddedPath
        )
      );
    }
    if (actions.update) {
      updateCheckResult = updateCheck ? updateCheck(item) : "";
      actionButtons.push(
        getActionButton(
          updateCheckResult, "Update", updateIcon, actions.update, item,
          idFieldName, actionButton, dEmbeddedPath
        )
      );
    }
    if (actions.undoDelete) {
      dTarget = "#undoDeleteModal" + toCamelCase(title);
      undoCheckResult = undoDeleteCheck ? undoDeleteCheck(item) : "";
      if (undoCheckResult === "") {
        actionButtons.push(
          getActionModalButton(
            undoCheckResult, undoDeleteLabel, undoDeleteIcon, actions.undoDelete, item,
            idFieldName, modalButton, dTarget, dEmbeddedPath
          )
        );
      }
    }
    if (actions.delete) {
      dTarget = "#deleteModal" + toCamelCase(title);
      checkResult = deleteCheck ? deleteCheck(item) : "";
      //only show delete icon if an undo action is not provided or the undo action check failed
      if (!actions.undoDelete || undoCheckResult !== "") {
        actionButtons.push(
          getActionModalButton(
            checkResult, deleteLabel, deleteIcon, actions.delete, item,
            idFieldName, modalButton, dTarget, dEmbeddedPath
          )
        );
      }
    }
    if (actions.customDelete) {
      customDeleteCheckResult = customDeleteCheck ? customDeleteCheck(item, rowKey) : "";
      actionButtons.push(
        getActionButton(
          customDeleteCheckResult, deleteLabel, deleteIcon, actions.customDelete, item,
          idFieldName, actionButton, dEmbeddedPath, rowKey
        )
      );
    }
    if (actionButtons.length === 0) {
      actionButtons.push(<span key="None" className={_props.className}></span>);
    }
    return <span className="no-linebreak">{actionButtons}</span>;
  },
  /**
   * FileActionButtonCell provides standard renderer for trigerring file delete actions and displaying upload progress
   * @param {object} props - passed down props
   * @param {string} props.title - the singular name of the table
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @param {string} [props.classNameIcon] - a custom icon class name
   * @param {object} props.actions - the actions
   * @return {React.Element} react element
   */
  "fileActionButtonCell": function actionButtonCell(props) {
    var _props = R.merge({
      "updateIcon": "mdi-pencil",
      "deleteIcon": "mdi-delete",
      "updateButton": "btn-xs btn-icon-toggle btn-primary",
      "deleteButton": "btn-xs btn-icon-toggle btn-default",
      "label": "Are you sure you want to delete this file?",
      "inProgress": false,
      "inkEffect": true,
      "idFieldName": "id"
    }, props);
    var actionButtons = [], icon;
    var embeddedPath = props.embeddedPath;
    if (_props.item.hasOwnProperty("temp") || R.isNil(_props.item[_props.idFieldName])
      || (_props.item[_props.idFieldName].hasOwnProperty("value") && R.isNil(_props.item[_props.idFieldName].value))) {
      return <span className="text-right no-linebreak"></span>;
    }
    if (_props.actions.delete) {
      icon = <span className={classnames("glyphicon", _props.deleteIcon)}/>;
      actionButtons.push(
        <Button
          key="Delete"
          name="Delete"
          label={icon}
          title="Delete file"
          data-record-id={_props.item[_props.idFieldName]}
          data-toggle-tooltip="tooltip"
          data-placement="top"
          data-toggle="modal"
          data-target={"#deleteModal" + toCamelCase(_props.title)}
          data-embedded-path={embeddedPath ? JSON.stringify(R.concat(embeddedPath, [props.rowKey])) : null}
          className={_props.deleteButton}
          onClick={(event) => (_props.actions.delete(event, _props.item))}
          disabled={_props.disabled}
        />
      );
    }
    if (actionButtons.length === 0) {
      actionButtons.push(<span key="None" className={_props.className}></span>);
    }
    return <span className="text-right no-linebreak">{actionButtons}</span>;
  },
  /**
   * Default renderer for fields of type fileThumbnail
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "fileThumbnail": function fileThumbnail(props) {
    var _src = props.item.src || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAABbElEQVRYR+3Xv0vDUBAH8LsXqqjgrDg4a1qci02b1sFFayJInXTyx39hFZeOgv+Ck6Dpj1FreaKD4NR06B+gg1tXTe8k4CAlljSl1OG9+V3uc18y3EMY88Ex94dAQDK5M9WJfV0CQUEImImCZIS251Gu/VR571cfCEgYVokRFicnYkevd9edQQFx0zLJgxoKevO6kO2HCATEU3adBZy35G190Ob+/YRhZxjhjJkcQD7uhwgE6Ol8A4Uoug2nEQWwZGzPa+A1haaZRLzOQId/IUYC8NF6emsPCUogcO5niKornXzvQCMD/G7k/xNMVGzJiqkAKgGVgEpAJaASUAmoBFQCoRKIG9YDaHAadSntbeKvZNCFE/fRyYYC6CnrCgW8uNK5iLIV99boGfsAmddc6eyGAiyvbuqA2r1AugEUH0MhkKeJeV8A2q4sP4cC+JdWchsL1I0VmHl2SMAnMlSbstwM+s7/fJwONfGAxd9poWEwTmc1AwAAAABJRU5ErkJggg==";  //eslint-disable-line max-len
    return (
      <span className="preview"><img data-dz-thumbnail src={_src} alt={sanitise(props.item.name)}/></span>
    );
  },
  /**
   * Default renderer for fields of type file name
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "fileName": function fileName(props) {
    return (
      <span className="no-linebreak">
        <a href={props.item.containerUrl + "&fileName=" + cleanFileName(props.item[props.column])}
           target="_blank"
           rel="noopener noreferrer">
          {props.item[props.column]}
        </a>
      </span>
    );
  },
  /**
   * Default renderer for fields of type file size
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "fileSize": function fileSize(props) {
    const value = props.item[props.column];
    return <span className="no-linebreak">{numberToFileSize(value)}</span>;
  },
  /**
   * Default renderer for fields of type file progress
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "progress": function progress(props) {
    if (props.item.hasOwnProperty("progress")) {
      return (
        <div className="progress no-bottom-margin width-2">
          <div className="progress-bar progress-bar-striped active" role="progressbar"
               aria-valuenow={props.item.progress} aria-valuemin="0" aria-valuemax="100"
               style={{"width": props.item.progress}}>
            Uploading...
          </div>
        </div>
      );
    }
    return <span className="no-linebreak"></span>;
  },
  /**
   * Default renderer for record fields of type input
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "recordInput": function recordInput({
    item, rowKey, column, embeddedPath, className, actions, onChange, currentRowIndex
  }) {
    if (!R.isNil(currentRowIndex) && currentRowIndex !== rowKey) {
      const text = item.getIn([column, 'value']);
      return (
        <span
          className="no-linebreak"
          title={sanitise(text)}
          data-toggle="tooltip"
          data-placement="top">{text}</span>
      );
    }
    return (
      <TextBox
        id={item.getIn([column, "name"]) + "-" + rowKey + "-input"}
        field={item.get(column)}
        actions={actions}
        onChange={onChange}
        className={className}
        standalone={true}
        showLabel={false}
        hasFeedback={false}
        tableStyle={true}
        style={{"position": "unset", "float": "unset"}}
        embeddedPath={embeddedPath ? R.concat(embeddedPath, [rowKey]) : null}
        data-record-idx={embeddedPath ? null : rowKey}
      />
    );
  },

  "statusRenderrer": ({ item, rowKey, column, embeddedPath, className, actions, onChange }) => {
    let value = item.getIn([column, "value"]);

    switch(value) {
      case "Deleted":
          value = "Delete";
          break;
      case "Updated":
          value = "Update";
          break;
      case "Added":
          value = "Add";
          break;
      case "Added Maintenance":
        value = "Add Maintenance";
        break;
      case "Added Mass":
        value = "Add Mass";
        break;
      default:
        break;
    }

    item = item.setIn([column, "value"], value);

    return (
      <TextBox
        id={item.getIn([column, "name"]) + "-" + rowKey + "-input"}
        field={item.get(column)}
        actions={actions}
        onChange={onChange}
        className={className}
        standalone={true}
        showLabel={false}
        hasFeedback={false}
        tableStyle={true}
        readOnly={true}
        style={{"position": "unset", "float": "unset"}}
        embeddedPath={embeddedPath ? R.concat(embeddedPath, [rowKey]) : null}
        data-record-idx={embeddedPath ? null : rowKey}
      />
    );
  },

  "recordInputReadOnly": function recordInput({
                                        item, rowKey, column, embeddedPath, className, actions,
                                                onChange, currentRowIndex
                                      }) {
    if (!R.isNil(currentRowIndex) && currentRowIndex !== rowKey) {
      const text = item.getIn([column, 'value']);
      return (
        <span
          className="no-linebreak"
          title={sanitise(text)}
          data-toggle="tooltip"
          data-placement="top">{text}</span>
      );
    }
    return (
      <TextBox
        id={item.getIn([column, "name"]) + "-" + rowKey + "-input"}
        field={item.get(column)}
        actions={actions}
        onChange={onChange}
        className={className}
        standalone={true}
        showLabel={false}
        hasFeedback={false}
        tableStyle={true}
        readOnly={true}
        style={{"position": "unset", "float": "unset"}}
        embeddedPath={embeddedPath ? R.concat(embeddedPath, [rowKey]) : null}
        data-record-idx={embeddedPath ? null : rowKey}
      />
    );
  },
  /**
   * Default renderer for record fields of type input number
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "recordNumber": function recordNumber({item, rowKey, column, embeddedPath, className, actions, onChange}) {
    return (
      <NumberBox
        id={item.getIn([column, "name"]) + "-" + rowKey + "-input"}
        field={item.get(column)}
        actions={actions}
        onChange={onChange}
        className={className}
        standalone={true}
        showLabel={false}
        style={{"position": "unset", "float": "unset"}}
        hasFeedback={false}
        tableStyle={true}
        embeddedPath={embeddedPath ? R.concat(embeddedPath, [rowKey]) : null}
        data-record-idx={embeddedPath ? null : rowKey}
      />
    );
  },
  /**
   * Default renderer for record fields of type select
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "recordSuggestion": function recordSuggestion({item, rowKey, column, embeddedPath, className, actions, onChange}) {
    return (
      <SuggestionBox
        id={item.getIn([column, 'name']) + "-" + rowKey + "-recordSuggestion"}
        idField=""
        placeholder=""
        field={item.get(column)}
        actions={actions}
        onChange={onChange}
        className={className}
        standalone={true}
        showLabel={false}
        hasFeedback={false}
        style={{"position": "unset", "float": "unset"}}
        tableStyle={true}
        embeddedPath={embeddedPath ? R.concat(embeddedPath, [rowKey]) : null}
        data-record-idx={embeddedPath ? null : rowKey}
      />
    );
  },
  /**
   * Default renderer for record fields of type select
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "recordSelect": function recordSelect({
    item, rowKey, column, embeddedPath, className, actions, onChange, onBlur, currentRowIndex
  }) {
    if (!R.isNil(currentRowIndex) && currentRowIndex !== rowKey) {
      const text = item.getIn([column, 'value']);
      return (
        <span
          className="no-linebreak"
          title={sanitise(text)}
          data-toggle="tooltip"
          data-placement="top">{text}</span>
      );
    }
    return (
      <SelectBox
        id={item.getIn([column, "name"]) + "-" + rowKey + "-input"}
        field={item.get(column)}
        actions={actions}
        onChange={onChange}
        onBlur={onBlur}
        className={className}
        includeBlank={true}
        style={{"position": "unset", "float": "unset"}}
        standalone={true}
        showLabel={false}
        hasFeedback={false}
        tableStyle={true}
        embeddedPath={embeddedPath ? R.concat(embeddedPath, [rowKey]) : null}
        data-record-idx={embeddedPath ? null : rowKey}
      />
    );
  },
  "recordRadioButtonGroup": function recordRadioButtonGroup({item, rowKey, column, embeddedPath, className,
                                                            actions, onChange, onBlur, currentRowIndex}) {
    if (!R.isNil(currentRowIndex) && currentRowIndex !== rowKey) {
      const text = item.getIn([column, 'value']);
      return (
        <span
          className="no-linebreak"
          title={sanitise(text)}
          data-toggle="tooltip"
          data-placement="top">{text}</span>
      );
    }
    return (
      <RadioButtonGroup
        id={item.getIn([column, "name"]) + "-" + rowKey + "-input"}
        field={item.get(column)}
        actions={actions}
        onChange={onChange}
        onBlur={onBlur}
        className={className}
        style={{"position": "sticky"}}
        standalone={true}
        showLabel={false}
        hasFeedback={false}
        tableStyle={true}
        embeddedPath={embeddedPath ? R.concat(embeddedPath, [rowKey]) : null}
        data-record-idx={embeddedPath ? null : rowKey}
      />
    );
  },
  /**
   * Default renderer for record fields of type boolean
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "recordCheck": function recordCheck({item, rowKey, column, embeddedPath, className, actions, onChange, onBlur}) {
    return (
      <CheckBox
        field={item.get(column)}
        actions={actions}
        onChange={onChange}
        onBlur={onBlur}
        className={className}
        id={item.getIn([column, 'name']) + rowKey}
        standalone={true}
        stickyCheckBox={true}
        showLabel={false}
        hasFeedback={false}
        tableStyle={true}
        embeddedPath={embeddedPath ? R.concat(embeddedPath, [rowKey]) : null}
        data-record-idx={embeddedPath ? null : rowKey}
      />
    );
  },
  /**
   * Default renderer for record fields of type date
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "recordDate": function recordDate({item, rowKey, column, embeddedPath, monthPicker, className, actions, onChange, onBlur}) {
    return (
      <DatePicker
        field={item.get(column)}
        actions={actions}
        onChange={onChange}
        onBlur={onBlur}
        className={className}
        id={item.getIn([column, 'name']) + rowKey}
        standalone={true}
        showLabel={false}
        style={{"position": "unset", "float": "unset"}}
        hasFeedback={false}
        tableStyle={true}
        monthPicker={monthPicker}
        embeddedPath={embeddedPath ? R.concat(embeddedPath, [rowKey]) : null}
        data-record-idx={embeddedPath ? null : rowKey}
      />
    );
  },
  /**
   * Default renderer for record fields of type address lookup
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "recordAddressLookup": function recordAddressLookup(props) {
    const {item, rowKey, column, embeddedPath, actions, onChangeId, passSuggestionObject, placeholder} = props;
    return (
      <AddressLookup
        id={rowKey + item.getIn([column, 'name'])}
        field={item.get(column)}
        actions={actions}
        onChangeId={onChangeId}
        passSuggestionObject={passSuggestionObject}
        placeholder={placeholder}
        embeddedPath={embeddedPath ? R.concat(embeddedPath, [rowKey]) : null}
        standalone={true}
        showLabel={false}
        hasFeedback={false}
        style={{"position": "unset", "float": "unset"}}
        tableStyle={false}
        data-record-idx={embeddedPath ? null : rowKey}
        className={props.className}
      />
    );
  },
  /**
   * Default renderer for record fields of type waypoint lookup
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "recordWaypointLookup": function recordWaypointLookup(props) {
    const {item, rowKey, column, embeddedPath, actions, onChangeId, passSuggestionObject, placeholder} = props;
    return (
      <WaypointLookup
        id={rowKey + item.getIn([column, 'name'])}
        field={item.get(column)}
        actions={actions}
        onChangeId={onChangeId}
        passSuggestionObject={passSuggestionObject}
        placeholder={placeholder}
        embeddedPath={embeddedPath ? R.concat(embeddedPath, [rowKey]) : null}
        standalone={true}
        showLabel={false}
        style={{"position": "unset", "float": "unset"}}
        hasFeedback={false}
        tableStyle={false}
        data-record-idx={embeddedPath ? null : rowKey}
        className={props.className}
      />
    );
  },
  /**
   * Default renderer for fields of type boolean
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  // "archived": function archived(props) {
  //   var boolValue = props.item[props.column];
  //   //var displayStatus;
  //   var iconLabel = "", iconClass = "glyphicon mdi-none";
  //   if (R.isNil(boolValue) || boolValue === "") {
  //     iconLabel = "Empty";
  //     iconClass = "glyphicon mdi-close-circle-outline text-success";
  //     // iconClass = "glyphicon mdi-clock text-warning";
  //   } else if (boolValue) {
  //     iconLabel = "Yes";
  //     iconClass = "glyphicon mdi-checkbox-marked-circle-outline text-danger";
  //   } else {
  //     iconLabel = "No";
  //     iconClass = "glyphicon mdi-close-circle-outline text-success";
  //   }
  //   return (
  //     <span
  //       aria-label={ariaIcon(iconLabel)}
  //       className={props.className}><span className={iconClass}/></span>
  //   );
  // },
  /**
   * Default renderer for fields of type date
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "date": function date(props) {
    const text = formattedDate(props.item[props.column], "-");
    return (
      <span
        className={classnames(props.className, "no-linebreak")}
        title={text}
        data-toggle="tooltip"
        data-placement="top">{text}</span>
    );
  },
  /**
   * Renderer for fields of type date
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "dateTime": function dateTime(props) {
    const text = formattedDateTime(props.item[props.column], "-");
    return (
      <span
        className={classnames(props.className, "no-linebreak")}
        title={text}
        data-toggle="tooltip"
        data-placement="top">{text}</span>
    );
  },
  /**
   * Default renderer for fields of type string
   * NB: assumes that tooltips is included by parent component
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "recordString": function recordString(props) {
    var text = props.item.getIn([props.column, "value"]);
    return (
      <span
        className={classnames(props.className, "no-linebreak")}
        title={sanitise(text)}
        data-toggle="tooltip"
        data-placement="top">{fixedLength(text, 60)}</span>
    );
  },
  "array": function array(props) {
    let arr = R.defaultTo([], props.item[props.column]);
    if (!R.is(Array, arr)) {
      arr = [];
    }
    const arrStr = arr.join(", ");
    return (
      <span
        className={classnames(props.className, "no-linebreak")}
        title={sanitise(arrStr)}
        data-toggle="tooltip"
        data-placement="top">{fixedLength(arrStr, 60)}</span>
    );
  },
  "JSON": function JSON(props) {
    return (
      <span
        className={classnames(props.className, "no-linebreak")}
        title={"-"}
        data-toggle="tooltip"
        data-placement="top">{"-"}</span>
    );
  },
  /**
   * Default renderer for fields of type string
   * NB: assumes that tooltips is included by parent component
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "string": function string(props) {
    var text = R.defaultTo("", props.item[props.column]);

    return (
      <span
        className={props.className === "yes-linebreak" ? "yes-linebreak" : classnames(props.className, "no-linebreak")}
        title={sanitise(text)}
        data-toggle="tooltip"
        data-placement="top">{fixedLength(text, 60)}</span>
    );
  },
  /**
   * Default renderer for fields of type number
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "number": function number(props) {
    var text = R.defaultTo("", props.item[props.column]);
    if (text !== "" && props.validation && props.validation.uom) {
      return (
        <span className={props.className}>{text + props.validation.uom}</span>
      );
    }
    return (
      <span className={props.className}>{text}</span>
    );
  },
  /**
   * Default renderer for fields of type boolean
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "boolean": function boolean(props) {
    var boolValue = props.item[props.column];
    //var displayStatus;
    var iconLabel = "", iconClass = "glyphicon mdi-none";
    if (R.isNil(boolValue) || boolValue === "") {
      iconLabel = "Empty";
      iconClass = "glyphicon mdi-close-circle-outline text-danger";
      // iconClass = "glyphicon mdi-clock text-warning";
    } else if (boolValue) {
      iconLabel = "Yes";
      iconClass = "glyphicon mdi-checkbox-marked-circle-outline text-success";
    } else {
      iconLabel = "No";
      iconClass = "glyphicon mdi-close-circle-outline text-danger";
    }
    return (
      <span
        aria-label={ariaIcon(iconLabel)}
        className={props.className}><span className={iconClass}/></span>
    );
  },
  /**
   * Default renderer for fields of type user profile picture
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "fileList": function fileList({item, columnHeader}) {
    if (columnHeader === "Logo") {
      return (
        <AccountPicture fileList={item.fileList}/>
      );
    }
    return (
      <UserProfilePicture fileList={item.fileList}/>
    );
  },
  /**
   * Default renderer for fields representing a 0 based list index
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "listIndex": function listIndex(props) {
    var text = R.defaultTo(0, props.item[props.column]) + 1;

    return (
      <span
        className={classnames(props.className, "no-linebreak")}
        title={sanitise(text)}
        data-toggle="tooltip"
        data-placement="top">{text}</span>
    );
  },
  /**
   * Default renderer for fields named createdBy
   * NB: assumes that tooltips is included by parent component
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "createdBy": function createdBy(props) {
    var email = props.item.userModelCreatedBy.email;
    return (
      <span
        className={classnames(props.className, "no-linebreak")}
        title={email}
        data-toggle="tooltip"
        data-placement="top">{email}</span>
    );
  },
  /**
   * Default renderer for fields named createdBy
   * NB: assumes that tooltips is included by parent component
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "modifiedBy": function modifiedBy(props) {
    var email = props.item.userModelModifiedBy.email;
    return (
      <span
        className={classnames(props.className, "no-linebreak")}
        title={email}
        data-toggle="tooltip"
        data-placement="top">{email}</span>
    );
  },
  /**
   * Default renderer for fields named createdBy
   * NB: assumes that tooltips is included by parent component
   * @param {object} props - passed down props
   * @param {object} props.item - the table row
   * @param {string} props.column - the table column
   * @param {string} [props.className] - a custom class name for the rendered element
   * @return {React.Element} react element
   */
  "assignedTo": function assignedTo(props) {
    let userModelAssignedTo = props.column === "assignedToKPI"
      ? props.item.userModelAssignedToKPI
      : props.item.userModelAssignedTo;
    let email = R.isNil(userModelAssignedTo) ? "-" : userModelAssignedTo.email;
    let name = R.isNil(userModelAssignedTo)
      ? "-"
      : userModelAssignedTo.firstName + " " + userModelAssignedTo.name;
    return (
      <span
        className={classnames(props.className, "no-linebreak")}
        title={sanitise(name + " (" + email + ")")}
        data-toggle="tooltip"
        data-placement="top">{name}</span>
    );
  },
  "accountTypeLabel": function accountTypeLabel(accountType, RMID) {
    let label, labelClass;
    switch (accountType) {
      case "customer":
        label = "Customer";
        labelClass = "label-success";
        break;
      case "partner":
        label = "Road Manager";
        labelClass = "label-warning";
        break;
      case "operations":
        label = "Regulator";
        labelClass = "label-info";
        break;
      default:
        label = accountType;
        labelClass = "label-default";
        break;
    }
    return <span className={classnames("label", labelClass)}>{label + (R.isNil(RMID) ? '' : ' (' + RMID + ')')}</span>;
  }
};
module.exports = defaultRenderers;
