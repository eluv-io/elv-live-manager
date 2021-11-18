import React from "react";
import {observer} from "mobx-react";
import {Redirect, useRouteMatch} from "react-router-dom";
import {editStore} from "Stores";
import DetailList from "Components/common/DetailList";
import UrlJoin from "url-join";
import {Color, FileInput, Form, FormActions, Input} from "Components/common/Inputs";
import RichText from "Components/common/RichText";
import {InfoCardPageSpec, InfoCardSpec} from "Specs/InfoCard";

export const InfoCardPage = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;
  const cardIndex = match.params.infoCardIndex;
  const pageIndex = match.params.infoCardPageIndex;

  const infoCard = (editStore.Value(objectId, "info", "event_descriptions") || [])[cardIndex] || {};
  const page = (infoCard.pages || [])[pageIndex];

  const basePath = UrlJoin("info", "event_descriptions", cardIndex.toString(), "pages", pageIndex);

  if(!page) {
    return <Redirect to={UrlJoin("info", "event_descriptions", cardIndex.toString())} />;
  }

  return (
    <Form>
      <div className="form__section">
        <h1 className="form__section__header">Info Card: { infoCard.name || "<Name>" } | Page { parseInt(pageIndex) + 1 }</h1>
        <Input label="Page Title" objectId={objectId} path={basePath} name="name" localize />
        <Input label="Page Hint" objectId={objectId} path={basePath} name="page_title" localize hint="events/info_card_page_hint" />
        <FileInput label="Image" objectId={objectId} path={basePath} name="image" localize />
        <Color objectId={objectId} path={basePath} label="Page Text Color" name="text_color" localize />
        <Color objectId={objectId} path={basePath} label="Page Background Color" name="background_color" localize />
        <RichText label="Content" objectId={objectId} path={basePath} name="text" localize />
        <FormActions
          backLink={UrlJoin("/events", objectId, "info_cards", cardIndex.toString())}
          removeText="Remove Page"
          removeConfirmationText="Are you sure you want to remove this page?"
          Remove={async () => editStore.RemoveValue(objectId, UrlJoin("info", "event_descriptions", cardIndex.toString(), "pages", ), pageIndex.toString())}
        />
      </div>
    </Form>
  );
});

export const InfoCard = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;
  const cardIndex = match.params.infoCardIndex;
  const infoCard = (editStore.Value(objectId, "info", "event_descriptions") || [])[cardIndex];

  if(!infoCard) {
    return <Redirect to={UrlJoin("info", "event_descriptions", cardIndex.toString())} />;
  }

  return (
    <Form>
      <div className="form__section">
        <h1 className="form__section__header">Info Card: { infoCard.name || "<Name>" }</h1>
        <Input label="Button Text" objectId={objectId} path={UrlJoin("info", "event_descriptions", cardIndex.toString())} name="name" localize />
      </div>
      <DetailList
        header="Pages"
        hint="events/info_card_pages"
        columnNames={["Text"]}
        columnSizes="1fr"
        items={
          (infoCard.pages || []).map((linkInfo, index) => ({
            link: UrlJoin("/events", objectId, "info_cards", cardIndex.toString(), index.toString()),
            values: [
              editStore.Value(objectId, UrlJoin("info", "event_descriptions", cardIndex.toString(), "pages", index.toString()), "name", {localize: true}) ||
              editStore.Value(objectId, UrlJoin("info", "event_descriptions", cardIndex.toString(), "pages", index.toString()), "text", {localize: true})
            ]
          }))
        }
        noItemsMessage="No Pages Added"
        createText="Add Page"
        Create={() => {
          const newIndex = editStore.AppendListValue(objectId, UrlJoin("info", "event_descriptions", cardIndex.toString(), "pages"), InfoCardPageSpec());

          return UrlJoin("/events", objectId, "info_cards", cardIndex.toString(), newIndex.toString());
        }}
        removeText={item => `Are you sure you want to remove ${item.values[0] || "this page"}?`}
        Remove={async index => editStore.RemoveValue(objectId, UrlJoin("info", "event_descriptions", cardIndex.toString(), "pages"), index)}
      />
      <FormActions
        backLink={UrlJoin("/events", objectId, "info_cards")}
        removeText="Remove Info Card"
        removeConfirmationText="Are you sure you want to remove this info card?"
        Remove={async () => editStore.RemoveValue(objectId, UrlJoin("info", "event_descriptions"), cardIndex.toString())}
      />
    </Form>
  );
});


export const InfoCards = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;

  const infoCards = (editStore.Value(objectId, "info", "event_descriptions") || []);
  return (
    <Form>
      <DetailList
        header="Info Cards"
        hint="events/info_cards"
        columnNames={["Name", "Pages"]}
        columnSizes="1fr 100px"
        items={
          infoCards.map((linkInfo, index) => ({
            link: UrlJoin("/events", objectId, "info_cards", index.toString()),
            values: [
              editStore.Value(objectId, UrlJoin("info", "event_descriptions", index.toString()), "name", {localize: true}),
              (infoCards[index].pages || []).length
            ]
          }))
        }
        noItemsMessage="No Info Cards Added"
        createText="Add Info Card"
        Create={() => {
          const newIndex = editStore.AppendListValue(objectId, UrlJoin("info", "event_descriptions"), InfoCardSpec());

          return UrlJoin("/events", objectId, "info_cards", newIndex.toString());
        }}
        removeText={item => `Are you sure you want to remove ${item.values[0] || "this info cards"}?`}
        Remove={async index => editStore.RemoveValue(objectId, UrlJoin("info", "event_descriptions"), index)}
      />
    </Form>
  );
});
