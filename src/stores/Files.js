import {flow, computed, makeAutoObservable, makeObservable, observable} from "mobx";

class FilesStore {
  files = {};

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
      writeToken: await this.rootStore.editStore.WriteToken({objectId})
    })
  }

  CreateDirectory = flow(function * ({objectId, directory}) {
    const libraryId = yield this.client.ContentObjectLibraryId({objectId});
    yield this.client.CreateFileDirectories({
      libraryId,
      objectId,
      writeToken: yield yield this.rootStore.editStore.WriteToken({objectId}),
      filePaths: [directory]
    });

    yield this.Files({objectId, force: true});
  });

  UploadFiles = flow(function * ({objectId, fileInfo, callback}) {
    const libraryId = yield this.client.ContentObjectLibraryId({objectId});
    yield this.client.UploadFiles({
      libraryId,
      objectId,
      writeToken: yield yield this.rootStore.editStore.WriteToken({objectId}),
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
        writeToken: yield this.rootStore.editStore.WriteToken({objectId}),
        select: [
          "files",
          "mime-types"
        ]
      })) || {};
    }

    return this.files[objectId];
  });

  DeleteFile = flow(function * ({objectId, path}) {
    const libraryId = yield this.client.ContentObjectLibraryId({objectId});
    yield this.client.DeleteFiles({
      libraryId,
      objectId,
      writeToken: yield yield this.rootStore.editStore.WriteToken({objectId}),
      filePaths: [ path ]
    })

    yield this.Files({objectId, force: true});
  });
}

export default FilesStore;
