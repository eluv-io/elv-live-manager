import React from "react";
import {NavLink, Redirect, Route, Switch, useRouteMatch} from "react-router-dom";
import {observer} from "mobx-react";
import EventNavigation from "Components/events/Navigation";
import {contentStore, editStore} from "Stores";
import UrlJoin from "url-join";
import FileBrowser from "Components/common/FileBrowser";
import {PageLoader} from "Components/common/Loader";
import {ErrorBoundary} from "Components/common/ErrorBoundary";
import ContentBrowser, {ContentBrowserModal} from "Components/common/ContentBrowser";
import {SetFramePath} from "Utils/Misc";
import EditPage from "Components/common/EditPage";
import {Input} from "Components/common/Inputs";
import AsyncComponent from "Components/common/AsyncComponent";
import BasicInfo from "Components/events/pages/BasicInfo";
import MainPage from "Components/events/pages/MainPage";
import {set} from "mobx";
import {TicketClass, Tickets, TicketSku} from "Components/events/pages/Tickets";
import Breadcrumbs from "Components/navigation/Breadcrumbs";
import SocialMedia from "Components/events/pages/SocialMedia";
import {Sponsor, Sponsors} from "Components/events/pages/Sponsors";
import {Footer, FooterLink} from "Components/events/pages/Footer";
import {InfoCard, InfoCardPage, InfoCards} from "Components/events/pages/InfoCards";

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
      <div className="page-container page-container-nav">
        <EventNavigation />
        <AsyncComponent
          loaded={editStore.originalMetadata[match.params.eventId]}
          Load={async () => {
            if(!match.params.eventId) { return ; }

            await editStore.LoadAssetMetadata({objectId: match.params.eventId});
          }}
        >
          <EditPage objectId={match.params.eventId} header={event ? editStore.Value(match.params.eventId, "", "display_title") || event.name : "Events"}>
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
      <Route exact path="/events/:eventId/info_cards">
        <EventPage>
          <InfoCards />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/info_cards/:infoCardIndex">
        <EventPage>
          <InfoCard />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/info_cards/:infoCardIndex/:infoCardPageIndex">
        <EventPage>
          <InfoCardPage />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/footer">
        <EventPage>
          <Footer />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/footer/:footerLinkIndex">
        <EventPage>
          <FooterLink />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/social">
        <EventPage>
          <SocialMedia />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/sponsors">
        <EventPage>
          <Sponsors />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/sponsors/:sponsorIndex">
        <EventPage>
          <Sponsor />
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
          <Tickets />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/tickets/:ticketClassId">
        <EventPage>
          <TicketClass />
        </EventPage>
      </Route>
      <Route exact path="/events/:eventId/tickets/:ticketClassId/:ticketSKUId">
        <EventPage>
          <TicketSku />
        </EventPage>
      </Route>
      <Route path="*">
        <Redirect to="/" />
      </Route>
    </Switch>
  );
};

export default Events;
