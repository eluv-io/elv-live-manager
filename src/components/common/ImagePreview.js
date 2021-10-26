import React, {useState, useEffect} from "react";
import {observer} from "mobx-preact";
import {editStore} from "Stores";
import UrlJoin from "url-join";

const ImagePreview = observer(({objectId, filePath, children}) => {
  const [baseUrl, setBaseUrl] = useState(undefined);
  const [hovering, setHovering] = useState(false);
  const [clientY, setClientY] = useState(0);

  useEffect(() => {
    // Update base url when write token is created
    editStore.BaseUrl({objectId})
      .then(url => setBaseUrl(url));
  }, [editStore.writeTokens[objectId]]);

  let url;
  if(baseUrl) {
    url = new URL(baseUrl);
    url.pathname = UrlJoin(url.pathname, "files", filePath);
    url = url.toString();
  }

  let style = {};
  if(document.body.offsetHeight - clientY < 250) {
    style.bottom = 0;
  } else if(clientY < document.body.offsetHeight / 1.5) {
    style.top = 0;
  } else {
    style.bottom = -125;
  }

  return (
    <div
      className="image-preview"
      onMouseEnter={event => {
        setClientY(event.clientY);
        setHovering(true);
      }}
      onMouseLeave={() => setHovering(false)}
    >
      { children }
      {
        !url || !hovering ? null :
          <div
            className="image-preview__image-container"
            style={style}
          >
            <img className="image-preview__image" src={url} alt={filePath}/>
          </div>
      }
    </div>
  );
});

export default ImagePreview;

