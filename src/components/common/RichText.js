import React, {useState} from "react";
import {observer} from "mobx-react";
import {EditField} from "Components/common/Inputs";
import {Editor} from "react-draft-wysiwyg";
import {EditorState, ContentState, convertFromHTML, convertToRaw} from "draft-js";
import draftToHtml from "draftjs-to-html";

const DraftEditor = observer(props => {

  const blocksFromHTML = convertFromHTML(props.value);
  const [updateTimeout, setUpdateTimeout] = useState(undefined);
  const [editorState, setEditorState] = useState(
    EditorState.createWithContent(
      ContentState.createFromBlockArray(blocksFromHTML.contentBlocks, blocksFromHTML.entityMap)
    )
  );

  return (
    <Editor
      editorClassName="rich-text__editor"
      editorState={editorState}
      onEditorStateChange={newState => {
        clearTimeout(updateTimeout);

        setEditorState(newState);

        // Debounce actual update
        setUpdateTimeout(
          setTimeout(() =>
            props.onChange(draftToHtml(convertToRaw(newState.getCurrentContent()))),
          500
          )
        );
      }}
    />
  );
});

const RichText = props => {
  const [show, setShow] = useState(false);

  return (
    <EditField
      {...props}
      Render={formattedProps => {
        return (
          <div className="rich-text">
            { show ? <DraftEditor {...formattedProps} /> : null }
            <button className="action action-secondary rich-text__toggle" onClick={() => setShow(!show)}>
              { show ? "Hide Editor" : "Show Editor" }
            </button>
          </div>
        );
      }}
    />
  );
};

export default RichText;
