import "Assets/stylesheets/app.scss";

import React from "react";
import { render } from "react-dom";
import { observer } from "mobx-react";
import {rootStore} from "Stores";

window.js = content => console.log(JSON.stringify(content, null, 2));

import {
  HashRouter,
  Switch,
  Route,
  Redirect
} from "react-router-dom";
import ScrollToTop from "Components/common/ScrollToTop";
import {ErrorBoundary} from "Components/common/ErrorBoundary";
import TopNavigation from "./components/navigation/TopNavigation";
import Events from "Components/events";
import {MuiPickersUtilsProvider} from "@material-ui/pickers";
import LuxonUtils from "@date-io/luxon";
import Breadcrumbs from "Components/navigation/Breadcrumbs";
import ContentCreation from "./components/content-creation";

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
        <Events />
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
      <Route path="/ingest">
        <ContentCreation />
      </Route>
      <Route path="*">
        <Redirect to="/" />
      </Route>
    </Switch>
  );
};

const App = observer(() => {
  return (
    <MuiPickersUtilsProvider utils={LuxonUtils}>
      <HashRouter>
        <div className="app-container">
          <TopNavigation />
          <ScrollToTop>
            <ErrorBoundary className="page-container">
              <Routes />
            </ErrorBoundary>
          </ScrollToTop>
        </div>
      </HashRouter>
    </MuiPickersUtilsProvider>
  );
});

render(
  <React.StrictMode>
    <App/>
  </React.StrictMode>,
  document.getElementById("app")
);
