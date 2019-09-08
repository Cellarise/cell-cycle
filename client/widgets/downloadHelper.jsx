"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from 'ramda';
import Papa from 'papaparse';
import {saveAs} from '../../vendor/filesaver/FileSaver';

var DownloadHelper = createReactClass({
  propTypes: {
    fileContent: PropTypes.any,
    fileName: PropTypes.string,
    fileMime: PropTypes.string,
    autoDownload: PropTypes.bool,
    counter: PropTypes.number,
    parser: PropTypes.string,
    onDownloaded: PropTypes.func
  },

  getDefaultProps: function getDefaults() {
    return {
      autoDownload: false,
      parser: "",
      counter: 0
    };
  },

  getInitialState: function getInit() {
    return {
      downloaded: false
    };
  },

  downloadFile: function downloadFile(props) {
    let fileContent = props.fileContent;
    if (!fileContent) {
      return false;
    }
    if (props.parser == "jsonTocsv") {
      try {
        //parse all row cells into string representation
        fileContent = R.map(
          (record) => {
            return R.mapObjIndexed(
              (cell) => {
                if (R.is(Object, cell)) {
                  return JSON.stringify(cell);
                }
                return cell;
              },
              record
            );
          },
          fileContent
        );
        //parse into csv
        fileContent = Papa.unparse(fileContent);
      } catch (err) {
        fileContent = props.fileContent;
      }
    }
    let blob = new Blob([fileContent], {type: props.fileMime});
    saveAs(blob, props.fileName);

    if (!R.isNil(props.onDownloaded)) {
      props.onDownloaded();
    }

    this.setState({downloaded: true});
  },

  UNSAFE_componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    if (nextProps.counter > this.props.counter) {
      //counter based trigger
      this.downloadFile(nextProps);
    } else if (R.isNil(nextProps.fileContent)) {
      this.setState({downloaded: false});
    } else if (nextProps.autoDownload && !this.state.downloaded) {
      //If auto download is set to true, then automatically trigger the download
      // (but only once in case of subsequent refresh of this component)
      this.downloadFile(nextProps);
    }
  },

  render: function render() {
    return false;
  }
});

module.exports = DownloadHelper;
