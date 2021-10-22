import React from "react";
import {NavLink} from "react-router-dom";
import ImageIcon from "Components/common/ImageIcon";
import Logo from "Assets/images/logo.svg";

const TopNavigation = () => {
  return (
    <div className="navigation navigation-top">
      <div className="navigation__logo-container">
        <ImageIcon icon={Logo} title="Eluvio" className="navigation__logo" />
      </div>
      <NavLink className="navigation__link" exact to="/">Overview</NavLink>
      <NavLink className="navigation__link" to="/tenant">Tenant</NavLink>
      <NavLink className="navigation__link" to="/events">Events</NavLink>
      <NavLink className="navigation__link" to="/marketplaces">Marketplaces</NavLink>
      <NavLink className="navigation__link" to="/nfts">NFTs</NavLink>
      <NavLink className="navigation__link" to="/media">Media</NavLink>
    </div>
  );
};

export default TopNavigation;
