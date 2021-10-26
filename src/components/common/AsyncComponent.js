import React, {useState, useEffect} from "react";
import {PageLoader} from "Components/common/Loader";
import {observer} from "mobx-preact";

const AsyncComponent = observer(({Load, children, Render, className=""}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(undefined);

  useEffect(() => {
    Load()
      .then(() => setLoaded(true))
      .catch(error => {
        console.error(error);
        setError(error);
      });
  }, []);

  if(error) {
    return (
      <div className={`page-container error-container ${className}`}>
        We're sorry, something went wrong
      </div>
    );
  }

  if(!loaded) {
    return <PageLoader className={className} />;
  }

  if(Render) {
    return Render();
  }

  return children;
});

export default AsyncComponent;
