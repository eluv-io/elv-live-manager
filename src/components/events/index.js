import React from "react";
import {NavLink, Redirect, Route, Switch, useRouteMatch} from "react-router-dom";
import {observer} from "mobx-preact";
import EventNavigation from "Components/events/Navigation";
import {contentStore, editStore} from "Stores";
import UrlJoin from "url-join";
import FileBrowser from "Components/common/FileBrowser";
import {PageLoader} from "Components/common/Loader";
import {ErrorBoundary} from "Components/common/ErrorBoundary";
import ContentBrowser, {ContentBrowserModal} from "Components/ContentBrowser";
import {SetFramePath} from "Utils/Misc";
import EditPage from "Components/common/EditPage";
import {Input} from "Components/common/Inputs";
import AsyncComponent from "Components/common/AsyncComponent";
import BasicInfo from "Components/events/pages/BasicInfo";
import MainPage from "Components/events/pages/MainPage";

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

  // <FileBrowserModal objectId={event.objectId} Close={console.log} Select={console.log} />
  return <BasicInfo />;
});

const EventPage = observer(({children, Render}) => {
  const match = useRouteMatch();
  const event = match.params.eventId && contentStore.Event(match.params.eventId);

  return (
    <ErrorBoundary key={`event-page-${match.url}`}>
      <SetFramePath />
      <div className="page-container page-container-nav">
        <EventNavigation />
        <AsyncComponent
          loaded={editStore.originalMetadata[match.params.eventId]}
          Load={async () => {
            if(!match.params.eventId) { return ; }

            await editStore.LoadMetadata({objectId: match.params.eventId});
          }}
        >
          <EditPage header={event ? event.name : "Events"}>
            { Render ? Render() : children }
          </EditPage>
        </AsyncComponent>
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
      <Route exact path="/events/:eventId/basic">
        <EventPage>
          <BasicInfo />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/main">
        <EventPage>
          <MainPage />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/landing">
        <EventPage>
          <Placeholder text="Landing Page" />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/info">
        <EventPage>
          <Placeholder text="Info Cards" />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/footer">
        <EventPage>
          <Placeholder text="Footer" />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/social">
        <EventPage>
          <Placeholder text="Social" />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/search">
        <EventPage>
          <Placeholder text="Search" />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/drops">
        <EventPage>
          <Placeholder text="Drops" />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/tickets">
        <EventPage>
          <Placeholder text="Tickets" />
        </EventPage>
      </Route>
      <Route path="*">
        <Redirect to="/" />
      </Route>
    </Switch>
  );
};

export default Events;
