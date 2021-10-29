import React, {useState, useEffect} from "react";
import {observer} from "mobx-preact";
import {editStore} from "Stores";
import UrlJoin from "url-join";
import ToolTip from "Components/common/ToolTip";

const ImagePreview = observer(({objectId, filePath, children}) => {
  const [baseUrl, setBaseUrl] = useState(undefined);

  useEffect(() => {
    // Update base url when write token is created
    editStore.BaseUrl({objectId})
      .then(url => setBaseUrl(url));
  }, [editStore.writeTokens[objectId]]);

  let url;
  if(baseUrl) {
    url = new URL(baseUrl);
    url.pathname = UrlJoin(url.pathname, "files", filePath);
    url.searchParams.set("width", 800);
    url = url.toString();
  }

  return (
    <ToolTip content={<img className="image-preview__image" src={url} alt={filePath}/>} >
      { children }
    </ToolTip>
  );
});

export default ImagePreview;

