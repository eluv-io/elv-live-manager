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
