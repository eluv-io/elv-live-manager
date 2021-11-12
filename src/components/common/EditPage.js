import React, {useEffect} from "react";
import {editStore} from "Stores";
import LanguageCodes from "Utils/LanguageCodes";
import {observer} from "mobx-react";
import {ErrorBoundary} from "Components/common/ErrorBoundary";

// Page container with localization selection
const EditPage = observer(({objectId, header, children, className=""}) => {
  //const availableLocalizations = editStore.Value(objectId, "info", "localizations") || [];
  const availableLocalizations = ["fr"];

  useEffect(() => {
    if(!availableLocalizations.includes(editStore.currentLocalization)) {
      editStore.SetLocalization("default");
    }
  }, [availableLocalizations]);

  return (
    <ErrorBoundary key={`edit-page-${header}`}>
      <div className={`page-content edit-page ${className}`}>
        <div className="edit-page__header">
          <h2 className="edit-page__header__text">{ header } {editStore.currentLocalization === "default" ? "" : ` - ${LanguageCodes[editStore.currentLocalization]} Localization`}</h2>
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
    </ErrorBoundary>
  );
});

export default EditPage;
