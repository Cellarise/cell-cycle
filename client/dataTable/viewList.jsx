"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import R from 'ramda';
import Card from '../page/card.jsx';
import CheckBox from '../forms/checkBox.jsx';
import {renderCell, renderActionBar} from './dataTableQueryLib';
import {createSyntheticEvent} from '../utils/domDriverUtils';


/**
 * ViewList component
 * @param {object} props - component properties
 * @return {React.Element} react element
 */
function ViewList(props) {
  const {collection} = props;
  const records = collection.get('records');
  const labelColumnSpec = collection.get('labelColumnSpec');
  const pictureColumnSpec = collection.get('pictureColumnSpec');
  if (R.isNil(labelColumnSpec) || R.isNil(pictureColumnSpec)) {
    return (
      <div className="row">
      </div>
    );
  }
  return (
    <div className="row">
      {R.addIndex(R.map)(renderRow(props, labelColumnSpec, pictureColumnSpec), records)}
    </div>
  );
}

function renderRow(props, labelColumnSpec, pictureColumnSpec) {
  const {tableModel, title} = props;
  const _pictureColumnSpec = R.assoc("className", "vehicleConfigurationCard", pictureColumnSpec);

  return function _renderRow(row, rowKey) {
    const cardSize = 2;
    let cardClassName, cardHeader = "";

    if (cardSize === 0 || cardSize === 1) {
      cardClassName = "col-xs-6 col-sm-4 col-md-3";
    } else if (cardSize === 2) {
      cardClassName = "col-xs-12 col-sm-6 col-md-4";
    } else if (cardSize === 3) {
      cardClassName = "col-xs-12 col-sm-9 col-md-8";
    } else {
      cardClassName = "col-xs-12 col-sm-12 col-md-8";
    }
    if (labelColumnSpec && R.has(labelColumnSpec.field, row)) {
      cardHeader = R.defaultTo("", row[labelColumnSpec.field]);
    }
    cardHeader = R.defaultTo("", row.id) + ": " + cardHeader;
    //const className = R.defaultTo("img-responsive center-block");
    return (
      <div key={"listTableCard" + rowKey}
           className={cardClassName}>
        <Card key="listTableCard"
              name={"listTableCard" + rowKey}
              preTools={<CheckBox
                  id={"selectRow" + rowKey}
                  name={"selectRow" + rowKey}
                  standalone={true}
                  showLabel={false}
                  hasFeedback={false}
                  labelWrapperClassName="checkbox-inline checkbox-header-default-bright"
                  inputGroupContentClassName="input-group-content-no-padding"
                  value={row._selected}
                  onChange={() => {
                    props.onCollectionPropChange(createSyntheticEvent("selectRow", rowKey));
                  }}
                />}
              header={R.defaultTo(" ", cardHeader)}
              classNameHeader="style-primary card-head-check"
              classNameBody="no-padding"
        >
          {renderCell(_pictureColumnSpec, row, rowKey, title, props)}
          {renderActionBar(row, rowKey, tableModel[tableModel.length - 1])}
        </Card>
      </div>
    );
  };
}

ViewList.displayName = "ViewList";
ViewList.propTypes = {
  "collection": PropTypes.object.isRequired,
  "onCollectionPropChange": PropTypes.func,
  "modal": PropTypes.string,
  "onClick": PropTypes.func,
  "onCustomLabel": PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ])
};
/**
 * @ignore
 */
module.exports = ViewList;
