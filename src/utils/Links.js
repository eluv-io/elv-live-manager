import Utils from "@eluvio/elv-client-js/src/Utils";
import UrlJoin from "url-join";

export const SetUrlPath = (baseUrl, path) => {
  const url = new URL(baseUrl);
  url.pathname = UrlJoin(url.pathname, path);

  return url.toString();
} ;

export const LinkComponents = (link, baseHash) => {
  try {
    if(link && typeof link === "string") {
      // Object ID
      if(link.startsWith("hq__")) {
        return { objectId: Utils.DecodeVersionHash(link).objectId, targetHash: link, path: "" };
      }

      // URL
      let path = new URL(link).pathname;

      let domain = rootStore.networkInfo.name;
      if(path.startsWith("/s")) {
        domain = path.match(/\/s\/([^\/]+)\//)[1];

        // Remove /s/<domain>/
        path = path.replace(/\/s\/[^\/]+\//, "");
      }

      path = path.replace(/^\/+/g, "");

      let libraryId, objectId, versionHash;
      if(path.startsWith("qlibs")) {
        const parsed = path.match(/qlibs\/([^\/]+)\/q\/([^\/]+)\/(.+)/);
        libraryId = parsed[1];

        if(parsed[2].startsWith("iq__")) {
          objectId = parsed[2];
        } else {
          versionHash = parsed[2];
        }

        path = parsed[3];
      } else {
        const parsed = path.match(/q\/([^\/]+)\/(.+)/);
        versionHash = parsed[1];
        path = parsed[2];
      }

      path = path.startsWith("meta") ? path.replace(/^meta\//, "") : path.replace(/^files\//, "");

      return {
        domain,
        libraryId,
        objectId,
        targetHash: versionHash,
        path
      };
    }

    if(!link || !link["/"]) {
      return;
    }

    let targetHash = baseHash;
    let path = link["/"].replace(/^\.\/files\//, "");
    if(link["/"].startsWith("/qfab/") || link["/"].startsWith("/q/")) {
      targetHash = link["/"].split("/")[2];
      path = link["/"].split("/").slice(4).join("/");
    }

    return { objectId: Utils.DecodeVersionHash(targetHash).objectId, targetHash, path };
  } catch(error) {
    // eslint-disable-next-line no-console
    console.error("Failed to parse link", link);
    // eslint-disable-next-line no-console
    console.error(error);
  }
};
