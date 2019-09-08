import React from 'react';
import PropTypes from 'prop-types';
import createReactClass from 'create-react-class';
import R from 'ramda';
import {$} from '../globals';
import 'summernote/dist/summernote';
import 'summernote/dist/summernote.css';
import {eventHandler, fieldDisabled} from '../utils/viewUtils';
import {createSyntheticEvent} from '../utils/domDriverUtils';


module.exports = createReactClass({
  propTypes: {
    id: PropTypes.string,
    disabled: PropTypes.bool,
    modalBased: PropTypes.bool,
    actions: PropTypes.object,
    options: PropTypes.object,
    onInit: PropTypes.func,
    onEnter: PropTypes.func,
    onFocus: PropTypes.func,
    onBlur: PropTypes.func,
    onKeyUp: PropTypes.func,
    onKeyDown: PropTypes.func,
    onPaste: PropTypes.func,
    onChange: PropTypes.func,
    onImageUpload: PropTypes.func
  },
  getDefaultProps: function getDefaultProps() {
    return {
      id: "default",
      disabled: false,
      modalBased: true
    };
  },
  componentDidMount: function componentDidMount() {
    const props = this.props;
    const callbacks = {
      onInit: props.onInit,
      onEnter: props.onEnter,
      onFocus: props.onFocus,
      onBlur: props.onBlur,
      onKeyup: props.onKeyUp,
      onKeydown: props.onKeyDown,
      onPaste: props.onPaste,
      onChange: props.onChange,
      onImageUpload: props.onImageUpload
    };
    const options = props.options || {};
    if (R.isNil(props.onBlur) && !R.isNil(props.actions)) {
      callbacks.onBlur = () => {
        eventHandler(
          props.actions,
          props.storeId,
          'onBlur',
          createSyntheticEvent(props.name)
        );
      };
    }
    if (R.isNil(props.onChange) && !R.isNil(props.actions)) {
      callbacks.onChange = (content) => {
        if (content === "") {
          eventHandler(
            props.actions,
            props.storeId,
            'onChange',
            createSyntheticEvent(props.name, null)
          );
        } else {
          eventHandler(
            props.actions,
            props.storeId,
            'onChange',
            createSyntheticEvent(props.name, content)
          );
        }
      };
    }
    options.callbacks = callbacks;
    $('#editor-' + props.id).html(props.value);
    $('#editor-' + props.id).summernote(options);
    if (fieldDisabled(props)) {
      $('#editor-' + props.id).summernote('disable');
    }
    if (props.modalBased) {
      //summernote always needs bootstrap modal
      if (!$().modal) {
        require('../../vendor/bootstrap@v4-dev/js/umd/modal');
      }
      this.manageModalScroll(true);
    }
  },
  shouldComponentUpdate: function shouldComponentUpdate(nextProps) {
    //only update if the id changes
    const props = this.props;
    return (
      props.id !== nextProps.id ||
      fieldDisabled(props) !== fieldDisabled(nextProps)
    );
  },
  UNSAFE_componentWillUpdate: function componentWillUpdate(nextProps) {
    //if updating then destroy summernote
    const props = this.props;
    if (props.id !== nextProps.id) {
      if (props.modalBased) {
        this.manageModalScroll(false);
      }
      $('#editor-' + props.id).summernote('destroy');
      $('#editor-' + props.id).empty();
    }
  },
  componentDidUpdate: function componentDidUpdate(prevProps) {
    //upon re-rendering new html then reinstantiate summernote
    const props = this.props;
    const currentDisabled = fieldDisabled(props);
    const prevDisabled = fieldDisabled(prevProps);
    if (props.id !== prevProps.id) {
      const callbacks = {
        onInit: props.onInit,
        onEnter: props.onEnter,
        onFocus: props.onFocus,
        onBlur: props.onBlur,
        onKeyup: props.onKeyUp,
        onKeydown: props.onKeyDown,
        onPaste: props.onPaste,
        onChange: props.onChange,
        onImageUpload: props.onImageUpload
      };
      const options = props.options || {};
      if (R.isNil(props.onBlur) && !R.isNil(props.actions)) {
        callbacks.onBlur = () => {
          eventHandler(
            props.actions,
            props.storeId,
            'onBlur',
            createSyntheticEvent(props.name)
          );
        };
      }
      if (R.isNil(props.onChange) && !R.isNil(props.actions)) {
        callbacks.onChange = (content) => {
          if (content === "") {
            eventHandler(
              props.actions,
              props.storeId,
              'onChange',
              createSyntheticEvent(props.name, null)
            );
          } else {
            eventHandler(
              props.actions,
              props.storeId,
              'onChange',
              createSyntheticEvent(props.name, content)
            );
          }
        };
      }
      options.callbacks = callbacks;
      $('#editor-' + props.id).html(props.value);
      $('#editor-' + props.id).summernote(options);
      if (currentDisabled) {
        $('#editor-' + props.id).summernote('disable');
      }
      if (props.modalBased) {
        this.manageModalScroll(true);
      }
    }
    if (currentDisabled !== prevDisabled) {
      if (currentDisabled) {
        $('#editor-' + props.id).summernote('disable');
      } else {
        $('#editor-' + props.id).summernote('enable');
      }
    }
  },
  componentWillUnmount: function componentWillUnmount() {
    const props = this.props;
    // Destroy the calendar, this makes sure events such as resize are cleaned up and do not leak
    if (props.modalBased) {
      this.manageModalScroll(false);
    }
    $('#editor-' + props.id).summernote('destroy');
    $('#editor-' + props.id).empty();
  },
  manageModalScroll: function manageModalScroll(mount) {
    const $body = $('body');
    let hasClassName = false;
    if (mount) {
      $('.note-editor .modal').on('show.bs.modal', () => {
        hasClassName = $body.hasClass('modal-open');
      });
      $('.note-editor .modal').on('hidden.bs.modal', () => {
        $body.toggleClass('modal-open', hasClassName);
      });
    } else {
      $('.note-editor .modal').off('show.bs.modal');
      $('.note-editor .modal').off('hidden.bs.modal');
    }
  },
  render: function render() {
    const props = this.props;
    /* eslint-disable react/no-danger */
    return (
      <div id={"editor-" + props.id}></div>
    );
  }
});
