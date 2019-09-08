"use strict";
import React from "react"; //eslint-disable-line no-unused-vars
import {eventHandler} from "../utils/viewUtils";
import Button from "../forms/button";
import {createSyntheticEvent} from "../utils/domDriverUtils";
import {doc} from "../globals";


function JumpToTabButton({store, actions, jumpToTabIdx}) {
  return (
    <Button
      name={jumpToTabIdx + "-jumpToTabIdx"}
      label={<span className={"glyphicon mdi-pencil mdi-lg"}/>}
      onClick={() => {
        doc.getElementById("content").scrollTop = 0;
        eventHandler(actions, store, 'onSetTab', createSyntheticEvent(null, jumpToTabIdx))
      }}
      className="btn-sm btn-icon-toggle btn-primary"
    />
  );
}

module.exports = JumpToTabButton;
