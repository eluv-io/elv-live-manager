import React from "react";
import {observer} from "mobx-preact";
import {editStore} from "Stores";
import {IconButton} from "Components/common/ImageIcon";
import AddIcon from "Assets/icons/plus-square.svg";
import RemoveIcon from "Assets/icons/x-square.svg";

export const LabelledField = observer(({label, children}) => {
  return (
    <div className="labelled-field">
      <label>{label}</label>
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

export const EditField = observer((props) => {
  const path = typeof props.path === "undefined" ? "info" : props.path;
  const value = editStore.Value(props.objectId, path, props.name, {localize: props.localize});

  const field = (
    React.cloneElement(
      props.children,
      {
        ...props,
        key: `${props.key || "edit-field"}-${editStore.currentLocalization}`,
        children: undefined,
        value,
        checked: props.type === "checkbox" ? value : undefined,
        onChange: eventOrValue => UpdateValue(props, eventOrValue)
      }
    )
  );

  if(!props.label) {
    return field;
  }

  return (
    <LabelledField label={props.label}>
      { field }
    </LabelledField>
  );
});

export const EditProps = observer(props => {
  const path = typeof props.path === "undefined" ? "info" : props.path;
  const value = editStore.Value(props.objectId, path, props.name, {localize: props.localize});

  const field = (
    props.Render(
      {
        ...props,
        key: `${props.key || "edit-field"}-${editStore.currentLocalization}`,
        value: editStore.Value(props.objectId, path, props.name, {localize: props.localize}),
        checked: props.type === "checkbox" ? value : undefined,
        onChange: eventOrValue => UpdateValue(props, eventOrValue)
      }
    )
  );

  if(!props.label) {
    return field;
  }

  return (
    <LabelledField label={props.label}>
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
