import React from "react";
import {observer} from "mobx-react";
import {editStore} from "Stores";
import {ContentInput, FileInput, Form, Input} from "Components/common/Inputs";
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
      <Input label="Show Countdown" objectId={objectId} path="info/event_info" name="show_countdown" type="checkbox" localize />
    </>
  );
});

const MainPage = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;

  return (
    <Form>
      <div className="form__section">
        <h2 className="form__section__header">
          Images
        </h2>
        <FileInput label="Logo" objectId={objectId} path="info/event_images" name="logo" hint="events/logo" image localize />
        <Input dependsOn="/info/event_images/logo" label="Logo Link" objectId={objectId} path="info/event_images" name="logo_link" hint="events/logo_link" localize/>
        <FileInput label="Hero Image (Desktop)" objectId={objectId} path="info/event_images" name="hero_background" hint="events/hero_image" image localize />
        <FileInput label="Hero Image (Mobile)" objectId={objectId} path="info/event_images" name="hero_background_mobile" hint="events/hero_image_mobile" image localize />
        <ContentInput label="Hero Video (Desktop)" objectId={objectId} path="info/event_images" name="hero_video" hint="events/hero_video" localize />
        <ContentInput label="Hero Video (Mobile)" objectId={objectId} path="info/event_images" name="hero_video_mobile" hint="events/hero_video" localize />
      </div>
      <div className="form__section">
        <h2 className="form__section__header">
          Header Text
        </h2>
        <Input label="Hide Header Text" objectId={objectId} path="info/event_info" name="hero_info" hint="events/hide_header_text" type="checkbox" localize />
        <MainPageText />
      </div>
    </Form>
  );
});

export default MainPage;
