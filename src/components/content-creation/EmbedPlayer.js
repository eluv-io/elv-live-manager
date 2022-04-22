import React from "react";

export const GenerateEmbedUrl = ({versionHash, objectId, networkInfo, hasAudio}) => {
  let embedUrl = new URL("https://embed.v3.contentfabric.io");

  embedUrl.searchParams.set("p", "");
  embedUrl.searchParams.set("lp", "");
  embedUrl.searchParams.set("net", networkInfo.name === "demov3" ? "demo" : networkInfo.name);

  if(versionHash) {
    embedUrl.searchParams.set("vid", versionHash);
  } else {
    embedUrl.searchParams.set("oid", objectId);
  }

  if(hasAudio) {
    // NFT has audio, set to autohide controls, audio enabled
    embedUrl.searchParams.set("ct", "s");
  } else {
    embedUrl.searchParams.set("ct", "h");
  }

  return embedUrl.toString();
};

const EmbedPlayer = ({versionHash, objectId, networkInfo, hasAudio}) => {
  return (
    <div className="embed">
      <iframe
        width="854"
        height="480"
        scrolling="no"
        marginHeight="0"
        marginWidth="0"
        frameBorder="0"
        type="text/html"
        src={GenerateEmbedUrl({versionHash, objectId, networkInfo, hasAudio})}></iframe>
    </div>
  );
};

export default EmbedPlayer;
