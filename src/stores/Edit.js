import {flow, computed, makeAutoObservable, makeObservable, observable} from "mobx";
import {SafeSet, SafeTraverse} from "Utils/Misc";
import UrlJoin from "url-join";
import Utils from "@eluvio/elv-client-js/src/Utils";

class EditStore {
  currentLocalization = "default";
  writeTokens = {};

  edits = {}
  originalMetadata = {};
  updatedMetadata = {};

  /*
    writeTokens = {
      "iq__33aasCButcoYPfkkgaS92rzwNCtP": "tqw__HSVndP9Pv5aZbmr9cCrD7Mm1GorsnT6ZMrZ9oxrfkfBU5hzq1ZMvow33h58GMMrxfWHfx3xnuxe6wyNuXhE"
    };

   */

  get client() {
    return this.rootStore.client;
  }

  constructor(rootStore) {
    makeAutoObservable(this);

    this.rootStore = rootStore;
  }

  LoadMetadata = flow(function * ({objectId, versionHash}) {
    if(this.originalMetadata[objectId]) { return; }

    if(!objectId) {
      objectId = Utils.DecodeVersionHash(versionHash).objectId;
    } else if(!versionHash) {
      versionHash = yield this.client.LatestVersionHash({objectId});
    }

    this.originalMetadata[objectId] = yield this.client.ContentObjectMetadata({
      versionHash,
      metadataSubtree: "/public/asset_metadata"
    });
  });

  // TODO: Option for no localize
  Value(objectId, path, name, options={}) {
    const localizationKey = options.localize ? this.currentLocalization : "default";

    const updatedValue = SafeTraverse((this.updatedMetadata[objectId] || {})[localizationKey], UrlJoin(path || "", name || ""));

    if(typeof updatedValue !== "undefined") {
      return updatedValue;
    }

    if(localizationKey === "default") {
      return SafeTraverse((this.originalMetadata[objectId] || {}), UrlJoin(path || "", name || ""));
    } else {
      return SafeTraverse((this.originalMetadata[objectId] || {}), UrlJoin("localizations", localizationKey, path || "", name || ""));
    }
  }

  SetValue(objectId, path, name, value, options={}) {
    const localizationKey = options.localize ? this.currentLocalization : "default";

    SafeSet(
      this.updatedMetadata,
      value,
      [
        objectId,
        localizationKey,
        ...path.split("/").filter(element => element),
        name
      ]
    );

    SafeSet(
      this.edits,
      { objectId, path: UrlJoin(path, name), value, localization: localizationKey },
      [ objectId, this.currentLocalization, UrlJoin(path, name) ]
    )
  }

  async BaseUrl({objectId}) {
    const libraryId = await this.client.ContentObjectLibraryId({objectId});
    return await this.client.FabricUrl({
      libraryId,
      objectId,
      writeToken: this.writeTokens[objectId]
    })
  }

  WriteToken = flow (function * ({objectId}) {
    if(!this.writeTokens[objectId]) {
      const { writeToken } = yield this.client.EditContentObject({
        libraryId: yield this.client.ContentObjectLibraryId({objectId}),
        objectId
      });

      this.writeTokens[objectId] = writeToken;
    }

    return this.writeTokens[objectId];
  });

  SetLocalization(code) {
    this.currentLocalization = code;
  }
}

export default EditStore;
