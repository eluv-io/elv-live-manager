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

export const SafeTraverse = (object, ...keys) => {
  if(!object) { return object; }

  // Default: Passed a list of key arguments
  if(keys.length === 1 && Array.isArray(keys[0])) {
    // Passed an array of keys
    keys = keys[0];
  } else if(keys.length === 1 && typeof keys[0] === "string") {
    // Passed a slash delimited path
    keys = keys[0].split("/").filter(element => element);
  }

  let result = object;
  for(let i = 0; i < keys.length; i++){
    result = result[keys[i]];

    if(result === undefined) { return undefined; }
  }

  return result;
};

export const SafeSet = (object, value, ...keys) => {
  if(!object) { return object; }

  // Default: Passed a list of key arguments
  if(keys.length === 1 && Array.isArray(keys[0])) {
    // Passed an array of keys
    keys = keys[0];
  } else if(keys.length === 1 && typeof keys[0] === "string") {
    // Passed a slash delimited path
    keys = keys[0].split("/").filter(element => element);
  }

  let pointer = object;
  keys.forEach((key, index) => {
    if(index === keys.length - 1) {
      pointer[key] = value;
    } else {
      if(!pointer[key]) { pointer[key] = {}; }

      pointer = pointer[key];
    }
  });
};

export const SetFramePath = () => {
  return null;

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
