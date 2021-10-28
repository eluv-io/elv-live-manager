import React from "react";
import {observer} from "mobx-preact";
import {editStore} from "Stores";
import {Input, LabelledField, MultiSelect, Select} from "Components/common/Inputs";
import {useRouteMatch} from "react-router-dom";

const MainPageText = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;

  const hide = editStore.Value(objectId, "info/event_info", "hero_info");

  if(hide) { return null; }

  return (
    <>
      <Input label="Header" objectId={objectId} path="info/event_info" name="event_header" localize />
      <Input label="Subheader" objectId={objectId} path="info/event_info" name="event_subheader" localize />
      <Input label="Date Header" objectId={objectId} path="info/event_info" name="date_subheader" localize />
      <Input label="Show Countdown" objectId={objectId} path="info/event_info" name="show_countdown" type="checkbox" />
    </>
  );
});

const MainPage = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;

  return (
    <form className="form">
      <div className="form__section">
        <h2 className="form__section__header">
          Hero Text
        </h2>
        <Input label="Hide Hero Text" objectId={objectId} path="info/event_info" name="hero_info" type="checkbox" />
        <MainPageText />
      </div>
      <div className="form__section">
        <h2 className="form__section__header">
          Images
        </h2>
        <Input label="Hide Hero Text" objectId={objectId} path="info/event_info" name="hero_info" type="checkbox" />
        <MainPageText />
      </div>
    </form>
  );
});

export default MainPage;
