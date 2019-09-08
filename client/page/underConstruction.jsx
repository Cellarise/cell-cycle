"use strict";
import React from 'react'; //eslint-disable-line no-unused-vars
import Button from '../forms/button.jsx';
import * as routerLibrary from '../libraries/router';

function UnderConstruction() {
  return (
    <div className="row">
      <div className="col-sm-12 text-center">
        <div className="text-center-dark">
              <span className="text-primary-alt text-medium text-xxl">
                Page under construction
              </span>
        </div>
        <div className="row">
          <div className="text-center-dark">
              <span className="text-primary-alt text-medium text-xxxxl">
                <span className="glyphicon mdi-puzzle text-primary-dark"/>
              </span>
          </div>
          <div>
            <Button onClick={() => (routerLibrary.linkSelect.call(
                  routerLibrary, null, routerLibrary.createALink("page=")))}
                    className="btn btn-primary-dark ink-reaction"
                    label="Back to menu"/>
          </div>
        </div>

      </div>
    </div>
  );
}

module.exports = UnderConstruction;
