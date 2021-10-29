import React, {useEffect, useState} from "react";
import {observer} from "mobx-preact";
import {contentStore, editStore} from "Stores";
import ImageIcon, {IconButton} from "Components/common/ImageIcon";

import {SafeTraverse} from "Utils/Misc";
import ToolTip from "Components/common/ToolTip";
import {FileBrowserModal} from "Components/common/FileBrowser";
import {ImageExtensions} from "Utils/Files";
import UrlJoin from "url-join";
import ImagePreview from "Components/common/ImagePreview";
import {ContentBrowserModal} from "Components/common/ContentBrowser";
import Utils from "@eluvio/elv-client-js/src/Utils";

import Hints from "Assets/documentation/InputHints.yaml";

import HintIcon from "Assets/icons/help-square.svg";
import FileIcon from "Assets/icons/file.svg";
import DirectoryIcon from "Assets/icons/directory.svg";
import PictureIcon from "Assets/icons/image.svg";
import AddIcon from "Assets/icons/plus.svg";
import RemoveIcon from "Assets/icons/x.svg";
import PlayIcon from "Assets/icons/play-circle.svg";
import EluvioPlayer, {EluvioPlayerParameters} from "@eluvio/elv-player-js";


export const LabelledField = observer(({name, label, hint, children, className=""}) => {
  if(hint) {
    hint = SafeTraverse(Hints, hint);
  }

  return (
    <div className={`labelled-field ${className}`}>
      <label htmlFor={name}>
        <div className="labelled-field__label-text">
          { label }
        </div>
        {
          hint ?
            <ToolTip className="hint" content={<pre className="labelled-field__hint-content">{ hint }</pre>}>
              <ImageIcon
                alt={hint}
                icon={HintIcon}
                className="labelled-field__hint"
              />
            </ToolTip> : null
        }
      </label>
      { children }
    </div>
  );
});

const UpdateValue = (props, eventOrValue) => {
  const path = typeof props.path === "undefined" ? "info" : props.path;

  let value = eventOrValue;
  if(eventOrValue && eventOrValue.target) {
    switch(eventOrValue.target.type) {
      case "checkbox":
        value = eventOrValue.target.checked;
        break;
      default:
        value = eventOrValue.target.value;
    }
  }

  editStore.SetValue(props.objectId, path, props.name, value, {localize: props.localize});
};

const FilterProps = props => {
  let filteredProps = { ...props };

  delete filteredProps.objectId;
  delete filteredProps.path;
  delete filteredProps.localize;
  delete filteredProps.hint;

  return filteredProps;
};

export const EditField = observer((props) => {
  const path = typeof props.path === "undefined" ? "info" : props.path;
  const value = editStore.Value(props.objectId, path, props.name, {localize: props.localize});

  if(props.dependsOn) {
    const dependantValue = editStore.Value(props.objectId, props.dependsOn, "", {localize: props.localize});

    if(!dependantValue) {
      return null;
    }
  }

  const field = (
    React.cloneElement(
      props.children,
      FilterProps({
        ...props,
        id: props.name,
        key: `${props.key || "edit-field"}-${editStore.currentLocalization}`,
        children: undefined,
        value,
        checked: props.type === "checkbox" ? value : undefined,
        onChange: eventOrValue => UpdateValue(props, eventOrValue)
      })
    )
  );

  if(!props.label) {
    return field;
  }

  return (
    <LabelledField name={props.name} label={props.label} hint={props.hint} className={props.className ? `${props.className}__labelled-field` : ""} >
      { field }
    </LabelledField>
  );
});

export const EditProps = observer(props => {
  const path = typeof props.path === "undefined" ? "info" : props.path;
  const value = editStore.Value(props.objectId, path, props.name, {localize: props.localize});

  const field = (
    props.Render(
      FilterProps({
        ...props,
        id: props.name,
        key: `${props.key || "edit-field"}-${editStore.currentLocalization}`,
        value: editStore.Value(props.objectId, path, props.name, {localize: props.localize}),
        checked: props.type === "checkbox" ? value : undefined,
        onChange: eventOrValue => UpdateValue(props, eventOrValue)
      })
    )
  );

  if(!props.label) {
    return field;
  }

  return (
    <LabelledField name={props.name} label={props.label} hint={props.hint} className={props.className ? `${props.className}__labelled-field` : ""}>
      { field }
    </LabelledField>
  );
});

export const Input = (props) => {
  return (
    <EditField {...props}>
      <input />
    </EditField>
  );
};

export const TextArea = (props) => {
  return (
    <EditField {...props}>
      <textarea />
    </EditField>
  );
};

export const Select = (props) => {
  return (
    <EditProps
      {...props}
      Render={newProps => (
        <select {...newProps}>
          { props.children }
        </select>
      )}
    />
  );
};


const MultiSelectComponent = ({name, values, buttonLabel, onChange, options, className=""}) => {
  values = values || [];

  const Update = (index, event) => {
    let newValues = [...values];
    newValues[index] = event.target.value;

    onChange(newValues);
  };

  const Add = () => {
    let newValues = [...values];
    const next = options.find(option =>
      Array.isArray(option) ?
        !newValues.includes(option[1]) :
        !newValues.includes(option)
    ) || (Array.isArray(options[0]) ? (options[0] || [])[1] : options[0]) || "";

    newValues.push(Array.isArray(next) ? next[1] : next);

    onChange(newValues);
  };

  const Remove = (index) => {
    let newValues = [...values];

    newValues =
      newValues.filter((_, i) => i !== index);

    onChange(newValues);
  };

  return (
    <div className={`multiselect ${className}`}>
      {(values || []).map((selected, index) =>
        <div className="multiselect__selection" key={`-elv-multi-select-${name}-${index}`}>
          <select
            name={name}
            value={selected}
            onChange={event => Update(index, event)}
          >
            {options.map(option => {
              if(Array.isArray(option)) {
                return <option value={option[1]} key={`-elv-${name}-${option[1]}-${index}`}>{option[0]}</option>;
              } else {
                return <option value={option} key={`-elv-${name}-${option}-${index}`}>{option}</option>;
              }
            })}
          </select>

          <div className="actions-container">
            <IconButton
              icon={RemoveIcon}
              label={`Remove ${buttonLabel || name}`}
              onClick={() => Remove(index)}
              className="multiselect__button multiselect__button-remove"
            />
          </div>
        </div>
      )}
      <div className="actions-container">
        <IconButton
          icon={AddIcon}
          label={`Add ${buttonLabel || name}`}
          onClick={() => Add()}
          className="multiselect__button multiselect__button-add"
        />
      </div>
    </div>
  );
};

export const MultiSelect = (props) => {
  return (
    <EditProps
      {...props}
      Render={newProps => (
        <MultiSelectComponent {...newProps} values={newProps.value}>
          { props.children }
        </MultiSelectComponent>
      )}
    />
  );
};

export const FileInput = observer((props) => {
  const [showModal, setShowModal] = useState(false);

  const path = typeof props.path === "undefined" ? "info" : props.path;
  const value = editStore.Value(props.objectId, path, props.name, {localize: props.localize});
  const selectedFile = ((value && value["/"]) || "").replace(/^\.\/files\//, "");
  const extension = selectedFile && (selectedFile.split(".").pop() || "").toLowerCase();
  const isImage = ImageExtensions.includes(extension);

  return (
    <LabelledField label={props.label || props.name} hint={props.hint}>
      <div className="link-selection file-input">
        {
          showModal ?
            <FileBrowserModal
              header={`Select a file for '${props.label || props.name}'`}
              objectId={props.objectId}
              extensions={props.image ? ImageExtensions : props.extensions}
              Select={selection => {
                editStore.SetValue(
                  props.objectId,
                  path,
                  props.name,
                  {
                    ".": {
                      "auto_update": {
                        "tag": "latest"
                      }
                    },
                    "/": UrlJoin(".", "files", selection.path)
                  },
                  {localize: props.localize}
                );
              }}
              Close={() => setShowModal(false)}
            /> : null
        }

        {
          selectedFile ?
            <LabelledField label="File" className="link-selection__selected__labelled-field">
              <div className="link-selection__selected">
                {
                  isImage ?
                    <ImagePreview objectId={props.objectId} filePath={selectedFile}>
                      <ImageIcon
                        className="link-selection__icon link-selection__selected__icon"
                        icon={PictureIcon}
                        alt="File"
                      />
                    </ImagePreview> :
                    <ImageIcon
                      className="link-selection__icon link-selection__selected__icon"
                      icon={FileIcon}
                      alt="File"
                    />
                }
                <div className="link-selection__selected__path" title={selectedFile}>
                  { selectedFile }
                </div>
                <IconButton
                  className="link-selection__icon link-selection__selected__remove"
                  icon={RemoveIcon}
                  title={`Remove '${props.label || props.name}'`}
                  onClick={() => editStore.SetValue(props.objectId, path, props.name, null, {localize: true})}
                />
              </div>
            </LabelledField> : null
        }
        {
          selectedFile && isImage ?
            <Input {...props} label="Alt Text" name={`${props.name}_alt-text`} hint="misc/alt-text" className="link-selection__alt-text"/> :
            null
        }

        <button
          className={`action action-${selectedFile ? "secondary" : "primary"} link-selection__select-button`}
          onClick={() => setShowModal(!showModal)}
        >
          { `Select ${props.label || props.name}` }
        </button>
      </div>
    </LabelledField>
  );
});

export const ContentInput = observer((props) => {
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectionName, setSelectionName] = useState(undefined);
  const [selectionPlayable, setSelectionPlayable] = useState(undefined);
  const [player, setPlayer] = useState(undefined);

  const path = typeof props.path === "undefined" ? "info" : props.path;
  const value = editStore.Value(props.objectId, path, props.name, {localize: props.localize});
  const selectedLink = ((value && value["/"]) || "");
  const selectedHash = selectedLink && selectedLink.startsWith("./") ?
    editStore.versionHashes[props.objectId] :
    selectedLink.split("/")[2];

  // If name is not set, automatically retrieve metadata for it
  useEffect(() => {
    if(!selectedHash || selectionName) { return; }

    if(player) {
      player.Destroy();
    }

    setShowPreview(false);
    setPlayer(undefined);

    if(value && value.name) {
      setSelectionName(value.name);
      setSelectionPlayable(value.playable);
    } else {
      editStore.LoadMetadata({
        versionHash: selectedHash,
        path: "/public"
      })
        .then(() => {
          setSelectionName(
            editStore.Value(
              Utils.DecodeVersionHash(selectedHash).objectId,
              "",
              "name"
            )
          );

          setSelectionPlayable(
            editStore.Value(
              Utils.DecodeVersionHash(selectedHash).objectId,
              "asset_metadata",
              "sources"
            )
          );
        });
    }
  }, [selectedLink]);

  return (
    <LabelledField label={props.label || props.name} hint={props.hint}>
      <div className="link-selection content-input">
        {
          showModal ?
            <ContentBrowserModal
              header={`Select content for '${props.label || props.name}'`}
              requireVersion={props.requireVersion}
              Select={selection => {
                setSelectionName(selection.name);
                setSelectionPlayable(selection.playable);

                let linkPath = `/q/${selection.versionHash}/meta/${props.linkPath || "public/asset_metadata"}`;
                if(selection.objectId === props.objectId) {
                  linkPath = `./meta/${props.linkPath || "public/asset_metadata"}`;
                }

                editStore.SetValue(
                  props.objectId,
                  path,
                  props.name,
                  {
                    name: selection.name,
                    playable: selection.playable,
                    ".": {
                      "auto_update": {
                        "tag": "latest"
                      }
                    },
                    "/": linkPath
                  },
                  {localize: props.localize}
                );
              }}
              Close={() => setShowModal(false)}
            /> : null
        }

        {
          selectedLink ?
            <LabelledField label="File" className="link-selection__selected__labelled-field">
              <div className="link-selection__selected">
                {
                  selectionPlayable ?
                    <IconButton
                      onClick={() => {
                        if(player) { player.Destroy(); }

                        setPlayer(undefined);
                        setShowPreview(!showPreview);
                      }}
                      className="link-selection__icon link-selection__selected__icon"
                      icon={PlayIcon}
                      alt="File"
                    /> :
                    <ImageIcon
                      className="link-selection__icon link-selection__selected__icon"
                      icon={FileIcon}
                      alt="File"
                    />
                }
                <div className="link-selection__selected__path" title={selectionName || selectedHash}>
                  { selectionName || selectedHash }
                </div>
                <IconButton
                  className="link-selection__icon link-selection__selected__remove"
                  icon={RemoveIcon}
                  title={`Remove '${props.label || props.name}'`}
                  onClick={() => editStore.SetValue(props.objectId, path, props.name, null, {localize: true})}
                />
              </div>
            </LabelledField> : null
        }

        {
          showPreview ?
            <div
              ref={element => {
                console.log(element, player);
                if(!element || player) { return; }

                setPlayer(
                  new EluvioPlayer(
                    element,
                    {
                      clientOptions: {
                        client: editStore.client
                      },
                      sourceOptions: {
                        playoutParameters: {
                          versionHash: selectedHash
                        }
                      },
                      playerOptions: {
                        watermark: EluvioPlayerParameters.watermark.OFF,
                        muted: EluvioPlayerParameters.muted.OFF,
                        autoplay: EluvioPlayerParameters.autoplay.OFF,
                        controls: EluvioPlayerParameters.controls.AUTO_HIDE,
                        loop: EluvioPlayerParameters.loop.OFF
                      }
                    }
                  )
                );
              }}
              className="link-selection__video-preview"
            />
            : null
        }

        <button
          className={`action action-${selectedLink ? "secondary" : "primary"} link-selection__select-button`}
          onClick={() => setShowModal(!showModal)}
        >
          { `Select ${props.label || props.name}` }
        </button>
      </div>
    </LabelledField>
  );
});
