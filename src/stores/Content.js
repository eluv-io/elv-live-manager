import {flow, computed, makeAutoObservable} from "mobx";
import Utils from "@eluvio/elv-client-js/src/Utils";

class ContentStore {
  tenantObjectId = undefined;
  tenant = undefined;

  get client() {
    return this.rootStore.client;
  }

  get events() {
    return Object.keys(Utils.SafeTraverse(this.tenant, "sites") || {}).map(eventSlug => {
      const event = this.tenant.sites[eventSlug];

      if(!event || !event["."]) {
        return;
      }

      return {
        objectId: Utils.DecodeVersionHash(event["."].source).objectId,
        versionHash: event["."].source,
        slug: eventSlug,
        name: event.display_title
      }
    }).filter(event => event);
  }

  Event(objectId) {
    return this.events.find(event => event.objectId === objectId);
  }

  constructor(rootStore) {
    makeAutoObservable(this,
      {
        client: computed,
        events: computed
      }
    );

    this.rootStore = rootStore;
  }

  Initialize = flow(function * () {
    this.tenantObjectId = yield this.LiveTenantObjectId();

    yield this.LoadTenant();
  });

  LoadTenant = flow(function * () {
    this.tenant = yield this.client.ContentObjectMetadata({
      libraryId: yield this.client.ContentObjectLibraryId({objectId: this.tenantObjectId}),
      objectId: this.tenantObjectId,
      metadataSubtree: "public/asset_metadata",
      select: [
        "sites/*/.",
        "sites/*/display_title",
        "marketplaces/*/.",
        "marketplaces/*/display_title"
      ],
      resolveLinks: true,
      resolveIgnoreErrors: true,
      resolveIncludeSource: true
    });
  });

  LoadEvent = flow(function * ({event}) {
    console.log("LOAD", event);

    if((event.info || {}).marketplace) {
      yield this.LoadMarketplace({marketplaceHash: event.marketplace});
    }
  });

  LoadMarketplace = flow(function * ({marketplace, marketplaceHash}) {
    console.log("LOAD M", marketplace);
  });

  async LatestVersion(v1, v2) {
    const objectId = this.client.utils.DecodeVersionHash(v1).objectId;

    const versionInfo = await this.client.ContentObjectVersions({
      libraryId: await this.client.ContentObjectLibraryId({objectId}),
      objectId
    })

    return ((versionInfo.versions || []).find(info => info.hash === v1 || info.hash === v2) || {}).hash || v1;
  }

  LiveTenantObjectId = flow(function * () {
    const lsKey = `${this.address}-tenantObjectId`;
    if(localStorage.getItem(lsKey)) {
      return localStorage.getItem(lsKey);
    }

    const libraries = yield this.client.ContentLibraries();

    let propertiesLibrary;
    yield Promise.all(
      libraries.map(async libraryId => {
        const name = (await this.client.ContentObjectMetadata({
          libraryId,
          objectId: libraryId.replace(/^ilib/, "iq__"),
          metadataSubtree: "public/name"
        })) || "";

        if(typeof name === "string" && name.includes("Properties")) {
          propertiesLibrary = libraryId;
        }
      })
    );

    if(!propertiesLibrary) {
      throw Error("Unable to find properties library");
    }

    const tenantObjectId = (((yield this.client.ContentObjects({
      libraryId: propertiesLibrary,
      filterOptions: {
        filter: { key: "/public/name", type: "cnt", filter: "Tenant" }
      }
    })).contents || [])[0] || {}).id;

    if(!tenantObjectId) {
      throw Error("Unable to find tenant library");
    }

    localStorage.setItem(lsKey, tenantObjectId);

    return tenantObjectId;
  })
}

export default ContentStore;
