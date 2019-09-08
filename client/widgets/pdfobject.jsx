import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from 'ramda';
import PDFObject from 'pdfobject';
import {$} from '../globals';


module.exports = createReactClass({
  propTypes: {
    id: PropTypes.string,
    url: PropTypes.string,
    height: PropTypes.string
  },
  getDefaultProps: function getDefaultProps() {
    return {
      id: "pdfobject",
      height: "100%"
    };
  },
  shouldComponentUpdate: function shouldComponentUpdate(nextProps) {
    if (this.props.url !== nextProps.url || this.props.height !== nextProps.height) {
      return true;
    }
    return false;
  },
  componentDidMount: function componentDidMount() {
    this.embedPdf(this.props);
  },
  componentDidUpdate: function componentDidUpdate() {
    this.embedPdf(this.props);
  },
  componentWillUnmount: function componentWillUnmount() {
    $("#" + this.props.id + "embed").remove();
  },
  embedPdf: function embedPdf(props) {
    const {id, url, height} = props;
    if (!R.isNil(url) && url !== "") {
      $("#" + id).append($('<div/>').attr("id", id + "embed"));
      PDFObject.embed(url, "#" + id + "embed", {"height": height});
    } else {
      $("#" + this.props.id + "embed").remove();
    }
  },
  render: function render() {
    return (
      <div id={this.props.id}></div>
    );
  }
});
