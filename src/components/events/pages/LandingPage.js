import React from "react";
import {observer} from "mobx-react";
import {FileInput, Form, Input, TextArea} from "Components/common/Inputs";
import {useRouteMatch} from "react-router-dom";

const LandingPage = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;

  return (
    <Form>
      <div className="form__section">
        <h2 className="form__section__header">
          Event Landing Page
        </h2>

        <Input label="Header Text" objectId={objectId} path="info/event_landing_page" name="header_text" localize />
        <Input label="Show Countdown" objectId={objectId} path="info/event_landing_page" name="show_countdown" localize type="checkbox" />
        <FileInput label="Header Image" objectId={objectId} path="info/event_landing_page" name="header_image" image localize />
        <FileInput label="Background Image (Desktop)" objectId={objectId} path="info/event_landing_page" name="background_image" hint="events/hero_image" image localize />
        <FileInput label="Background Image (Mobile)" objectId={objectId} path="info/event_landing_page" name="background_image_mobile" hint="events/hero_image_mobile" image localize />
        <TextArea label="Top Message" objectId={objectId} path="info/event_landing_page" name="message_1" localize />
        <TextArea label="Bottom Message" objectId={objectId} path="info/event_landing_page" name="message_2" localize />
      </div>
    </Form>
  );
});

export default LandingPage;

/*


{
  "fields": [
  {
    "name": "header_image",
    "type": "file",
    "extensions": imageTypes
  },
  {
    "name": "background_image",
    "type": "file",
    "extensions": imageTypes
  },
  {
    "name": "background_image_mobile",
    "label": "Background Image (Mobile)",
    "type": "file",
    "extensions": imageTypes
  },
  {
    "name": "header_text",
    "type": "text"
  },
  {
    "name": "show_countdown",
    "type": "checkbox",
    "default_value": true
  },
  {
    "name": "message_1",
    "type": "textarea",
    "hint": "Message above the countdown. Default: 'Your Code is Redeemed. Drop Begins In'"
  },
  {
    "name": "message_2",
    "type": "textarea",
    "hint": "Message below the countdown. Default: 'Use the link in your code email to return here at the time of the drop.'"
  }
],
  "name": "event_landing_page",
  "type": "subsection"
},



 */
