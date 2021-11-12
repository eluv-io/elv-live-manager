import React, {useEffect} from "react";
import {observer} from "mobx-react";
import {editStore} from "Stores";
import {Link, Redirect, useRouteMatch} from "react-router-dom";
import UrlJoin from "url-join";
import DetailList from "Components/common/DetailList";
import {DateTime, FileInput, Form, Input, MultiSelect, Price, Select, TextArea} from "Components/common/Inputs";
import LanguageCodes from "Utils/LanguageCodes";
import {Checkbox} from "@material-ui/core";
import {FormatPriceString} from "Utils/Misc";

export const TicketSku = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;

  const ticketClasses = (editStore.Value(objectId, "info", "tickets") || []);
  const ticketClassIndex = ticketClasses.findIndex(ticketClass => ticketClass.uuid === match.params.ticketClassId);
  const ticketClass = ticketClasses[ticketClassIndex];

  if(!ticketClass) {
    return <Redirect to={UrlJoin("/events", objectId, "tickets")} />;
  }

  const ticketSkuIndex = ticketClass.skus.findIndex(ticketSku => ticketSku.uuid === match.params.ticketSKUId);
  const ticketSku = ticketClass.skus[ticketSkuIndex];

  if(!ticketSku) {
    return <Redirect to={UrlJoin("/events", objectId, "tickets", match.params.ticketClassId)} />;
  }

  const basePath = UrlJoin("info", "tickets", ticketClassIndex.toString(), "skus", ticketSkuIndex.toString());
  const defaultCurrency = editStore.Currencies(objectId)[0] || "USD";

  return (
    <>
      <div className="navigation-header">
        <Link to={UrlJoin("/events", objectId, "tickets")}>
          Tickets
        </Link>
        <div className="navigation-header__link-separator" />
        <Link to={UrlJoin("/events", objectId, "tickets", match.params.ticketClassId)}>
          { ticketClass.name }
        </Link>
        <div className="navigation-header__link-separator" />
        <Link to={UrlJoin("/events", objectId, "tickets", match.params.ticketClassId, match.params.ticketSKUId)}>
          { ticketSku.label }
        </Link>
      </div>
      <Form>
        <div className="form__section">
          <h2 className="form__section__header">
            Ticket Class: { ticketClass.name }
          </h2>
          <Input label="Name" objectId={objectId} path={basePath} name="label" localize />
          <Input uuid label="UUID" objectId={objectId} path={basePath} name="uuid" readOnly />
          <DateTime required label="Start Time" objectId={objectId} path={basePath} name="start_time" />
          <DateTime label="End Time" objectId={objectId} path={basePath} name="end_time" />
          <Input required label="Start Time (Text)" objectId={objectId} path={basePath} name="start_time_text" hint="events/ticket_start_time_text" />
          <Input label="External URL" objectId={objectId} path={basePath} name="external_url" hint="events/ticket_external_url" />
          <Input type="checkbox" label="Hidden" objectId={objectId} path={basePath} name="hidden" hint="events/ticket_hidden" />
          <Price hideIf={UrlJoin(basePath, "external_url")} label="Price" objectId={objectId} path={basePath} name="price" />
        </div>
      </Form>
    </>
  );
});

export const TicketClass = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;

  const ticketClasses = (editStore.Value(objectId, "info", "tickets") || []);
  const ticketClassIndex = ticketClasses.findIndex(ticketClass => ticketClass.uuid === match.params.ticketClassId);
  const ticketClass = ticketClasses[ticketClassIndex];

  if(!ticketClass) {
    return <Redirect to={UrlJoin("/events", objectId, "tickets")} />;
  }

  const basePath = UrlJoin("info", "tickets", ticketClassIndex.toString());
  const defaultCurrency = editStore.Currencies(objectId)[0] || "USD";

  return (
    <>
      <div className="navigation-header">
        <Link to={UrlJoin("/events", objectId, "tickets")}>
          Tickets
        </Link>
        <div className="navigation-header__link-separator" />
        <Link to={UrlJoin("/events", objectId, "tickets", match.params.ticketClassId)}>
          { ticketClass.name }
        </Link>
      </div>
      <Form>
        <div className="form__section">
          <h2 className="form__section__header">
            Ticket SKUs
          </h2>
          <DetailList
            columnNames={["Name", "Price"]}
            columnClasses={["", "center"]}
            columnSizes="1fr 150px"
            items={
              (ticketClass.skus || []).map((ticketSku, ticketSkuIndex) => ({
                link: UrlJoin("/events", objectId, "tickets", ticketClass.uuid, ticketSku.uuid),
                values: [
                  editStore.Value(objectId, UrlJoin("info", "tickets", ticketClassIndex.toString(), "skus", ticketSkuIndex.toString()), "label", {localize: true}),
                  FormatPriceString((ticketSku.price || {})[defaultCurrency], defaultCurrency)
                ]
              }))
            }
            noItemsMessage="No Ticket SKUs Created"
            createText="Create Ticket SKU"
            Create={() => {}}
            Remove={async index => editStore.RemoveValue(objectId, UrlJoin("info", "tickets"), index)}
          />
        </div>
        <div className="form__section">
          <h2 className="form__section__header">
            Ticket Class: { ticketClass.name }
          </h2>
          <Input label="Name" objectId={objectId} path={basePath} name="name" localize />
          <Input uuid label="UUID" objectId={objectId} path={basePath} name="uuid" readOnly />
          <DateTime label="Release Date" objectId={objectId} path={basePath} name="release_date" hint="events/ticket_release_date" />
          <TextArea label="Description" objectId={objectId} path={basePath} name="description" localize />
          <FileInput label="Image" objectId={objectId} path={basePath} name="image"  image localize />
          <Input type="checkbox" label="Hidden" objectId={objectId} path={basePath} name="hidden" hint="events/ticket_hidden" />
          <Input type="checkbox" label="Requires Shipping" objectId={objectId} path={basePath} name="requires_shipping" hint="events/ticket_requires_shipping" />
        </div>
      </Form>
    </>
  );
});

export const Tickets = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;

  const ticketClasses = (editStore.Value(objectId, "info", "tickets") || []);

  return (
    <>
      <div className="navigation-header">
        <Link to={UrlJoin("/events", objectId, "tickets")}>
          Tickets
        </Link>
      </div>
      <DetailList
        columnNames={["Name", "SKUs"]}
        columnClasses={["", "center"]}
        columnSizes="1fr 150px"
        items={
          ticketClasses.map((ticketClass, index) => ({
            link: UrlJoin("/events", objectId, "tickets", ticketClass.uuid),
            values: [
              editStore.Value(objectId, UrlJoin("info", "tickets", index.toString()), "name", {localize: true}),
              (ticketClass.skus || []).length
            ]
          }))
        }
        noItemsMessage="No Tickets Created"
        createText="Create Ticket"
        Create={() => {}}
        Remove={async index => editStore.RemoveValue(objectId, UrlJoin("info", "tickets"), index)}
      />
    </>
  );
});
