import React, {useEffect, useState} from "react";
import {observer} from "mobx-react";
import {editStore} from "Stores";
import ImageIcon, {IconButton} from "Components/common/ImageIcon";

import {GenerateUUID, SafeTraverse} from "Utils/Misc";
import ToolTip from "Components/common/ToolTip";
import {FileBrowserModal} from "Components/common/FileBrowser";
import {ImageExtensions} from "Utils/Files";
import UrlJoin from "url-join";
import ImagePreview from "Components/common/ImagePreview";
import {ContentBrowserModal} from "Components/common/ContentBrowser";
import Utils from "@eluvio/elv-client-js/src/Utils";
import EluvioPlayer, {EluvioPlayerParameters} from "@eluvio/elv-player-js";
import Confirm from "Components/common/Confirm";
import {DateTimePicker} from "@material-ui/pickers";
import {Link, Redirect} from "react-router-dom";

import Hints from "Assets/documentation/InputHints.yaml";

import HintIcon from "Assets/icons/help-square.svg";
import FileIcon from "Assets/icons/file.svg";
import PictureIcon from "Assets/icons/image.svg";
import AddIcon from "Assets/icons/plus.svg";
import RemoveIcon from "Assets/icons/x.svg";
import PlayIcon from "Assets/icons/play-circle.svg";
import DownCaret from "Assets/icons/down-caret.svg";
import UpCaret from "Assets/icons/up-caret.svg";


const Validations = {
  NAN: (value) => isNaN(value) ? 0 : value,
  Numeric: (value) => (value || "").toString().replace(/[^0-9\.]+/g, ""),
  Number: (fixed) => (value) => Validations.NAN(fixed ? parseFloat(parseFloat(Validations.Numeric(value)).toFixed(fixed)) : parseFloat(Validations.Numeric(value))),
  Integer: (value) => Validations.NAN(parseInt(Validations.Numeric(value)))
};

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
  try {
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

    if(props.number || props.integer) {
      value = Validations.Numeric(value);
    }

    editStore.SetValue(props.objectId, path, props.name, value, {localize: props.localize});
  } catch(error) {
    console.error(`Failed to update value ${props.name}`);
    console.error(error);
  }
};

const FormatProps = props => {
  let filteredProps = { ...props };

  filteredProps.autoComplete = "off";
  filteredProps["data-lpignore"] = "true";

  if(props.number) {
    filteredProps.inputMode = "decimal";
  }

  if(props.integer) {
    filteredProps.inputMode = "numeric";
  }

  if(props.url) {
    filteredProps.inputMode = "url";
  }

  delete filteredProps.objectId;
  delete filteredProps.path;
  delete filteredProps.localize;
  delete filteredProps.hint;
  delete filteredProps.uuid;
  delete filteredProps.validations;
  delete filteredProps.Render;
  delete filteredProps.dependsOn;
  delete filteredProps.hideIf;
  delete filteredProps.only;
  delete filteredProps.defaultValue;

  // Types
  delete filteredProps.datetime;
  delete filteredProps.number;
  delete filteredProps.digits;
  delete filteredProps.integer;
  delete filteredProps.image;
  delete filteredProps.url;

  return filteredProps;
};

const FieldHidden = props => {
  if(editStore.currentLocalization !== "default" && !props.localize) {
    return true;
  }

  if(props.dependsOn) {
    const dependantValue = editStore.Value(props.objectId, props.dependsOn, "", {localize: props.localize});

    if(!dependantValue) {
      return true;
    }
  }

  if(props.hideIf) {
    const dependantValue = editStore.Value(props.objectId, props.hideIf, "", {localize: props.localize});

    if(dependantValue) {
      return true;
    }
  }

  if(props.only && !props.only()) {
    return true;
  }
};

export const EditField = observer((props) => {
  const path = typeof props.path === "undefined" ? "info" : props.path;
  let value = editStore.Value(props.objectId, path, props.name, {localize: props.localize});

  value = props.datetime ? value || null : value || "";

  useEffect(() => {
    if(props.uuid && !value) {
      UpdateValue(props, GenerateUUID());
    }

    if(props.defaultValue && typeof value === "undefined") {
      UpdateValue(props, props.defaultValue);
    }
  }, []);

  if(FieldHidden(props)) {
    return null;
  }

  let field;
  if(props.Render) {
    // Render passed, render with props
    field = props.Render(
      FormatProps({
        ...props,
        id: props.name,
        key: `${props.key || "edit-field"}-${editStore.currentLocalization}`,
        value,
        checked: props.type === "checkbox" ? value : undefined,
        onChange: eventOrValue => UpdateValue(props, eventOrValue)
      })
    );
  } else {
    // Child passed - clone and inject props
    field = (
      React.cloneElement(
        props.children,
        FormatProps({
          ...props,
          id: props.name,
          key: `${props.key || "edit-field"}-${editStore.currentLocalization}`,
          children: undefined,
          value,
          checked: props.type === "checkbox" ? value : undefined,
          onChange: eventOrValue => UpdateValue(props, eventOrValue),
          onBlur: () => {
            // When user leaves the field after editing

            if(props.number) {
              // If numeric, validate number and trim to specified digits
              UpdateValue(props, Validations.Number(props.digits)(value));
            }

            if(props.integer) {
              UpdateValue(props, Validations.Integer(value));
            }
          }
        })
      )
    );
  }

  if(!props.label) {
    return field;
  }

  return (
    <LabelledField name={props.name} label={props.label} hint={props.hint} className={props.className ? `${props.className}__labelled-field` : ""} >
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
    <EditField
      {...props}
      Render={newProps => (
        <select {...newProps}>
          { props.children }
        </select>
      )}
    />
  );
};

export const DateTime = (props) => {
  return (
    <EditField {...props} datetime>
      <DateTimePicker
        format="DDDD        H:mm ZZZZ"
        placeholder="No Date Selected"
        InputProps={{
          endAdornment: (
            <IconButton
              icon={RemoveIcon}
              onClick={event => {
                event.stopPropagation();
                UpdateValue(props, null);
              }}
            />
          )
        }}
      />
    </EditField>
  );
};

export const Price = observer((props) => {
  if(!props.localize && editStore.currentLocalization !== "default") {
    return null;
  }

  if(FieldHidden(props)) {
    return null;
  }

  return (
    editStore.Currencies(props.objectId).map(currency => {
      let symbol;
      try {
        const currentLocale = (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.language;
        symbol = new Intl.NumberFormat(currentLocale || "en-US", {style: "currency", currency})
          .formatToParts(0)
          .find(part => part.type === "currency")
          .value;
      } catch(error) {
        console.error(`Failed to determine currency symbol for ${currency}`);
      }

      return (
        <LabelledField label={`Price (${currency})`} name={props.name} hint={props.hint} key={`price-${currency}`}>
          <div className="input currency-input">
            <span className="currency-input__symbol">{ symbol }</span>
            <Input
              {...props}
              label={undefined}
              number
              digits={2}
              path={UrlJoin(props.path, "price")}
              name={currency}
            />
          </div>
        </LabelledField>
      );
    })
  );
});

export const Form = (props) => {
  return (
    <form onSubmit={event => event.preventDefault()} autoComplete="off" aria-autocomplete="none" aria-roledescription="form" className="form" {...props}>
      { props.children }
    </form>
  );
};

export const FormActions = ({backLink, Remove, removeText="Remove", removeConfirmationText="Are you sure you want to remove this item?"}) => {
  const [deleted, setDeleted] = useState(false);

  if(deleted) {
    return <Redirect to={backLink} />;
  }

  return (
    <div className="actions-container form-actions">
      <Link to={backLink} className="action action-primary">
        Done
      </Link>
      {
        Remove ?
          <button
            className="action action-danger"
            onClick={async event => {
              event.stopPropagation();
              event.preventDefault();

              await Confirm({
                message: removeConfirmationText,
                Confirm: async () => {
                  await Remove();
                  setDeleted(true);
                }
              });
            }}
          >
            { removeText }
          </button> : null
      }
    </div>
  );
};

const SwapButtons = props => {
  const list = editStore.Value(props.objectId, props.path, "", { localize: props.localize }) || [];

  let swapUpButton, swapDownButton;
  if(props.index > 0) {
    swapUpButton = (
      <IconButton
        icon={UpCaret}
        title="Move Item Up"
        className="action-icon swap-button swap-button-up"
        onClick={event => {
          event.preventDefault();
          event.stopPropagation();

          editStore.SwapListValue(props.objectId, props.path, props.index, props.index - 1, { localize: props.localize });
        }}
      />
    );
  }

  if(props.index < list.length - 1) {
    swapDownButton = (
      <IconButton
        icon={DownCaret}
        title="Move Item Down"
        className="action-icon swap-button swap-button-down"
        onClick={event => {
          event.preventDefault();
          event.stopPropagation();

          editStore.SwapListValue(props.objectId, props.path, props.index, props.index + 1, { localize: props.localize });
        }}
      />
    );
  }

  return  (
    <>
      { swapUpButton }
      { swapDownButton }
    </>
  );
};

export const InputList = observer(props => {
  const [hidden, setHidden] = useState(false);
  let list = editStore.Value(props.objectId, props.path, "", { localize: props.localize }) || [];

  if(typeof list === "object" && !Array.isArray(list)) {
    list = Object.values(list);
  }

  if(FieldHidden(props)) {
    return null;
  }

  return (
    <LabelledField
      label={
        <div className="input-list__label">
          { props.label }
          <IconButton
            icon={hidden ? DownCaret : UpCaret}
            title={hidden ? "Show Section" : "Hide Section"}
            className="input-list__show-hide-button"
            onClick={event => {
              event.preventDefault();
              event.stopPropagation();

              setHidden(!hidden);
            }}
          />
        </div>
      }
    >
      <div className="input-list" style={hidden ? {display: "none"} : {}}>
        { list.map((item, index) =>
          <div className="input-list__item">
            <div className="input-list__item-content">
              { props.Render(item, index) }
            </div>
            <div className="actions-container input-list__item__actions-container">
              <SwapButtons {...props} index={index} />
              <IconButton
                icon={RemoveIcon}
                title="Remove Item"
                className="action-icon"
                onClick={async event => {
                  event.stopPropagation();
                  event.preventDefault();

                  await Confirm({
                    message: "Are you sure you want to remove this item?",
                    Confirm: async () => editStore.RemoveValue(props.objectId, props.path, index.toString(), { localize: props.localize })
                  });
                }}
              />
            </div>
          </div>
        )}
        <div className="actions-container input-list__add-actions-container">
          <IconButton
            icon={AddIcon}
            title="Add Item"
            className="action-icon"
            onClick={() => editStore.AppendListValue(props.objectId, props.path, props.itemSpec, { localize: props.localize })}
          />
        </div>
      </div>
    </LabelledField>
  );
});

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
            value={selected || ""}
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
              className="action-icon multiselect__button multiselect__button-remove"
            />
          </div>
        </div>
      )}
      <div className="actions-container">
        <IconButton
          icon={AddIcon}
          label={`Add ${buttonLabel || name}`}
          onClick={() => Add()}
          className="action-icon multiselect__button multiselect__button-add"
        />
      </div>
    </div>
  );
};

export const MultiSelect = (props) => {
  return (
    <EditField
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

  if(FieldHidden(props)) {
    return null;
  }

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
                  onClick={async () => {
                    await Confirm({
                      message: `Are you sure you want to remove '${props.label || props.name}'?`,
                      Confirm: () => editStore.SetValue(props.objectId, path, props.name, null, {localize: true})
                    });
                  }}
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

  if(FieldHidden(props)) {
    return null;
  }

  return (
    <LabelledField label={props.label || props.name} hint={props.hint}>
      <div className="link-selection content-input">
        {
          showModal ?
            <ContentBrowserModal
              header={`Select content for '${props.label || props.name}'`}
              requireVersion={props.requireVersion}
              Select={selection => {
                if(player) { player.Destroy(); }

                setPlayer(undefined);
                setShowPreview(false);

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
                      className={`link-selection__icon link-selection__selected__icon ${showPreview ? "link-selection__selected__icon-active" : ""}`}
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
                  onClick={async () => {
                    await Confirm({
                      message: `Are you sure you want to remove '${props.label || props.name}'?`,
                      Confirm: () => {
                        if(player) { player.Destroy(); }

                        setPlayer(undefined);
                        setShowPreview(false);

                        editStore.SetValue(props.objectId, path, props.name, null, {localize: true});
                      }
                    });
                  }}
                />
              </div>
            </LabelledField> : null
        }

        {
          showPreview ?
            <div
              ref={element => {
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
