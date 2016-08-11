"use strict";
import React from 'react'; //eslint-disable-line  no-unused-vars

function Loading(props) {
  return (
    <section>
      <div className="row row-md-flex-center">
        <div className="col-md-12">
          <div className="alert alert-callout alert-info" role="alert">
            <span className="text-info glyphicon mdi-refresh mdi-spin mdi-2x" />
            &nbsp;
            &nbsp;
            <span>{props.title}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

Loading.displayName = "Loading";
/**
 * @ignore
 */
module.exports = Loading;

