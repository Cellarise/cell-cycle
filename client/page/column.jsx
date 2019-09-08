"use strict";
import React from 'react';

function Column(props) {
  return (
    <section>
      <div className="section-body">
        <div className="card contain-sm style-transparent">
          <div className="card-body">
            <div className="row">
              {renderChildren(props.children, props)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
Column.displayName = "Column";

function renderChildren(children, props) {
  var childCount = React.Children.count(children);
  if (childCount > 4) {
    return null;
  }
  return React.Children.map(children, child => {
      return (
        <div className={"col-sm-" + 12 / childCount}>
          {React.cloneElement(child, props)}
        </div>
      );
    }
  );
}

/**
 * @ignore
 */
module.exports = Column;
