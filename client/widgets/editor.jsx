import React from 'react';
import R from 'ramda';
import Label from '../forms/label.jsx';
import ErrorMessage from '../forms/errorMessage.jsx';
import CharacterCounter from '../forms/characterCounter.jsx';
import EditorSummernote from './editor-summernote.jsx';


function Editor(props) {
  const {field, ...otherProps} = props;
  const mergedProps = R.merge(props.field.toJS(), otherProps);
  return (
    <div>
      <Label field={field}/>
      <EditorSummernote {...mergedProps}/>
      <CharacterCounter field={field}/><ErrorMessage field={field}/>
    </div>
  );
}

Editor.displayName = "Editor";
Editor.defaultProps = {
  options: {
    height: 100,
    dialogsInBody: false,
    focus: false,
    maximumImageFileSize: 1000000,
    toolbar: [
      ['font', ['underline', 'superscript', 'subscript']],
      ['para', ['ul', 'ol']],
      ['view', ['fullscreen']]
    ]
  }
}

module.exports = Editor;

