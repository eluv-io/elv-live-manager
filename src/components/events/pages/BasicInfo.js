import React from "react";
import {observer} from "mobx-react";
import {editStore} from "Stores";
import {Form, Input, LabelledField, MultiSelect, Select} from "Components/common/Inputs";
import {useRouteMatch} from "react-router-dom";
import LanguageCodes from "Utils/LanguageCodes";
import Currencies from "Utils/Currencies";

const BasicInfo = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;

  return (
    <Form>
      <div className="form__section">
        <h2 className="form__section__header">
          Basic Info
        </h2>
        <Input label="Event Name" objectId={objectId} path="" name="display_title" localize />
        <Input label="Event Slug" objectId={objectId} path="" name="slug" hint="events/slug" />
        <Input label="Browser Page Title" objectId={objectId} name="page_title" localize />
        <Select label="Theme" objectId={objectId} name="theme">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </Select>
        <MultiSelect
          objectId={objectId}
          label="Currencies"
          name="payment_currencies"
          buttonLabel="Currency"
          hint="misc/currencies"
          options={Object.keys(Currencies).map(code => [Currencies[code], code])}
        />
        <MultiSelect
          objectId={objectId}
          label="Localizations"
          name="localizations"
          buttonLabel="Localization"
          hint="misc/localizations"
          options={Object.keys(LanguageCodes).map(code => [LanguageCodes[code], code])}
        />
        <Input label="Show Cookie Banner" objectId={objectId} path="info/event_info" name="show_cookie_banner" type="checkbox" />
      </div>
    </Form>
  );
});

export default BasicInfo;
