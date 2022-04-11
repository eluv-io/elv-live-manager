import {autorun, computed, flow, makeAutoObservable, observable} from "mobx";
import {FileInfo} from "../utils/Files";
import UrlJoin from "url-join";
import {ValidateLibrary} from "@eluvio/elv-client-js/src/Validation";
const ABR = require("@eluvio/elv-abr-profile");
import abrProfileClear from "./abr-profile-clear.json";

class IngestStore {
  ingestObjects = {};
  ingestObjectId = "";

  constructor(rootStore) {
    makeAutoObservable(this, {
      client: computed,
      ingestObjects: observable,
      ingestObject: computed
    });

    this.rootStore = rootStore;
    this.libraryId = "ilib2EKwfKiG4Z991NPD3cusJvM5Nzhi";
  }

  get client() {
    return this.rootStore.client;
  }

  get ingestObject() {
    return this.ingestObjects[this.ingestObjectId];
  }

  UpdateIngestObject(data) {
    console.log("data", data)
    this.ingestObjects[this.ingestObjectId] = data;
  }

  CreateProductionMaster = flow(function * ({libraryId, type, files, title, encrypt, callback, OnComplete}) {
    ValidateLibrary(libraryId);

    const fileInfo = yield FileInfo("", files);
    const {id, write_token} = yield this.client.CreateContentObject({
      libraryId,
      options: type ? { type } : {}
    });

    this.ingestObjectId = id;

    // Upload files
    yield this.client.UploadFiles({
      libraryId,
      objectId: id,
      writeToken: write_token,
      fileInfo,
      callback: (progress) => {
        const fileProgress = progress[files[0].path];

        this.UpdateIngestObject({
          uploadPercent: Math.round((fileProgress.uploaded / fileProgress.total) * 100)
        });
      },
      encryption: encrypt ? "cgck" : "none"
    });

    // Create encryption conk
    yield this.client.CreateEncryptionConk({libraryId, objectId: id, writeToken: write_token, createKMSConk: true});

    // Bitcode method
    const { logs, errors, warnings } = yield this.client.CallBitcodeMethod({
      libraryId,
      objectId: id,
      writeToken: write_token,
      method: UrlJoin("media", "production_master", "init"),
      body: {
        access: []
      },
      constant: false
    });
    console.log({logs, errors, warnings})

    // Check if audio and video streams
    const streams = (yield this.client.ContentObjectMetadata({
      libraryId,
      objectId: id,
      writeToken: write_token,
      metadataSubtree: UrlJoin("production_master", "variants", "default", "streams")
    }));

    const streamWarnings = {};
    if(streams && !streams.hasOwnProperty("audio")) {
      streamWarnings.noAudio = true;
    }
    if(streams && !streams.hasOwnProperty("video")) {
      streamWarnings.noVideo = true;
    }

    this.UpdateIngestObject({
      ...this.ingestObject,
      streams
    });

    console.log("Merge Metadata")
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

    console.log("abrProfile", abrProfile)

    console.log("FInalize object")
    // Finalize object
    const finalizeResponse = yield this.client.FinalizeContentObject({
      libraryId,
      objectId: id,
      writeToken: write_token,
      commitMessage: "Create master object",
      awaitCommitConfirmation: false
    });
    console.log("finalizeResponse", finalizeResponse)

    this.UpdateIngestObject({
      ...this.ingestObject,
      ...finalizeResponse
    });

    OnComplete();

    this.CreateABRMezzanine({
      libraryId,
      masterObjectId: finalizeResponse.id,
      type: contentTypeId,
      name: title,
      masterVersionHash: finalizeResponse.hash,
      abrProfile
    });

    return {
      errors: errors || [],
      logs: logs || [],
      warnings: warnings || [],
      streamWarnings,
      ...finalizeResponse
    };
  });

  CreateABRLadder = flow(function * ({libraryId, objectId, writeToken}) {
    const masterMetadata = yield this.client.ContentObjectMetadata({
      libraryId,
      objectId,
      writeToken,
      metadataSubtree: "/production_master"
    });

    // Needed when default profile can be found in library meta
    // const {qid} = yield this.client.ContentLibrary({libraryId});
    // const parentLibraryId = yield this.client.ContentObjectLibraryId({
    //   objectId: qid
    // });
    // const libABRMetadata = yield this.client.ContentObjectMetadata({
    //   libraryId: parentLibraryId,
    //   objectId: qid,
    //   metadataSubtree: "/abr"
    // });

    const libABRMetadata = abrProfileClear.abr;
    const contentTypeId = libABRMetadata.mez_content_type || "hq__KkgmjowhPqV6a4tSdNDfCccFA23RSSiSBggszF4p5s3u4evvZniFkn6fWtZ3AzfkFxxFmSoR2G";
    const libABRProfile = libABRMetadata.default_abr_profile;
    console.log("libABRMeta", libABRMetadata)

    const generatedProfile = ABR.ABRProfileForVariant(
      masterMetadata.sources,
      masterMetadata.variants.default,
      libABRProfile
    );

    if(!generatedProfile.ok) {
      // error
    }

    return {
      abrProfile: generatedProfile.result,
      contentTypeId
    };
  });

  CreateABRMezzanine = flow(function * ({libraryId, masterObjectId, existingMezId, type, name, description, metadata, masterVersionHash, abrProfile, variant="default", offeringKey="default", writeToken, OnComplete}) {
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
    console.log("createResponse", createResponse);

    const objectId = createResponse.id;

    const startResponse = yield this.client.StartABRMezzanineJobs({
      libraryId,
      objectId
    });
    console.log("startResponse", startResponse)

    console.log("data---", startResponse.data, "key---", startResponse.data[0])

    const lroIntervalId = setInterval(async () => {
      const statusMap = await this.client.LROStatus({
        libraryId,
        objectId
      });
      const status = statusMap[startResponse.data[0]];
      console.log('status', status);

      this.UpdateIngestObject({
        ...this.ingestObject,
        ingestRunState: status.run_state,
        ingestPercent: status.progress.percentage
      });

      if(status.run_state !== "running") {
        clearInterval(lroIntervalId);
        this.FinalizeABRMezzanine({
          libraryId,
          objectId
        });
      };

      const eta = status.estimated_time_left_h_m_s;
      if(eta) console.log(eta);
    }, 10000);
  });

  FinalizeABRMezzanine = flow(function * ({libraryId, objectId}) {
    console.log("finalize *****")
    const finalizeAbrResponse = yield this.client.FinalizeABRMezzanine({
      libraryId,
      objectId
    });
    const latestHash = finalizeAbrResponse.hash;
    this.UpdateIngestObject({
      ...this.ingestObject,
      mezzanineHash: latestHash
    });
    console.log("finalizeAbrResponse", finalizeAbrResponse);
  });
}

export default IngestStore;
