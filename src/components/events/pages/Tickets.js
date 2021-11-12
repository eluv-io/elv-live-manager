import React from "react";
import {observer} from "mobx-react";
import {editStore} from "Stores";
import {Redirect, useRouteMatch} from "react-router-dom";
import UrlJoin from "url-join";
import DetailList from "Components/common/DetailList";
import {DateTime, FileInput, Form, Input, Price, TextArea} from "Components/common/Inputs";
import {FormatPriceString} from "Utils/Misc";
import TicketClassSpec from "Specs/TicketClass";
import * as luxon from "luxon";
import TicketSKUSpec from "Specs/TicketSKU";

export const TicketSku = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;

  const ticketClasses = (editStore.Value(objectId, "info", "tickets") || []);
  const ticketClassIndex = ticketClasses.findIndex(ticketClass => ticketClass.uuid === match.params.ticketClassId);
  const ticketClass = ticketClasses[ticketClassIndex];

  if(!ticketClass) {
    return <Redirect to={UrlJoin("/events", objectId, "tickets")} />;
  }

  const ticketSkuIndex = (ticketClass.skus || []).findIndex(ticketSku => ticketSku.uuid === match.params.ticketSKUId);
  const ticketSku = (ticketClass.skus || [])[ticketSkuIndex];

  if(!ticketSku) {
    return <Redirect to={UrlJoin("/events", objectId, "tickets", match.params.ticketClassId)} />;
  }

  const basePath = UrlJoin("info", "tickets", ticketClassIndex.toString(), "skus", ticketSkuIndex.toString());

  return (
    <Form>
      <div className="form__section">
        <h2 className="form__section__header">
          Ticket Class: { ticketClass.name }
        </h2>
        <Input label="Name" objectId={objectId} path={basePath} name="label" localize />
        <Input uuid label="UUID" objectId={objectId} path={basePath} name="uuid" readOnly />
        <Price hideIf={UrlJoin(basePath, "external_url")} label="Price" objectId={objectId} path={basePath} name="price" />
        <DateTime required label="Start Time" objectId={objectId} path={basePath} name="start_time" />
        <Input required label="Start Time (Text)" objectId={objectId} path={basePath} name="start_time_text" hint="events/ticket_start_time_text" />
        <DateTime label="End Time" objectId={objectId} path={basePath} name="end_time" />
        <Input label="External URL" objectId={objectId} path={basePath} name="external_url" hint="events/ticket_external_url" />
        <Input type="checkbox" label="Hidden" objectId={objectId} path={basePath} name="hidden" hint="events/ticket_hidden" />
      </div>
    </Form>
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
    <Form>
      <div className="form__section">
        <h2 className="form__section__header">
          Ticket SKUs
        </h2>
        <DetailList
          columnNames={["Name", "Start Time", "Price"]}
          columnClasses={["", "", "center"]}
          columnSizes="1fr 1fr 150px"
          items={
            (ticketClass.skus || []).map((ticketSku, ticketSkuIndex) => ({
              link: UrlJoin("/events", objectId, "tickets", ticketClass.uuid, ticketSku.uuid),
              values: [
                editStore.Value(objectId, UrlJoin("info", "tickets", ticketClassIndex.toString(), "skus", ticketSkuIndex.toString()), "label", {localize: true}),
                ticketSku.start_time ? luxon.DateTime.fromISO(ticketSku.start_time).toFormat("DDDD        H:mm ZZZZ") : "",
                FormatPriceString((ticketSku.price || {})[defaultCurrency], defaultCurrency)
              ]
            }))
          }
          noItemsMessage="No Ticket SKUs Created"
          createText="Create Ticket SKU"
          Create={() => {
            const ticketSku = TicketSKUSpec();
            editStore.AppendListValue(objectId, UrlJoin(basePath, "skus"), ticketSku);

            return UrlJoin("/events", objectId, "tickets", ticketClass.uuid, ticketSku.uuid);
          }}
          removeText={item => `Are you sure you want to remove ${item.values[0] || "this ticket sku"}?`}
          Remove={async index => editStore.RemoveValue(objectId, UrlJoin("info", "tickets", ticketClassIndex.toString(), "skus"), index)}
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
  );
});

export const Tickets = observer(() => {
  const match = useRouteMatch();
  const objectId = match.params.eventId;

  const ticketClasses = (editStore.Value(objectId, "info", "tickets") || []);

  return (
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
      Create={() => {
        const ticketClass = TicketClassSpec();
        editStore.AppendListValue(objectId, UrlJoin("info", "tickets"), ticketClass);

        return UrlJoin("/events", objectId, "tickets", ticketClass.uuid);
      }}
      removeText={item => `Are you sure you want to remove ${item.values[0] || "this ticket class"}?`}
      Remove={async index => editStore.RemoveValue(objectId, UrlJoin("info", "tickets"), index)}
    />
  );
});
