import "Assets/stylesheets/app.scss";

import React from "react";
import { render } from "react-dom";
import { observer} from "mobx-react";

//import { rootStore } from "Stores/index.js";

import {
  HashRouter,
  Switch,
  Route,
  Redirect, withRouter
} from "react-router-dom";
import ScrollToTop from "Components/common/ScrollToTop";
import {ErrorBoundary} from "Components/common/ErrorBoundary";
import TopNavigation from "./components/navigation/TopNavigation";

const Placeholder = ({ text }) => <div>{text}</div>;

const Routes = () => {
  return (
    <Switch>
      <Route exact path="/">
        <Placeholder text="Overview" />
      </Route>
      <Route path="/tenant">
        <Placeholder text="Tenant" />
      </Route>
      <Route path="/events">
        <Placeholder text="Events" />
      </Route>
      <Route path="/marketplaces">
        <Placeholder text="Marketplaces" />
      </Route>
      <Route path="/nfts">
        <Placeholder text="NFTs" />
      </Route>
      <Route path="/media">
        <Placeholder text="Media" />
      </Route>
      <Route path="*">
        <Redirect to="/" />
      </Route>
    </Switch>
  );
};

const CurrentPath = withRouter(({location}) => {
  console.log(location);

  return (
    <div className="current-path">
      { location.pathname }
    </div>
  );
});

const App = observer(() => {
  return (
    <HashRouter>
      <CurrentPath />
      <div className="app-container">
        <TopNavigation />
        <ScrollToTop>
          <ErrorBoundary className="page-container">
            <Routes />
          </ErrorBoundary>
        </ScrollToTop>
      </div>
    </HashRouter>
  );
});


render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>,
  document.getElementById("app")
);
