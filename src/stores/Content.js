import {flow, computed, makeAutoObservable} from "mobx";
import Utils from "@eluvio/elv-client-js/src/Utils";
import {LogError} from "Utils/Misc";

class ContentStore {
  OBJECTS_PER_PAGE = 50;

  contentTypesPromise = undefined;
  libraries = undefined;
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
    // Loading content types takes a while, so start it immediately
    this.contentTypesPromise = this.client.ContentTypes();

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

  LoadLibraries = flow(function * () {
    if(!this.libraries) {
      this.libraries = {};

      const libraryIds = yield this.client.ContentLibraries();
      yield Promise.all(
        libraryIds.map(async libraryId => {
          const name = (await this.client.ContentObjectMetadata({
            libraryId,
            objectId: libraryId.replace(/^ilib/, "iq__"),
            metadataSubtree: "public/name"
          })) || libraryId;

          this.libraries[libraryId] = {
            libraryId,
            name
          }
        })
      );
    }

    return this.libraries;
  });

  LoadObjects = flow(function * ({libraryId, page=1, filter, sortKey="/public/name", sortAsc=true}) {
    const { contents, paging } = yield this.client.ContentObjects({
      libraryId,
      filterOptions: {
        select: [
          "public/name",
          "public/asset_metadata/title",
          "public/asset_metadata/display_title"
        ],
        sort: sortKey,
        start: (page - 1) * this.OBJECTS_PER_PAGE,
        limit: this.OBJECTS_PER_PAGE,
        sortDesc: !sortAsc,
        filter: !filter ? null :
          {
            key: "/public/name",
            type: "cnt",
            filter: filter.toLowerCase()
          }
      }
    });

    const objects = contents.map(({id, versions}) => {
      const versionHash = versions[0].hash;
      const metadata = (versions[0].meta || {});
      const assetMetadata = ((metadata || {}).public || {}).asset_metadata || {};

      return {
        objectId: id,
        versionHash,
        name: (metadata.public || {}).name || id,
        title: assetMetadata.display_title || assetMetadata.title
      }
    });

    return { objects, paging };
  });

  LoadObject = flow(function * ({libraryId, objectId}) {
    const [objectInfo, versions] = yield Promise.all([
      this.client.ContentObject({
        libraryId,
        objectId
      }),
      this.client.ContentObjectVersions({
        libraryId,
        objectId
      })
    ])

    const types = yield this.contentTypesPromise;

    return {
      type: objectInfo.type ? types[Utils.DecodeVersionHash(objectInfo.type).objectId] : null,
      versions: versions.versions.map(version => version.hash)
    };
  });

  async LookupContent(contentId) {
    contentId = contentId.replace(/ /g, "");

    if(!contentId) { return; }

    try {
      let libraryId, objectId, versionHash, latestVersionHash, name, accessType;
      if(contentId.startsWith("ilib")) {
        libraryId = contentId;
        accessType = "library";
      } else if(contentId.startsWith("hq__")) {
        versionHash = contentId;
        objectId = Utils.DecodeVersionHash(contentId).objectId;
      } else if(contentId.startsWith("iq__")) {
        objectId = contentId;
        latestVersionHash = await this.client.LatestVersionHash({objectId});
      } else if(contentId.startsWith("0x")) {
        const id = Utils.AddressToObjectId(contentId);
        accessType = await this.client.AccessType({id});

        if(accessType === "library") {
          libraryId = Utils.AddressToLibraryId(contentId);
        } else {
          objectId = id;
        }
      } else {
        objectId = Utils.AddressToObjectId(Utils.HashToAddress(contentId));
      }

      if(objectId && !libraryId) {
        libraryId = await this.client.ContentObjectLibraryId({objectId});
      }

      if(!accessType) {
        accessType = await this.client.AccessType({id: objectId});
      }

      if(objectId) {
        name = await this.client.ContentObjectMetadata({
          versionHash: versionHash || latestVersionHash,
          metadataSubtree: "public/name"
        });
      }

      if(accessType === "library") {
        return { libraryId };
      } else if(accessType === "object") {
        return { name, libraryId, objectId, versionHash, latestVersionHash };
      }

      throw Error(`Unsupported type '${accessType}'`);
    } catch(error) {
      LogError("Failed to look up ID:", error);

      return {};
    }
  }

  LiveTenantObjectId = flow(function * () {
    const lsKey = `${this.rootStore.networkInfo.name}-${this.rootStore.address}-tenantObjectId`;
    if(localStorage.getItem(lsKey)) {
      return localStorage.getItem(lsKey);
    }

    const libraries = yield this.LoadLibraries();
    const propertiesLibrary = Object.values(libraries)
      .find(library => typeof library.name === "string" && library.name.includes("Properties"))

    if(!propertiesLibrary) {
      throw Error("Unable to find properties library");
    }

    const tenantObjectId = (((yield this.client.ContentObjects({
      libraryId: propertiesLibrary.libraryId,
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
