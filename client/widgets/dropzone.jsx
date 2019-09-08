"use strict";
import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from 'ramda';
import Immutable from 'immutable';
import classnames from 'classnames';
import Button from '../forms/button.jsx';
import DataTable from '../dataTable/dataTable.jsx';
import {createSyntheticEvent} from '../utils/domDriverUtils';
import {setWindowLocationHash, getWindowLocationHash} from '../libraries/router';
import {win, $, testMode} from '../globals';
import {toFilename, getDownloadUrl, getFileRecordId} from "../utils/fileHelpers";
import ErrorMessage from '../forms/errorMessage.jsx';
//import ReactDOMServer from 'react-dom/server';
import DropzoneJS from 'dropzone';
import CropperJS from './cropperjs.jsx';
import {eventHandler, getEventHandler} from '../utils/viewUtils';
import {cleanFileName} from '../utils/fileHelpers';


DropzoneJS.autoDiscover = false;




module.exports = createReactClass({
  displayName: "Dropzone",
  dropZone: null,
  upload: false,
  uploading: false,
  propTypes: {
    id: PropTypes.string.isRequired,
    uploadUrl: PropTypes.string.isRequired,
    currentUrl: PropTypes.string,
    currentFilename: PropTypes.string,
    type: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    titleSingular: PropTypes.string,
    acceptedFiles: PropTypes.string,
    maxFilesize: PropTypes.number,
    filesizeBase: PropTypes.number,
    maxFiles: PropTypes.number,
    maxThumbnailFilesize: PropTypes.number,
    thumbnailWidth: PropTypes.number,
    thumbnailHeight: PropTypes.number,
    uploadMultiple: PropTypes.bool,
    addRemoveLinks: PropTypes.bool,
    previewsContainer: PropTypes.object,
    showFiles: PropTypes.bool,
    onContainerPropChange: PropTypes.func,
    onContainerRefresh: PropTypes.func,
    removeFile: PropTypes.func,
    prefix: PropTypes.string,
    accountIdField: PropTypes.string,
    accountId: PropTypes.number,
    store: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
    authenticationUIProps: PropTypes.object.isRequired,
    getSessionTokens: PropTypes.func.isRequired,
    field: PropTypes.object,
    disabled: PropTypes.bool,
    cropperAspectRatio: PropTypes.string,
    cropperPreviewClassName: PropTypes.string,
    classNameAddFile: PropTypes.string,
    dictDefaultMessage: PropTypes.string,
  },
  getDefaultProps: function getDefaultProps() {
    return {
      type: "list",
      currentFilename: null,
      maxFilesize: 21,
      filesizeBase: 1000,
      maxFiles: 1,
      maxThumbnailFilesize: 10,
      acceptedFiles: ".txt",
      thumbnailWidth: null,
      thumbnailHeight: 256,
      uploadMultiple: false,
      addRemoveLinks: false,
      previewsContainer: null,
      showFiles: true,
      prefix: "",
      disabled: false,
      cropperAspectRatio: "1by1",
      cropperPreviewClassName: "img-thumbnail",
      classNameAddFile: "btn-primary btn-block",
      dictDefaultMessage: "Drop files here to upload"
    };
  },
  getInitialState: function getInitialState() {
    return {
      sessionTokensUpdating: false,
      dropzoneRecords: [],
      numberOfFiles: 0,
      thumbnailDataUrl: null,
      previewDataUrl: null
    };
  },
  "componentDidMount": function componentDidMount() {
    const props = this.props;
    const propId = props.id;
    const {
      store, actions, prefix, partnerAccount, uploadUrl, maxFilesize, filesizeBase, maxFiles, maxThumbnailFilesize,
      acceptedFiles, thumbnailWidth, thumbnailHeight, uploadMultiple, addRemoveLinks, previewsContainer,
      onContainerRefresh, dictDefaultMessage
    } = props;
    /*
     * Initialise dropzone and attach event handlers
     */
    this.dropZone = new DropzoneJS("div#" + propId, {
      "url": uploadUrl,
      "maxFilesize": maxFilesize,
      "filesizeBase": filesizeBase,
      "maxFiles": maxFiles,
      "maxThumbnailFilesize": maxThumbnailFilesize,
      "acceptedFiles": acceptedFiles,
      "thumbnailWidth": thumbnailWidth,
      "thumbnailHeight": thumbnailHeight,
      "uploadMultiple": uploadMultiple,
      "addRemoveLinks": addRemoveLinks,
      "autoProcessQueue": false, //need to handle getting CSRF token first
      "clickable": "#clickable" + propId,
      "previewsContainer": previewsContainer,
      "dictDefaultMessage": dictDefaultMessage,
      dictInvalidFileType: props.type === "image"
        ? "You can only upload files of type " + acceptedFiles
        : "You can't upload files of this type.",
      dictFileTooBig: "The file is too big ({{filesize}}MiB). The maximum allowed filesize is {{maxFilesize}}MiB.",
      //
      // EVENTS
      addedfile: () => {
        //file.previewElement = Dropzone.createElement(this.options.previewTemplate);
        // Now attach this new element some where in your page
      },
      thumbnail: (file, dataUrl) => {
        if (props.type === "image" && !(file.size > maxFilesize * 1024 * 1024) && !file.addedByUpload === true) {
          file.removedByThumbnail = true;
          this.dropZone.removeFile(file);
          this.setState(function setState() {
            return {
              "thumbnailDataUrl": dataUrl,
              "previewDataUrl": null
            };
          });
        }
      },
      "uploadprogress": (file, progress) => {
        this.setState(function setState(previousState) {
          let dropzoneRecords = previousState.dropzoneRecords;
          const foundFileIdx = R.findIndex(R.propEq("name", file.name), dropzoneRecords);
          if (foundFileIdx > -1) {
            dropzoneRecords = R.update(foundFileIdx, {
              "src": dropzoneRecords[foundFileIdx].src,
              "name": dropzoneRecords[foundFileIdx].name,
              "size": dropzoneRecords[foundFileIdx].size,
              "progress": progress,
              "temp": true
            }, dropzoneRecords);
          }
          return {
            "dropzoneRecords": dropzoneRecords
          };
        });
      },
      //"previewTemplate": ReactDOMServer.renderToStaticMarkup(<div className="dz-preview dz-file-preview"></div>),
      "previewTemplate": null
    });
    this.dropZone.on("addedfile", (file) => {
      if (props.type !== "image" || file.addedByUpload === true) {
        //@todo remove once server uses prefix to distinguish partner account id
        // hack to ensure partner account filenames are always unique in context of PermitApplication fileList when
        //attachments uploaded on consents
        if (!R.isNil(uploadUrl) && uploadUrl.indexOf("PermitApplications") > -1
          && !R.isNil(partnerAccount) && !R.isNil(partnerAccount.RMID) && prefix === "partner") {
          file.updatedName = '(' + partnerAccount.RMID + ')_' + file.name;
        }
        this.addFile(file);
      }
    });
    this.dropZone.on("removedfile", (file) => {
      if (file.removedByThumbnail !== true) {
        this.setState(function setState(previousState) {
          return {
            "dropzoneRecords": R.init(previousState.dropzoneRecords),
            "numberOfFiles": previousState.numberOfFiles - 1,
            "thumbnailDataUrl": null,
            "previewDataUrl": null
          };
        });
      }
    });
    this.dropZone.on("reset", () => {
      this.setState(function setState() {
        return {
          "dropzoneRecords": [],
          "numberOfFiles": 0,
          "thumbnailDataUrl": null,
          "previewDataUrl": null
        };
      });
    });
    this.dropZone.on("sending", (file, xhr) => {
      const authenticationUIProps = this.props.authenticationUIProps;
      this.uploading = true;
      //x-filename header used as override of actual filename. Enabled cleaning filename before send.
      xhr.setRequestHeader("x-filename", cleanFileName(file.updatedName || file.name));
      xhr.setRequestHeader("x-filesize", file.size);
      xhr.setRequestHeader("x-csrf-token", authenticationUIProps.getIn(['sessionTokens', 'csrf']));
      xhr.setRequestHeader("X-Session-Token", authenticationUIProps.getIn(['sessionTokens', 'X-Session-Token']));
      xhr.setRequestHeader("X-Access-Token", authenticationUIProps.getIn(['access_token', 'id']));
    });
    this.dropZone.on("success", (file, serverResponse) => {
      eventHandler(actions, store, 'onMessage', createSyntheticEvent("success", "Successfully uploaded file"));
      if (this.props.type === "image" && !R.isNil(serverResponse)) {
        eventHandler(actions, store, 'onChange', createSyntheticEvent("fileList", serverResponse, null, "Array"));
      } else if (onContainerRefresh) {
        onContainerRefresh(createSyntheticEvent("collection", ""));
      } else {
        eventHandler(actions, store, 'onContainerRefresh', createSyntheticEvent("collection", ""));
      }
    });
    this.dropZone.on("error", (file, message) => {
      let errorMessage = "Failed to upload file";
      if (!R.isNil(message) && message.error && message.error.message) {
        errorMessage = "Failed to upload file: " + message.error.message;
      } else if (!R.isNil(message) && message.error) {
        errorMessage = "Failed to upload file: " + message.error;
      } else if (R.is(String, message)) {
        errorMessage = message;
      }
      eventHandler(actions, store, 'onMessage', createSyntheticEvent("error", errorMessage));
    });
    this.dropZone.on("complete", () => {
      this.uploading = false;
      this.upload = false;
      this.dropZone.removeAllFiles(true);
    });

    if (testMode) {
      if (win.dropZoneTest) {
        win.dropZoneTest.push({"name": this.props.id, "dropZone": this.dropZone});
      } else {
        win.dropZoneTest = [{"name": this.props.id, "dropZone": this.dropZone}];
      }
    }

    $("html").on('drop.' + propId + ' dragover.' + propId + ' dragenter.' + propId, function dropEventHandler(event) {
      if (event.target.id !== propId) {
        event.preventDefault();
      }
    });

    this.checkDisabled();

    $('[data-toggle="tooltip"]').tooltip();
    $('[data-toggle-tooltip="tooltip"]').tooltip();
  },
  componentDidUpdate: function componentDidUpdate(prevProps) {
    if (!this.state.sessionTokensUpdating && this.upload && !this.uploading) {
      this.dropZone.processQueue();
    }

    if (prevProps.disabled !== this.props.disabled) {
      this.checkDisabled();
    }

    //update global widgets
    $('[data-toggle="tooltip"]').tooltip('dispose');
    $('[data-toggle-tooltip="tooltip"]').tooltip('dispose');
    $('.bs-tether-enabled').remove();
    $('.tooltip.fade.in').remove();
    $('[data-toggle="tooltip"]').tooltip();
    $('[data-toggle-tooltip="tooltip"]').tooltip();
  },
  componentWillUnmount: function componentWillUnmount() {
    const propId = this.props.id;
    if (testMode) {
      win.dropZoneTest = null;
      delete win.dropZoneTest;
    }
    this.dropZone.destroy();
    $("html").off('drop.' + propId);
    $("html").off('dragover.' + propId);
    $("html").off('dragenter.' + propId);
  },
  UNSAFE_componentWillReceiveProps: function componentWillReceiveProps(nextProps) {
    const props = this.props;
    const records = R.isNil(props.field)
      ? R.defaultTo([], props.store.getIn(['container', 'records']))
      : props.field.get('value');
    const nextRecords = R.isNil(nextProps.field)
      ? R.defaultTo([], nextProps.store.getIn(['container', 'records']))
      : nextProps.field.get('value');
    const csrf = props.authenticationUIProps.getIn(['sessionTokens', 'csrf']);
    const nextCsrf = nextProps.authenticationUIProps.getIn(['sessionTokens', 'csrf']);
    if (this.state.sessionTokensUpdating && csrf !== nextCsrf) {
      this.setState(function setState() {
        return {
          "sessionTokensUpdating": false
        };
      });
    } else if (R.defaultTo([], records).length !== R.defaultTo([], nextRecords).length) {
      this.dropZone.removeAllFiles(true);
    }
  },
  checkDisabled: function checkDisabled() {
    let message;
    if (this.props.disabled) {
      message = "File upload disabled";
      this.dropZone.disable();
    } else {
      message = this.props.dictDefaultMessage;
      this.dropZone.enable();
    }
    $(this.dropZone.element).find('.dz-message span').text(message);
  },
  /*
   * Before uploading first get an updated session token including new CSRF token.
   */
  addFile: function addFile(file) {
    this.setState(function setState(previousState) {
      return {
        "dropzoneRecords": R.concat(previousState.dropzoneRecords, [{
          "name": cleanFileName(file.updatedName || file.name),
          "size": file.size,
          "progress": 0,
          "temp": true
        }]),
        "numberOfFiles": previousState.numberOfFiles + 1,
        "sessionTokensUpdating": true
      };
    });
    this.upload = true;
    this.props.getSessionTokens(createSyntheticEvent("upload", "upload"));
  },

  render: function _render() {
    const props = this.props;
    const {id, type, showFiles} = props;
    if (type === "buttonOnly") {
      return (
        <div>
          <div id={id} className="row dropzone dropzone-compact">
            <div className="col-xs-12">
              {this.renderAddFileButton("clickable" + id)}
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12">
              {this.renderErrorMessage(props)}
            </div>
          </div>
        </div>
      )
    }
    if (type === "list") {
      return (
        <div>
          <div className="row">
            <div className="col-xs-12 col-sm-12">
              {this.renderErrorMessage(props)}
            </div>
          </div>
          <div id={id} className="row dropzone dropzone-previews">
            <div className="col-xs-12 col-sm-9">
              {showFiles ? this.renderTable() : null}
            </div>
            <div className="col-xs-12 col-sm-3">
              {this.renderAddFileButton("clickable" + id)}
              <div className=""/>
            </div>
          </div>
        </div>
      );
    }
    if (type === "image") {
      const aspectRatioDivider = this.props.cropperAspectRatio === "1by1" ? 1 : 3
      return (
        <div>
          <div className="row">
            <div id={id + "preview"} className="col-xs-12 col-sm-4 col-md-3">
              {R.isNil(this.state.previewDataUrl)
                ?
                <div className="center-block text-center">
                  <div className="margin-bottom-10">
                    <strong className="text-primary">Current picture</strong>
                  </div>
                  <img className={this.props.cropperPreviewClassName}
                       src={this.props.currentUrl}
                       style={{height: 210 / aspectRatioDivider, width: 210, maxWidth: "100%"}}/>
                </div>
                :
                <div className="center-block text-center">
                  <div className="margin-bottom-10">
                    <strong className="text-primary">Preview</strong>
                  </div>
                  <img className={this.props.cropperPreviewClassName}
                       src={this.state.previewDataUrl}
                       style={{height: 210 / aspectRatioDivider, maxWidth: "100%"}}/>
                </div>
              }

              <div className="margin-top-10">
                <div className={classnames({"hidden": !R.isNil(this.state.thumbnailDataUrl)})}>
                  {this.renderAddFileButton("clickable" + id)}
                  {this.renderRemoveFileButton()}
                </div>
                {R.isNil(this.state.thumbnailDataUrl)
                  ? null
                  : this.renderUploadButton()}
                {R.isNil(this.state.thumbnailDataUrl)
                  ? null
                  : this.renderResetImageButton()}
              </div>
            </div>
            <div className="col-xs-12 col-sm-8 col-md-9">
              <div id={id} className="dropzone" style={{padding: 0}}>
                {R.isNil(this.state.thumbnailDataUrl)
                  ?
                  <div className="dz-message" style={{height: 300, width: '100%', margin: 0}}>
                    <strong className="text-primary">Drop new picture file here</strong>
                  </div>
                  :
                  <div className="">
                    <div className="margin-bottom-10">
                      <strong className="text-primary">Crop picture</strong>
                    </div>
                    <CropperJS
                      ref={node => this.cropper = node}
                      src={this.state.thumbnailDataUrl}
                      style={{height: 256, width: '100%'}}
                      aspectRatio={aspectRatioDivider}
                      viewMode={0}
                      scalable={true}
                      zoomable={true}
                      minContainerHeight={256}
                      minCropBoxHeight={32}
                      crop={() => {
                        const croppedCanvas = R.isNil(this.cropper) ? null : this.cropper.getCroppedCanvas();
                        if (!R.isNil(croppedCanvas)) {
                          this.setState(function setState() {
                            return {
                              "previewDataUrl": croppedCanvas.toDataURL()
                            };
                          });
                        }
                      }}
                    />
                    {this.renderCropperToolbar()}
                  </div>
                }
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-12 col-sm-12">
              {this.renderErrorMessage(props)}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div>
        <div className="row">
          <div className="col-xs-12 col-sm-12">
            {this.renderAddFileButton("clickable" + id)}
            {this.renderRemoveFileButton()}
          </div>
          <div id={id} className="dropzone"/>
        </div>
        <div className="row">
          <div className="col-xs-12 col-sm-12">
            {this.renderErrorMessage(props)}
          </div>
        </div>
      </div>
    );
  },
  "renderCropperToolbar": function renderCropperToolbar() {
    return (
      <div className="btn-toolbar" role="toolbar">
        <div className="btn-group pull-left" role="group" aria-label="Zoom">
          <Button
            name="MagnifyPlus"
            data-toggle="tooltip"
            title="Zoom in on image"
            label={<span className="glyphicon mdi-magnify-plus"/>}
            onClick={() => {
              this.cropper.zoom(0.1);
            }}
            className="btn-primary btn-flat"
          />
          <Button
            name="MagnifyMinus"
            data-toggle="tooltip"
            title="Zoom out on image"
            label={<span className="glyphicon mdi-magnify-minus"/>}
            onClick={() => {
              this.cropper.zoom(-0.1);
            }}
            className="btn-primary btn-flat"
          />
        </div>
        <div className="btn-group pull-left" role="group" aria-label="Move">
          <Button
            name="MoveLeft"
            data-toggle="tooltip"
            title="Move image left"
            label={<span className="glyphicon mdi-arrow-left-bold"/>}
            onClick={() => {
              this.cropper.move(-2, 0);
            }}
            className="btn-primary btn-flat"
          />
          <Button
            name="MoveRight"
            data-toggle="tooltip"
            title="Move image right"
            label={<span className="glyphicon mdi-arrow-right-bold"/>}
            onClick={() => {
              this.cropper.move(2, 0);
            }}
            className="btn-primary btn-flat"
          />
          <Button
            name="MoveUp"
            data-toggle="tooltip"
            title="Move image up"
            label={<span className="glyphicon mdi-arrow-up-bold"/>}
            onClick={() => {
              this.cropper.move(0, -2);
            }}
            className="btn-primary btn-flat"
          />
          <Button
            name="MoveDown"
            data-toggle="tooltip"
            title="Move image down"
            label={<span className="glyphicon mdi-arrow-down-bold"/>}
            onClick={() => {
              this.cropper.move(0, 2);
            }}
            className="btn-primary btn-flat"
          />
        </div>
        <div className="btn-group pull-left" role="group" aria-label="Rotate">
          <Button
            name="RotateClockwise"
            data-toggle="tooltip"
            title="Rotate image 5 degrees clockwise"
            label={<span className="glyphicon mdi-rotate-right"/>}
            onClick={() => {
              this.cropper.rotate(-5);
            }}
            className="btn-primary btn-flat"
          />
          <Button
            name="RotateAnticlockwise"
            data-toggle="tooltip"
            title="Rotate image 5 degrees anticlockwise"
            label={<span className="glyphicon mdi-rotate-left"/>}
            onClick={() => {
              this.cropper.rotate(5);
            }}
            className="btn-primary btn-flat"
          />
        </div>
      </div>
    );
  },
  "getCombinedRecords": function getCombinedRecords() {
    const {store, authenticationUIProps, prefix, accountIdField, accountId, field} = this.props;
    const records = R.isNil(field)
      ? R.defaultTo([], store.getIn(['container', 'records']))
      : R.defaultTo([], field.get('value'));
    const serverModelName = store.has('serverModel') ? store.getIn(['serverModel', 'name']) : "";
    const accessTokenId = authenticationUIProps.getIn(['access_token', 'id']);
    const modelId = store.getIn(['props', 'id']); //for legacy fileLists without an originalFilename
    const dropzoneRecordFileNames = R.map(R.prop("name"), this.state.dropzoneRecords);
    const filteredRecords = R.pipe(
      R.filter(
        (file) => (R.defaultTo("", file.name).indexOf(prefix) === 0)
      ),
      R.map((file) => {
        const fileModelId = getFileRecordId(prefix, file, modelId);
        let nextFile = R.assoc(
          "name",
          toFilename(prefix, file, fileModelId),
          file
        );
        return R.assoc(
          "containerUrl",
          getDownloadUrl(serverModelName, accessTokenId, fileModelId, prefix, accountIdField, accountId),
          nextFile
        );
      }),
      R.filter(
        (file) => (!R.contains(file.name, dropzoneRecordFileNames))
      )
    )(R.defaultTo([], records));
    if (filteredRecords) {
      return R.concat(filteredRecords, this.state.dropzoneRecords);
    }
    return [];
  },
  "renderErrorMessage": function renderErrorMessage(props) {
    if (R.isNil(props.field)) {
      return null;
    }
    let validationConfig = props.field.getIn(['validation', 'fileList', 'pattern']);
    if (R.isNil(validationConfig)) {
      return null;
    }
    return validationConfig.indexOf(props.prefix) === -1 || this.getCombinedRecords().length > 0 ? null :
      (<ErrorMessage
        field={props.field}
      />);
  },
  "renderAddFileButton": function renderAddFileButton(clickable) {
    const {type, classNameAddFile} = this.props;
    const label = type === "image" ? "New picture..." : "Add file..."
    return (<Button
      id={clickable}
      name="AddFile"
      label={<span><span className="glyphicon mdi-file-find"/>&nbsp;{label}</span>}
      className={classNameAddFile}
      disabled={this.state.numberOfFiles !== 0 || !R.isNil(this.state.thumbnailDataUrl) || this.props.disabled}
    />);
  },
  "renderResetImageButton": function renderResetImageButton() {
    return (<Button
      name="ResetImage"
      label={<span><span className="glyphicon mdi-undo-variant"/>&nbsp;Back to current</span>}
      className="btn-primary btn-block"
      onClick={() => {
        this.dropZone.removeAllFiles(true);
        this.setState(function setState() {
          return {
            "dropzoneRecords": [],
            "numberOfFiles": 0,
            "thumbnailDataUrl": null,
            "previewDataUrl": null
          };
        });
      }}
    />);
  },
  "renderRemoveFileButton": function renderRemoveFileButton() {
    const {store, type, actions, currentFilename, removeFile, field} = this.props;
    const label = type === "image" ? "Remove picture" : "Remove file"
    return (<Button
      name="RemoveFile"
      label={<span><span className="glyphicon mdi-folder-remove"/>&nbsp;{label}</span>}
      className="btn-primary btn-block"
      onClick={() => {
        if (removeFile) {
          removeFile(createSyntheticEvent("removeFile", currentFilename));
        } else if (type !== "image") {
          eventHandler(
            actions, store, 'removeFile', createSyntheticEvent("removeFile", currentFilename)
          );
        } else if (type === "image" && field && field.get('value')) {
          const fileList = field.get('value');
          if (R.is(Array, fileList) && fileList.length > 0) {
            eventHandler(
              actions, store, 'removeFile', createSyntheticEvent("removeFile", fileList[0].name)
            );
          }
        }
      }}
      disabled={this.getCombinedRecords().length === 0 || !R.isNil(this.state.thumbnailDataUrl) || this.props.disabled}
    />);
  },
  "renderUploadButton": function renderUploadButton() {
    return (<Button
      name="Upload"
      label={<span><span className="glyphicon mdi-upload"/>&nbsp;Upload</span>}
      onClick={() => {
        this.uploadIfPreviewExists();
      }}
      className="btn-success btn-block"
      disabled={this.props.disabled}
    />);
  },
  "uploadIfPreviewExists": function uploadIfPreviewExists() {
    const croppedFile = getCroppedFile(this.cropper);
    if (!R.isNil(croppedFile)) {
      croppedFile.addedByUpload = true;
      this.dropZone.addFile(croppedFile);
    }
  },
  "renderTable": function renderTable() {
    const {
      title, titleSingular, store, actions, onContainerPropChange,
      onContainerRefresh, removeFile, prefix, field
    } = this.props;
    const selectAction = (event, row) => {
      setWindowLocationHash(R.assoc("prefix", prefix, R.assoc("fileId", cleanFileName(row.name), {})));
    };
    const deleteAction = () => {
      if (removeFile) {
        removeFile(createSyntheticEvent("removeFile", getWindowLocationHash().fileId));
      } else {
        eventHandler(actions, store, 'removeFile', createSyntheticEvent("removeFile", getWindowLocationHash().fileId));
      }
    };
    const tableModel = [
      {
        "validation": {"type": "fileThumbnail"},
        "label": "",
        "description": "File thumbnail",
        "column": "fileThumbnail",
        "sortable": false,
        "imageCaption": false,
        "className": "no-linebreak",
        "classNameColumn": "hidden-xs tbl-sm-7-5p"
      },
      {
        "validation": {"type": "fileName"},
        "label": "File name",
        "description": "The file name",
        "column": "name",
        "sortable": false,
        "imageCaption": false,
        "className": "no-linebreak",
        "classNameColumn": "tbl-xs-45p"
      },
      {
        "validation": {"type": "fileSize"},
        "label": "File size",
        "description": "The file size",
        "column": "size",
        "sortable": false,
        "imageCaption": false,
        "className": "no-linebreak",
        "classNameColumn": "tbl-xs-15p tbl-sm-20p"
      },
      {
        "label": "",
        "description": "Upload progress bar",
        "column": "progress",
        "sortable": false,
        "imageCaption": false,
        "className": "no-linebreak",
        "classNameColumn": "hidden-xs tbl-xs-20p"
      },
      {
        "props": {
          "idFieldName": "name",
          "disabled": R.isNil(field) ? false : field.get('disabled')
        },
        "classNameColumn": "tbl-xs-7-5p",
        "column": "fileActionButtonCell",
        "sortable": false,
        "actions": {
          "delete": deleteAction,
          "select": selectAction
        }
      }
    ];
    let collection = Immutable.fromJS({"displayMode": "table"});
    collection = collection.set('records', this.getCombinedRecords());
    return (<DataTable
      title={title}
      titleSingular={titleSingular}
      tableModel={tableModel}
      collection={collection}
      showToolbar={false}
      onCollectionRefresh={onContainerRefresh || getEventHandler(actions, store, 'onContainerRefresh')}
      onCollectionPropChange={onContainerPropChange || getEventHandler(actions, store, 'onContainerPropChange')}
    />);
  }
});

function getCroppedFile(cropper) {
  // get cropped image data
  const dataURL = getCroppedDataUrl(cropper);
  if (R.isNil(dataURL)) {
    return null;
  }
  // transform it to Blob object
  const newFile = dataURItoBlob(dataURL);
  // assign original filename
  newFile.name = "file.png";
  return newFile;
}

function getCroppedDataUrl(cropper) {
  const croppedCanvas = R.isNil(cropper) ? null : cropper.getCroppedCanvas();
  if (!R.isNil(croppedCanvas)) {
    return croppedCanvas.toDataURL();
  }
  return null;
}

// transform cropper dataURI output to a Blob which Dropzone accepts
function dataURItoBlob(dataURI) {
  const byteString = atob(dataURI.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], {type: 'image/png'});
}
