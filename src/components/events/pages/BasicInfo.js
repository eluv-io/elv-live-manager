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
    <div aria-roledescription="form" className="form">
      <div className="form__section">
        <h2 className="form__section__header">
          Basic Info
        </h2>
        <Input label="Event Name" objectId={objectId} path="" name="display_title" localize />
        <Input label="Event Slug" objectId={objectId} path="" name="slug" hint="events/slug" localize />
        <Input label="Browser Page Title" objectId={objectId} name="page_title" localize />
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
          hint="misc/localizations"
          options={Object.keys(LanguageCodes).map(code => [LanguageCodes[code], code])}
        />
        <Input label="Show Cookie Banner" objectId={objectId} path="info/event_info" name="show_cookie_banner" type="checkbox" />
      </div>
    </div>
  );
});

export default BasicInfo;
