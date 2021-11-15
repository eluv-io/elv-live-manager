import {observer} from "mobx-react";
import {Redirect, useRouteMatch} from "react-router-dom";
import {editStore} from "Stores";
import DetailList from "Components/common/DetailList";
import UrlJoin from "url-join";
import React from "react";
import SponsorSpec from "Specs/Sponsor";
import {FileInput, Form, Input} from "Components/common/Inputs";

export const Sponsor = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;
  const basePath = UrlJoin("info", "sponsors", match.params.sponsorIndex.toString());

  const sponsor = editStore.Value(objectId, basePath, "");

  if(!sponsor) {
    return <Redirect to={UrlJoin("/events", match.params.eventId, "sponsors")} />;
  }

  return (
    <Form>
      <div className="form__section">
        <h2 className="form__section__header">
          Sponsor: { sponsor.name }
        </h2>
        <Input label="Name" objectId={objectId} path={basePath} name="name" localize />
        <Input label="Link" objectId={objectId} path={basePath} name="link" url localize />
        <FileInput label="Logo (For Light Background)" objectId={objectId} path={basePath} name="image" hint="events/sponsor_image" image localize />
        <FileInput label="Logo (For Dark Background)" objectId={objectId} path={basePath} name="image_light" hint="events/sponsor_image" image localize />
      </div>
    </Form>
  );
});

export const Sponsors = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;

  const sponsors = (editStore.Value(objectId, "info", "sponsors") || []);
  return (
    <Form>
      <DetailList
        header="Sponsors"
        columnNames={["Name", "Link"]}
        columnSizes="1fr 2fr"
        items={
          sponsors.map((sponsor, index) => ({
            link: UrlJoin("/events", objectId, "sponsors", index.toString()),
            values: [
              editStore.Value(objectId, UrlJoin("info", "sponsors", index.toString()), "name", {localize: true}),
              editStore.Value(objectId, UrlJoin("info", "sponsors", index.toString()), "link", {localize: true}),
            ]
          }))
        }
        noItemsMessage="No Sponsors Added"
        createText="Add Sponsor"
        Create={() => {
          const sponsor = SponsorSpec();
          const newIndex = editStore.AppendListValue(objectId, UrlJoin("info", "sponsors"), sponsor);

          return UrlJoin("/events", objectId, "sponsors", newIndex.toString());
        }}
        removeText={item => `Are you sure you want to remove ${item.values[0] || "this sponsor"}?`}
        Remove={async index => editStore.RemoveValue(objectId, UrlJoin("info", "sponsors"), index)}
      />
      <div className="form__section">
        <Input label="Sponsor Tagline" objectId={objectId} path="info" name="sponsor_tagline" localize hint="events/sponsor_tagline" />
      </div>
    </Form>
  );
});
