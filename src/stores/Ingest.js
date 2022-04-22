import {computed, flow, makeAutoObservable, observable} from "mobx";
import UrlJoin from "url-join";
import {FileInfo} from "../utils/Files";
import {ValidateLibrary} from "@eluvio/elv-client-js/src/Validation";
import {rootStore} from "./index";
import {GenerateEmbedUrl} from "../components/content-creation/EmbedPlayer";
const ABR = require("@eluvio/elv-abr-profile");
const LRO = require("@eluvio/elv-lro-status");

class IngestStore {
  ingestObjectId = undefined;
  ingestObjects = {};
  ingestErrors = {
    errors: [],
    warnings: []
  };

  constructor(rootStore) {
    makeAutoObservable(this, {
      client: computed,
      ingestObjects: observable,
      ingestObject: computed
    });

    this.rootStore = rootStore;
    this.libraryId = "ilib4VkoL3vt75eWwvjHqqyyzxwExWV9";
  }

  get client() {
    return this.rootStore.client;
  }

  get ingestObject() {
    return this.ingestObjects[this.ingestObjectId];
  }

  get ingestErrors() {
    return this.ingestErrors;
  }

  UpdateIngestObject = (data) => {
    if(!this.ingestObjects[this.ingestObjectId]) {
      this.ingestObjects[this.ingestObjectId] = {
        currentStep: "",
        upload: {},
        ingest: {},
        finalize: {}
      };
    }

    this.ingestObjects[this.ingestObjectId] = Object.assign(
      this.ingestObjects[this.ingestObjectId],
      data
    );
  }

  UpdateIngestErrors = (type, message) => {
    this.ingestErrors[type].push(message);
  }

  ResetIngestForm = () => {
    this.ingestObjectId = "";
    this.ingestErrors = {
      errors: [],
      warnings: []
    };
    rootStore.editStore.SetValue(this.libraryId, "enable_drm");
    rootStore.editStore.SetValue(this.libraryId, "title");
    rootStore.editStore.SetValue(this.libraryId, "description");
    rootStore.editStore.SetValue(this.libraryId, "display_name");
  }

  CreateLink({targetHash, linkTarget="/meta/public/asset_metadata", options={}}) {
    if(!targetHash) {
      return {
        ...options,
        ".": {
          ...(options["."] || {}),
          "auto_update":{"tag":"latest"}
        },
        "/": UrlJoin("./", linkTarget)
      };
    } else {
      return {
        ...options,
        ".": {
          ...(options["."] || {}),
          "auto_update":{"tag":"latest"}
        },
        "/": UrlJoin("/qfab", targetHash, linkTarget)
      };
    }
  }

  NetworkInfo = flow (function * () {
    return yield this.client.NetworkInfo();
  });

  WaitForPublish = flow (function * ({latestHash, libraryId, objectId}) {
    let publishFinished = false;
    let latestObjectData = {};
    while(!publishFinished) {
      latestObjectData = yield this.client.ContentObject({
        libraryId, objectId
      });

      if(latestObjectData.hash === latestHash) {
        publishFinished = true;
      } else {
        yield new Promise(resolve => setTimeout(resolve, 15000));
      }
    }
  });

  CreateProductionMaster = flow(function * ({libraryId, files, title, encrypt, description, displayName, images, callback, CreateCallback}) {
    ValidateLibrary(libraryId);

    const fileInfo = yield FileInfo("", files);
    const {qid} = yield this.client.ContentLibrary({libraryId});
    const libABRMetadata = yield this.client.ContentObjectMetadata({
      libraryId: yield this.client.ContentObjectLibraryId({objectId: qid}),
      objectId: qid,
      metadataSubtree: "/abr"
    });

    const {id, write_token} = yield this.client.CreateContentObject({
      libraryId,
      options: libABRMetadata.mez_content_type ? { type: libABRMetadata.mez_content_type } : {}
    });

    this.ingestObjectId = id;
    this.UpdateIngestObject({
      currentStep: "upload"
    });

    if(CreateCallback && typeof CreateCallback === "function") CreateCallback();

    // Create encryption conk
    yield this.client.CreateEncryptionConk({libraryId, objectId: id, writeToken: write_token, createKMSConk: true});

    // Upload files
    yield this.client.UploadFiles({
      libraryId,
      objectId: id,
      writeToken: write_token,
      fileInfo,
      callback: (progress) => {
        const fileProgress = progress[files[0].path];

        this.UpdateIngestObject({
          upload: {
            percentage: Math.round((fileProgress.uploaded / fileProgress.total) * 100)
          }
        });
      },
      encryption: encrypt ? "cgck" : "none"
    });

    // Set public permission
    yield this.client.SetPermission({
      objectId: id,
      permission: "public"
    })

    // Bitcode method
    const {errors} = yield this.client.CallBitcodeMethod({
      libraryId,
      objectId: id,
      writeToken: write_token,
      method: UrlJoin("media", "production_master", "init"),
      body: {
        access: []
      },
      constant: false
    });

    if(errors) {
      console.error(errors);
      this.UpdateIngestErrors("errors", "Error: Unable to ingest selected media file. Click the Back button below to try another file.");
    }

    // Check if audio and video streams
    const streams = (yield this.client.ContentObjectMetadata({
      libraryId,
      objectId: id,
      writeToken: write_token,
      metadataSubtree: UrlJoin("production_master", "variants", "default", "streams")
    }));

    this.UpdateIngestObject({
      upload: {
        ...this.ingestObject.upload,
        streams: Object.keys(streams || {})
      }
    });

    this.UpdateIngestObject({
      currentStep: "ingest"
    });

    // Merge metadata
    yield this.client.MergeMetadata({
      libraryId,
      objectId: id,
      writeToken: write_token,
      metadata: {
        public: {
          name: `${title} [ingest: uploading] MASTER`,
          description,
          asset_metadata: {
            display_title: `${title} [ingest: uploading] MASTER`
          }
        },
        reference: true,
        elv_created_at: new Date().getTime()
      },
    });

    // Create ABR Ladder
    let {abrProfile, contentTypeId} = yield this.CreateABRLadder({
      libraryId,
      objectId: id,
      writeToken: write_token
    });

    // Update name to remove [ingest: uploading]
    yield this.client.MergeMetadata({
      libraryId,
      objectId: id,
      writeToken: write_token,
      metadata: {
        public: {
          name: `${title} MASTER`,
          description,
          asset_metadata: {
            display_title: `${title} MASTER`
          }
        },
        reference: true,
        elv_created_at: new Date().getTime()
      },
    });

    // Finalize object
    const finalizeResponse = yield this.client.FinalizeContentObject({
      libraryId,
      objectId: id,
      writeToken: write_token,
      commitMessage: "Create master object",
      awaitCommitConfirmation: false
    });

    let abrProfileExclude;
    if(encrypt) {
      abrProfileExclude = ABR.ProfileExcludeClear(abrProfile);
    } else {
      abrProfileExclude = ABR.ProfileExcludeDRM(abrProfile);
    }

    if(abrProfileExclude.ok) {
      abrProfile = abrProfileExclude.result;
    } else {
      this.UpdateIngestErrors("errors", "Error: ABR Profile has no relevant playout formats.")
    }

    this.CreateABRMezzanine({
      libraryId,
      existingMezId: finalizeResponse.id,
      masterObjectId: finalizeResponse.id,
      type: contentTypeId,
      name: title,
      description: description,
      displayName,
      masterVersionHash: finalizeResponse.hash,
      abrProfile,
      images
    });
  });

  CreateABRLadder = flow(function * ({libraryId, objectId, writeToken}) {
    try {
      const {qid} = yield this.client.ContentLibrary({libraryId});
      const libABRMetadata = yield this.client.ContentObjectMetadata({
        libraryId: yield this.client.ContentObjectLibraryId({objectId: qid}),
        objectId: qid,
        metadataSubtree: "/abr"
      });

      if(!libABRMetadata || !libABRMetadata.default_profile || !libABRMetadata.mez_content_type) {
        this.UpdateIngestErrors("errors", "Error: Library is not set up for ingesting media files.");
        return;
      }

      const {production_master} = yield this.client.ContentObjectMetadata({
        libraryId,
        objectId,
        writeToken,
        select: [
          "production_master/sources",
          "production_master/variants/default"
        ]
      });

      if(!production_master || !production_master.sources || !production_master.variants || !production_master.variants.default) {
        this.UpdateIngestErrors("errors", "Error: Unable to create ABR profile. Click the Back button below to try another file.");
        return;
      }

      const generatedProfile = ABR.ABRProfileForVariant(
        production_master.sources,
        production_master.variants.default,
        libABRMetadata.default_profile
      );

      if(!generatedProfile.ok) {
        this.UpdateIngestErrors("errors", "Error: Unable to create ABR profile. Click the Back button below to try another file.");
        return;
      }

      return {
        abrProfile: generatedProfile.result,
        contentTypeId: libABRMetadata.mez_content_type
      };
    } catch(error) {
      console.error(error);
      this.UpdateIngestErrors("errors", "Error: Unable to create ABR profile. Click the Back button below to try another file.");
    }
  });

  CreateABRMezzanine = flow(function * ({
    libraryId,
    masterObjectId,
    existingMezId,
    type,
    name,
    description,
    displayName,
    metadata,
    images,
    masterVersionHash,
    abrProfile,
    variant="default",
    offeringKey="default",
    writeToken
  }) {
    const createResponse = yield this.client.CreateABRMezzanine({
        libraryId,
        type,
        name: `${name} [ingest: transcoding] MEZ`,
        masterVersionHash,
        existingMezId,
        abrProfile,
        variant,
        offeringKey
      });
    const objectId = createResponse.id;

    yield this.WaitForPublish({
      latestHash: createResponse.hash,
      libraryId,
      objectId
    });

    // Set public permission
    yield this.client.SetPermission({
      objectId,
      permission: "public"
    });

    try {
      const { writeToken, hash } = yield this.client.StartABRMezzanineJobs({
        libraryId,
        objectId
      });

      yield this.WaitForPublish({
        latestHash: hash,
        libraryId,
        objectId
      });

      yield this.client.UploadFiles({
        libraryId,
        objectId: createResponse.id,
        writeToken,
        fileInfo: yield FileInfo("", images),
        encryption: "none"
      });

      // Upload image and use as
      const filesMetadata = yield this.client.ContentObjectMetadata({
        libraryId,
        objectId: createResponse.id,
        writeToken,
        metadataSubtree: "/files"
      });
      const imagePath = Object.keys(filesMetadata).find(key => key !== ".")

      const image = "https://demov3.net955210.contentfabric.io/s/demov3" + this.CreateLink({
        targetHash: hash,
        linkTarget: UrlJoin("files", imagePath)
      })["/"];

      let done;
      let statusIntervalId;

      while(!done) {
        let statusMap = yield this.client.LROStatus({
          libraryId,
          objectId
        });

        if(statusMap === undefined) console.error("Received no job status information from server - object already finalized?");

        if(statusIntervalId) clearInterval(statusIntervalId);
        statusIntervalId = setInterval( async () => {
          const currentTime = new Date();
          const enhancedStatus = LRO.EnhancedStatus(statusMap, currentTime);

          const {estimated_time_left_seconds, estimated_time_left_h_m_s, run_state} = enhancedStatus.result.summary;

          this.UpdateIngestObject({
            ingest: {
              runState: enhancedStatus.result.summary.run_state,
              estimatedTimeLeft: !estimated_time_left_seconds ? "Calculating time to complete..." : estimated_time_left_h_m_s
            }
          });

          if(run_state !== "running") {
            clearInterval(statusIntervalId);
            done = true;

            const embedUrl = GenerateEmbedUrl({
              objectId: this.ingestObjectId,
              networkInfo: await this.client.NetworkInfo(),
              hasAudio: this.ingestObject.upload.streams.includes("audio")
            });

            await this.client.MergeMetadata({
              libraryId,
              objectId,
              writeToken,
              metadata: {
                public: {
                  name: `${name} MEZ`,
                  description,
                  asset_metadata: {
                    display_title: `${name} MEZ`,
                      nft: {
                        name,
                        display_name: displayName,
                        description,
                        created_at: new Date(),
                        playable: true,
                        has_audio: this.ingestObject.upload.streams.includes("audio"),
                        embed_url: embedUrl,
                        external_url: embedUrl,
                        image
                      }
                  }
                }
              }
            });

            this.FinalizeABRMezzanine({
              libraryId,
              objectId,
              writeToken,
              name
            });
          };
        }, 1000);

        yield new Promise(resolve => setTimeout(resolve, 15000));
      }
    } catch(error) {
      console.error(error)
      this.UpdateIngestErrors("errors", "Error: Unable to transcode selected file. Click the Back button below to try another file.");

      const {write_token} = yield this.client.EditContentObject({
        libraryId,
        objectId: masterObjectId
      });

      yield this.client.MergeMetadata({
        libraryId,
        objectId,
        writeToken: createResponse.write_token,
        metadata: {
          public: {
            name: `${name} [ingest: error] MASTER`,
            description: "Unable to transcode file.",
            asset_metadata: {
              display_title: `${name} [ingest: error] MASTER`
            }
          },
          reference: true,
          elv_created_at: new Date().getTime()
        },
      });

      yield this.client.FinalizeContentObject({
        libraryId,
        objectId: masterObjectId,
        writeToken: write_token,
        commitMessage: "Create master object",
        awaitCommitConfirmation: false
      });
    }
  });

  FinalizeABRMezzanine = flow(function * ({libraryId, objectId}) {
    this.UpdateIngestObject({
      currentStep: "finalize"
    });

    try {
      const finalizeAbrResponse = yield this.client.FinalizeABRMezzanine({
        libraryId,
        objectId
      });
      const latestHash = finalizeAbrResponse.hash;
      this.UpdateIngestObject({
        finalize: {
          mezzanineHash: latestHash
        }
      });
    } catch(error) {
      console.error(error);
      this.UpdateIngestErrors("errors", "Error: Unable to transcode selected file. Click the Back button below to try another file.");
    }
  });
}

export default IngestStore;
