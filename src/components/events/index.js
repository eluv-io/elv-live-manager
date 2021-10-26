import React from "react";
import {NavLink, Redirect, Route, Switch, useRouteMatch} from "react-router-dom";
import {observer} from "mobx-preact";
import EventNavigation from "Components/events/Navigation";
import { contentStore } from "Stores";
import UrlJoin from "url-join";
import Modal from "Components/common/Modal";
import FileBrowser from "Components/common/FileBrowser";
import {PageLoader} from "Components/common/Loader";

const Placeholder = ({ text }) => <div>{text}</div>;

const EventList = observer(() => {
  return (
    <>
      <div className="actions-container">
        <button className="action action-primary">Create Event</button>
      </div>
      <div className="navigation-list list events__list">
        {
          contentStore.events.map(event =>
            <NavLink to={UrlJoin("/events", event.objectId)} key={`event-${event.objectId}`} className="navigation-list__link list__item">
              { event.name || event.slug }
            </NavLink>
          )
        }
      </div>
    </>
  );
});

const Event = observer(() => {
  const match = useRouteMatch();
  const event = match.params.eventId && contentStore.Event(match.params.eventId);

  return (
    <div className="events">
      <h2>Event</h2>
      <FileBrowser objectId={event.objectId} Close={console.log} Select={console.log} />
    </div>
  );
});

const EventPage = observer(({children}) => {
  const match = useRouteMatch();
  const event = match.params.eventId && contentStore.Event(match.params.eventId);

  if(match.params.eventId && !event) {
    return <PageLoader />;
  }

  return (
    <div className="page-container page-container-nav">
      <EventNavigation />
      <div className="page-content">
        <h1 className="page-header">{event ? event.name : "Events"}</h1>
        {children}
      </div>
    </div>
  );
});

const Events = () => {
  return (
    <Switch>
      <Route exact path="/events">
        <EventPage>
          <EventList />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId">
        <EventPage>
          <Event />
        </EventPage>
      </Route>
      <Route path="/events/:eventId/marketplace">
        <EventPage>
          <Placeholder text="Marketplace" />
        </EventPage>
      </Route>
      <Route path="/events/:eventId/nfts">
        <EventPage>
          <Placeholder text="NFTs" />
        </EventPage>
      </Route>
      <Route path="/events/:eventId/media">
        <EventPage>
          <Placeholder text="Media" />
        </EventPage>
      </Route>
      <Route path="*">
        <Redirect to="/" />
      </Route>
    </Switch>
  );
};

export default Events;
