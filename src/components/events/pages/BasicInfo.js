import React from "react";
import {observer} from "mobx-preact";
import {editStore} from "Stores";
import {Input, LabelledField, MultiSelect, Select} from "Components/common/Inputs";
import {useRouteMatch} from "react-router-dom";
import LanguageCodes from "Utils/LanguageCodes";

const BasicInfo = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;

  return (
    <form className="form">
      <div className="form__section">
        <h2 className="form__section__header">
          Basic Info
        </h2>
        <Input label="Event" objectId={objectId} name="event_name" localize />
        <Input label="Page Title" objectId={objectId} name="page_title" localize />
        <Select label="Type" objectId={objectId} name="type">
          <option value="streaming_event">Ticketed Streaming Event</option>
          <option value="drop_event">NFT Drop Event</option>
        </Select>
        <Select label="Theme" objectId={objectId} name="theme">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </Select>
        <MultiSelect
          label="Localizations"
          name="localizations"
          buttonLabel="Localization"
          options={Object.keys(LanguageCodes).map(code => [LanguageCodes[code], code])}
        />
      </div>
    </form>
  );
});

export default BasicInfo;
