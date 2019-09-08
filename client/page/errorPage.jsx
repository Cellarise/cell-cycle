"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';

module.exports = createReactClass({
  "displayName": "layouts/errorPage",
  "propTypes": {
    "errorCode": PropTypes.string,
    "errorMessage": PropTypes.string,
    "icon": PropTypes.string
  },
  "render": function render() {
    return (
      <section>
        <div className="section-body contain-lg">
          <div className="row">
            <div className="col-lg-12 text-center">
              <h1><span className="text-xxxl text-light">
                {this.props.errorCode} <span className={this.props.icon}/>
              </span></h1>

              <h2 className="text-light">{this.props.errorMessage}</h2>
            </div>
          </div>
        </div>
      </section>
    );
  }
});
