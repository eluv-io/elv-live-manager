import {useRouteMatch} from "react-router-dom";
import {useEffect} from "react";
import {rootStore} from "Stores";

export const LogMessage = message => {
  console.log(message);
};

export const LogError = (message, error) => {
  console.error(message);

  if(error) {
    console.error(error);
  }
};

export const onEnterPressed = (fn) => {
  return (event) => {
    if(event.key && event.key.toLowerCase() !== "enter") {
      return;
    }

    fn(event);
  };
};

export const SetFramePath = () => {
  const match = useRouteMatch();

  useEffect(() => {
    if(rootStore.client) {
      rootStore.client.SendMessage({
        options: {
          operation: "SetFramePath",
          path: `/#${match.url}`
        }
      });
    }
  });

  return null;
};
