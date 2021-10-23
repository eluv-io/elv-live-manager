import React, {useEffect, useState} from "react";
import {Redirect, withRouter} from "react-router-dom";

const ErrorBoundary = withRouter(({location, match, redirectOnError, To, hideOnError, children, className=""}) => {
  const [oldLocation, setOldLocation] = useState(location);
  const [error, setError] = useState(undefined);

  useEffect(() => {
    if(oldLocation.pathname !== location.pathname) {
      setError(undefined);
    }

    setOldLocation(location);
  });

  try {
    if(error) {
      if(redirectOnError) {
        return <Redirect to={To(match)}/>;
      }

      if(hideOnError) {
        return null;
      }

      return (
        <div className={`error-section ${className}`}>
          We're sorry, something went wrong
        </div>
      );
    }

    return children;
  } catch(error) {
    setError(error);

    return null;
  }
});

const ErrorWrapper = Component => (
  props =>
    <ErrorBoundary>
      <Component {...props} />
    </ErrorBoundary>
);

export {
  ErrorBoundary,
  ErrorWrapper
};
