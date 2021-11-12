import React from "react";
import UrlJoin from "url-join";
import {NavLink, useRouteMatch} from "react-router-dom";
import {observer} from "mobx-react";
import {editStore} from "Stores";

const EventNavigation = observer(() => {
  const match = useRouteMatch();

  if(!match.params.eventId) {
    return null;
  }

  const basePath = UrlJoin("/events", match.params.eventId);

  return (
    <div className="navigation navigation-sub events__navigation">
      <NavLink className="navigation__link navigation__link-back" exact to="/events">Back to Events</NavLink>
      <NavLink className="navigation__link" exact to={basePath}>Overview</NavLink>
      <NavLink className="navigation__link" to={UrlJoin(basePath, "basic")}>Basic Info</NavLink>
      <NavLink className="navigation__link" to={UrlJoin(basePath, "main")}>Main Page</NavLink>
      <NavLink className="navigation__link" to={UrlJoin(basePath, "landing")}>Landing Page</NavLink>
      <NavLink className="navigation__link" to={UrlJoin(basePath, "info")}>Info Cards</NavLink>
      <NavLink className="navigation__link" to={UrlJoin(basePath, "footer")}>Footer</NavLink>
      <NavLink className="navigation__link" to={UrlJoin(basePath, "social")}>Sponsors and Social</NavLink>
      <NavLink className="navigation__link" to={UrlJoin(basePath, "tickets")}>Tickets</NavLink>
      <NavLink className="navigation__link" to={UrlJoin(basePath, "drops")}>Drops</NavLink>
      <NavLink className="navigation__link" to={UrlJoin(basePath, "search")}>Search and Analytics</NavLink>
    </div>
  );
});

export default EventNavigation;
