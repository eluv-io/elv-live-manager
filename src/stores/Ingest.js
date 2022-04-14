import {autorun, computed, flow, makeAutoObservable, observable} from "mobx";
import UrlJoin from "url-join";
import {FileInfo} from "../utils/Files";
import {ValidateLibrary} from "@eluvio/elv-client-js/src/Validation";
import abrProfileClear from "./abr-profile-clear.json";
import {rootStore} from "./index";
const ABR = require("@eluvio/elv-abr-profile");
const LRO = require("@eluvio/elv-lro-status");

class IngestStore {
  ingestObjectId = undefined;
  ingestObjects = {};
  ingestErrors = {
    errors: [],
    warnings: []
  };
  drmCert = undefined;

  constructor(rootStore) {
    makeAutoObservable(this, {
      client: computed,
      ingestObjects: observable,
      ingestObject: computed,
      hasDrmCert: computed
    });

    this.rootStore = rootStore;
    this.libraryId = "ilib2EKwfKiG4Z991NPD3cusJvM5Nzhi";
  }

  get client() {
    return this.rootStore.client;
  }

  get hasDrmCert() {
    return this.drmCert;
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
  }

  CreateProductionMaster = flow(function * ({libraryId, type, files, title, encrypt, callback}) {
    ValidateLibrary(libraryId);

    const fileInfo = yield FileInfo("", files);
    const {id, write_token} = yield this.client.CreateContentObject({
      libraryId,
      options: type ? { type } : {}
    });

    this.ingestObjectId = id;
    this.UpdateIngestObject({
      currentStep: "upload"
    });

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

    // Create encryption conk
    yield this.client.CreateEncryptionConk({libraryId, objectId: id, writeToken: write_token, createKMSConk: true});

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
      this.UpdateIngestErrors("errors", "Error: Unable to ingest selected media file. Click the Back button below to try another file.");
    }

    // Check if audio and video streams
    const streams = (yield this.client.ContentObjectMetadata({
      libraryId,
      objectId: id,
      writeToken: write_token,
      metadataSubtree: UrlJoin("production_master", "variants", "default", "streams")
    }));

    if(!streams.audio) {
      this.UpdateIngestErrors("warnings", "Warning: No audio streams found in file.");
    }
    if(!streams.video) {
      this.UpdateIngestErrors("warnings", "Warning: No video streams found in file.")
    }

    // Merge metadata
    yield this.client.MergeMetadata({
      libraryId,
      objectId: id,
      writeToken: write_token,
      metadata: {
        public: {
          name: `${title} [ingest: uploading] MASTER`,
          description: "",
          asset_metadata: {
            title
          }
        },
        reference: true,
        elv_created_at: new Date().getTime()
      },
    });

    // Create ABR Ladder
    const {abrProfile, contentTypeId} = yield this.CreateABRLadder({
      libraryId,
      objectId: id,
      writeToken: write_token
    });

    // Finalize object
    const finalizeResponse = yield this.client.FinalizeContentObject({
      libraryId,
      objectId: id,
      writeToken: write_token,
      commitMessage: "Create master object",
      awaitCommitConfirmation: false
    });

    this.UpdateIngestObject({
      currentStep: "ingest"
    });

    this.CreateABRMezzanine({
      libraryId,
      masterObjectId: finalizeResponse.id,
      type: contentTypeId,
      name: title,
      masterVersionHash: finalizeResponse.hash,
      abrProfile
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

  CreateABRMezzanine = flow(function * ({libraryId, masterObjectId, existingMezId, type, name, description, metadata, masterVersionHash, abrProfile, variant="default", offeringKey="default", writeToken}) {
    try {
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
      console.log("createResponse", createResponse)

      const objectId = createResponse.id;

      const startResponse = yield this.client.StartABRMezzanineJobs({
        libraryId,
        objectId
      });

      const lroIntervalId = setInterval(async () => {
        const statusMap = await this.client.LROStatus({
          libraryId,
          objectId
        });

        if(statusMap === undefined) console.error("Received no job status information from server - object already finalized?");
        const status = statusMap[startResponse.data[0]];
        console.log('status', status);

        const enhancedStatus = LRO.EnhancedStatus(statusMap);

        console.log("enhancedStatus", enhancedStatus);

        this.UpdateIngestObject({
          ingest: {
            runState: status.run_state,
            percentage: status.progress.percentage
          }
        });

        if(status.run_state !== "running") {
          clearInterval(lroIntervalId);

          this.UpdateIngestObject({
            currentStep: "finalize"
          });

          this.FinalizeABRMezzanine({
            libraryId,
            objectId
          });
        };
      }, 10000);
    } catch(error) {
      console.log("Mez error", error)
      this.UpdateIngestErrors("errors", "Error: Unable to transcode selected file. Click the Back button below to try another file.");

      const {write_token} = yield this.client.EditContentObject({
        libraryId,
        objectId: masterObjectId
      });

      yield this.client.MergeMetadata({
        libraryId,
        objectId: masterObjectId,
        writeToken: write_token,
        metadata: {
          public: {
            name: `${name} [ingest: error] MASTER`,
            description: "Unable to transcode file.",
            asset_metadata: {
              name
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
      this.UpdateIngestErrors("errors", "Error: Unable to transcode selected file. Click the Back button below to try another file.");
    }
  });
}

export default IngestStore;
