import React from "react";
import {observer} from "mobx-react";
import {Form, Input} from "Components/common/Inputs";
import {useRouteMatch} from "react-router-dom";
import UrlJoin from "url-join";

const SocialMedia = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;
  const basePath = UrlJoin("info", "social_media_links");

  return (
    <Form>
      <div className="form__section">
        <h2 className="form__section__header">
          Social Media Links
        </h2>
        <Input label="Apple Music" objectId={objectId} path={basePath} name="apple_music" url />
        <Input label="Facebook" objectId={objectId} path={basePath} name="facebook" url />
        <Input label="Instagram" objectId={objectId} path={basePath} name="instagram" url />
        <Input label="SoundCloud" objectId={objectId} path={basePath} name="soundcloud" url />
        <Input label="Spotify" objectId={objectId} path={basePath} name="spotify" url />
        <Input label="Twitter" objectId={objectId} path={basePath} name="twitter" url />
        <Input label="Website" objectId={objectId} path={basePath} name="website" url />
        <Input label="YouTube" objectId={objectId} path={basePath} name="youtube" url />
      </div>
    </Form>
  );
});

export default SocialMedia;
