import React from "react";
import {NavLink, Redirect, Route, Switch, useRouteMatch} from "react-router-dom";
import {observer} from "mobx-preact";
import EventNavigation from "Components/events/Navigation";
import { contentStore } from "Stores";
import UrlJoin from "url-join";
import FileBrowser from "Components/common/FileBrowser";
import {PageLoader} from "Components/common/Loader";
import {ErrorBoundary} from "Components/common/ErrorBoundary";
import ContentBrowser, {ContentBrowserModal} from "Components/ContentBrowser";
import {SetFramePath} from "Utils/Misc";

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

  // <FileBrowserModal objectId={event.objectId} Close={console.log} Select={console.log} />
  return (
    <div className="page-content events">
      <h2>Event</h2>
      <ContentBrowserModal Close={console.log} Select={console.log} requireVersion />
    </div>
  );
});

const EventPage = observer(({children, Render}) => {
  const match = useRouteMatch();
  const event = match.params.eventId && contentStore.Event(match.params.eventId);

  return (
    <ErrorBoundary>
      <SetFramePath />
      <div className="page-container page-container-nav">
        <EventNavigation />
        {
          match.params.eventId && !event ?
            <PageLoader /> :
            <div className="page-content">
              <h1 className="page-header">{event ? event.name : "Events"}</h1>
              { Render ? Render() : children }
            </div>
        }
      </div>
    </ErrorBoundary>
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
          <Placeholder text="Event" />
        </EventPage>
      </Route>
      <Route path="/events/:eventId/marketplace">
        <EventPage>
          <ContentBrowser requireVersion />
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
      <Route path="/events/:eventId/files">
        <EventPage
          Render={() => {
            const match = useRouteMatch();

            return <FileBrowser header="Files" objectId={match.params.eventId} />;
          }}
        />
      </Route>
      <Route path="*">
        <Redirect to="/" />
      </Route>
    </Switch>
  );
};

export default Events;
