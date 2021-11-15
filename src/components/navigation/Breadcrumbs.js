import React from "react";
import {observer} from "mobx-react";
import {NavLink, useRouteMatch} from "react-router-dom";
import {contentStore, editStore} from "Stores";
import UrlJoin from "url-join";

const TicketClass = match => {
  const ticketClasses = (editStore.Value(match.params.eventId, "info", "tickets") || []);
  const ticketClassIndex = ticketClasses.findIndex(ticketClass => ticketClass.uuid === match.params.ticketClassId);
  const ticketClass = ticketClasses[ticketClassIndex];

  if(!ticketClass) { return null; }

  return { label: ticketClass.name, link: UrlJoin("/events", match.params.eventId, "tickets", match.params.ticketClassId) };
};

const TicketSKU = match => {
  const ticketClasses = (editStore.Value(match.params.eventId, "info", "tickets") || []);
  const ticketClassIndex = ticketClasses.findIndex(ticketClass => ticketClass.uuid === match.params.ticketClassId);
  const ticketClass = ticketClasses[ticketClassIndex];

  if(!ticketClass) { return null; }

  const ticketSkuIndex = (ticketClass.skus || []).findIndex(ticketSku => ticketSku.uuid === match.params.ticketSKUId);
  const ticketSku = (ticketClass.skus || [])[ticketSkuIndex];

  if(!ticketSku) { return null; }

  return { label: ticketSku.label, link: UrlJoin("/events", match.params.eventId, "tickets", match.params.ticketClassId, match.params.ticketSKUId) };
};

const Sponsor = match => {
  const sponsors = editStore.Value(match.params.eventId, UrlJoin("info", "sponsors")) || [];
  const sponsor = sponsors[match.params.sponsorIndex];

  if(!sponsor) { return null; }

  return { label: sponsor.name, link: UrlJoin("/events", match.params.eventId, "sponsors", match.params.sponsorIndex) };
};

const EventBreadcrumbs = match => {
  const event = contentStore.Event(match.params.eventId);

  if(!event) {
    return [];
  }

  let breadcrumbs = [{ label: event.name, link: UrlJoin("/events", match.params.eventId) }];

  const basePage = match.path.split("/")[3] || "";
  const baseLabels = {
    "basic": "Basic Info",
    "drops": "Drops",
    "footer": "Footer",
    "info": "Info Cards",
    "landing": "Landing Page",
    "main": "Main Page",
    "search": "Search and Analytics",
    "social": "Social Media Links",
    "sponsors": "Sponsors",
    "tickets": "Tickets",
  };

  if(basePage) {
    breadcrumbs.push({label: baseLabels[basePage] || "", link: UrlJoin("/events", match.params.eventId, basePage) });
  }

  if(match.path.includes("/tickets")) {
    breadcrumbs.push(TicketClass(match));
    breadcrumbs.push(TicketSKU(match));
  }

  if(match.path.includes("/sponsors")) {
    breadcrumbs.push(Sponsor(match));
  }

  return breadcrumbs;
};

const Breadcrumbs = observer(() => {
  const match = useRouteMatch();

  let breadcrumbs = [];

  if(match.path.startsWith("/events")) {
    breadcrumbs = EventBreadcrumbs(match);
  }

  return (
    <div className="navigation-header">
      {
        breadcrumbs
          .filter(crumb => crumb)
          .map(({label, link}, index) =>
            [
              <NavLink
                to={link}
                className={`navigation-header__link ${match.url === link ? "navigation-header__link-active" : ""}`}
                key={`breadcrumb-link-${index}`}
              >
                { label }
              </NavLink>,
              <div className="navigation-header__link-separator" key={`breadcrumbs-link-separator-${index}`} />
            ]
          )
      }
    </div>
  );
});

export default Breadcrumbs;
