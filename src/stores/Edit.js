import {flow, computed, makeAutoObservable, makeObservable, observable} from "mobx";

class EditStore {
  files = {};
  writeTokens = {};
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

  async BaseUrl({objectId}) {
    const libraryId = await this.client.ContentObjectLibraryId({objectId});
    return await this.client.FabricUrl({
      libraryId,
      objectId,
      writeToken: this.writeTokens[objectId]
    })
  }

  CreateDirectory = flow(function * ({objectId, directory}) {
    const libraryId = yield this.client.ContentObjectLibraryId({objectId});
    yield this.client.CreateFileDirectories({
      libraryId,
      objectId,
      writeToken: yield this.WriteToken({objectId}),
      filePaths: [directory]
    });

    yield this.Files({objectId, force: true});
  });

  UploadFiles = flow(function * ({objectId, fileInfo, callback}) {
    const libraryId = yield this.client.ContentObjectLibraryId({objectId});
    yield this.client.UploadFiles({
      libraryId,
      objectId,
      writeToken: yield this.WriteToken({objectId}),
      fileInfo,
      encryption: "none",
      callback: !callback ? undefined :
        status => {
          let uploaded = 0;
          let total = 1;
          Object.values(status).forEach(item => {
            uploaded += item.uploaded;
            total += item.total;
          })

          callback(100 * uploaded / total);
        }
    });

    yield this.Files({objectId, force: true});
  });

  Files = flow(function * ({objectId, force=false}) {
    if(!this.files[objectId] || force) {
      const libraryId = yield this.client.ContentObjectLibraryId({objectId});
      this.files[objectId] = (yield this.client.ContentObjectMetadata({
        libraryId,
        objectId,
        writeToken: this.writeTokens[objectId],
        select: [
          "files",
          "mime-types"
        ]
      })) || {};
    }

    return this.files[objectId];
  });

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
}

export default EditStore;
