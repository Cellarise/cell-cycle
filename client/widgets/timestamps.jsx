"use strict";
import React from "react";
import PropTypes from 'prop-types';
import TextBox from "../forms/textBox.jsx";


// Renders timestamps block only if a record is created (has a created date) or if alwaysShow is enabled
function Timestamps({activeRecord, alwaysShow}) {
  const timestampsHtml = (
    <div className="timestamps row">
      <div className="col-xs-12 col-sm-6">
        <div className="row">
          <div className="col-xs-12 col-sm-6">
            <TextBox
              type="datetime"
              disabled={true}
              readOnly={true}
              field={activeRecord.get('created')}
            />
          </div>
          <div className="col-xs-12 col-sm-6">
            <TextBox
              disabled={true}
              readOnly={true}
              field={activeRecord.get('createdBy')}
              value={activeRecord.getIn(['userModelCreatedBy', 'value']).email}
            />
          </div>
        </div>
      </div>
      <div className="col-xs-12 col-sm-6">
        <div className="row">
          <div className="col-xs-12 col-sm-6">
            <TextBox
              type="datetime"
              disabled={true}
              readOnly={true}
              field={activeRecord.get('modified')}
            />
          </div>
          <div className="col-xs-12 col-sm-6">
            <TextBox
              disabled={true}
              readOnly={true}
              field={activeRecord.get('modifiedBy')}
              value={activeRecord.getIn(['userModelModifiedBy', 'value']).email}/>
          </div>
        </div>
      </div>
    </div>
  );
  return <div>{(alwaysShow || activeRecord.getIn(['created', 'value'])) && timestampsHtml}</div>;
}
Timestamps.displayName = "Timestamps";
Timestamps.propTypes = {
  "activeRecord": PropTypes.object.isRequired
};

/**
 * @ignore
 */
module.exports = Timestamps;
