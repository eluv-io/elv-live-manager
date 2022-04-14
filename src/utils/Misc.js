import {useRouteMatch} from "react-router-dom";
import {useEffect} from "react";
import {rootStore} from "Stores";
import Utils from "@eluvio/elv-client-js/src/Utils";
import {parse as UUIDParse, v4 as UUID} from "uuid";

export const GenerateUUID = () => {
  return Utils.B58(UUIDParse(UUID()));
};

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

export const FormatHoursMinutesSeconds = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor(totalSeconds % 3600 / 60);
  const s = Math.floor(totalSeconds % 3600 % 60);

  const hourDisplay = h > 0 ? h + (h === 1 ? " hour " : " hours ") : "";
  const minuteDisplay = m > 0 ? m + (m === 1 ? " minute " : " minutes ") : "";
  const secondDisplay = s > 0 ? s + (s === 1 ? " second" : " seconds") : "";

  return hourDisplay + minuteDisplay + secondDisplay;
};

export const FormatPriceString = (price, currency, trimZeros) => {
  trimZeros=false;

  if(!price || isNaN(price)) { return; }

  const currentLocale = (navigator.languages && navigator.languages.length) ? navigator.languages[0] : navigator.language;
  let formattedPrice = new Intl.NumberFormat(currentLocale || "en-US", { style: "currency", currency }).format(price);

  if(trimZeros && formattedPrice.endsWith(".00")) {
    formattedPrice = formattedPrice.slice(0, -3);
  }

  return formattedPrice;
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

  keys = keys.filter(key => key);

  let pointer = object;
  keys.forEach((key, index) => {
    if(index === keys.length - 1) {
      pointer[key] = value;
    } else {
      if(
        (
          // Next key looks like an array index
          keys[index + 1] &&
          parseInt(keys[index + 1]).toString() === keys[index + 1]
        ) &&
        (
          // Value is not initialized or it is initialized as empty object
          !pointer[key] ||
          (typeof pointer[key] === "object" && Object.keys(pointer[key]).length === 0)
        )
      ) {
        // Initialize value as an array
        pointer[key] = [];
      } else if(!pointer[key]) {
        pointer[key] = {};
      }

      pointer = pointer[key];
    }
  });
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
