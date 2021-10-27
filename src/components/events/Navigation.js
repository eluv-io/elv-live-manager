import React from "react";
import UrlJoin from "url-join";
import {NavLink, useRouteMatch} from "react-router-dom";

const EventNavigation = () => {
  const match = useRouteMatch();

  if(!match.params.eventId) {
    return null;
  }

  const basePath = UrlJoin("/events", match.params.eventId);

  return (
    <div className="navigation navigation-sub events__navigation">
      <NavLink className="navigation__link navigation__link-back" exact to="/events">All Events</NavLink>
      <NavLink className="navigation__link" exact to={basePath}>Event</NavLink>
      <NavLink className="navigation__link" to={UrlJoin(basePath, "marketplace")}>Marketplace</NavLink>
      <NavLink className="navigation__link" to={UrlJoin(basePath, "nfts")}>NFTs</NavLink>
      <NavLink className="navigation__link" to={UrlJoin(basePath, "media")}>Media</NavLink>
      <NavLink className="navigation__link" to={UrlJoin(basePath, "files")}>Files</NavLink>
    </div>
  );
};

export default EventNavigation;
