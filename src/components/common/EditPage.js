import React, {useEffect} from "react";
import {editStore} from "Stores";
import LanguageCodes from "Utils/LanguageCodes";
import {observer} from "mobx-preact";

// Page container with localization selection
const EditPage = observer(({objectId, header, children, className=""}) => {
  const availableLocalizations = editStore.Value(objectId, "info", "localizations") || [];

  useEffect(() => {
    if(!availableLocalizations.includes(editStore.currentLocalization)) {
      editStore.SetLocalization("default");
    }
  }, [availableLocalizations]);

  return (
    <div className={`page-content edit-page ${className}`}>
      <div className="edit-page__header">
        <h2 className="page-header">{ header }</h2>
        {
          availableLocalizations && availableLocalizations.length > 0 ?
            <select
              value={editStore.currentLocalization}
              onChange={event => editStore.SetLocalization(event.target.value)}
              className={`edit-page__localization-select ${editStore.currentLocalization !== "default" ? "edit-page__localization-select-active" : ""}`}
            >
              <option value="default">Default</option>
              {
                availableLocalizations.map(code =>
                  <option value={code} key={`language-${code}`}>{LanguageCodes[code]}</option>
                )
              }
            </select> : null
        }
      </div>
      { children }
    </div>
  );
});

export default EditPage;
