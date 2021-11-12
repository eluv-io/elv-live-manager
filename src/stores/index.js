import {FrameClient} from "@eluvio/elv-client-js/src/FrameClient";
import {configure, flow, makeAutoObservable} from "mobx";
import ContentStore from "Stores/Content";
import EditStore from "Stores/Edit";
import FilesStore from "Stores/Files";

// Force strict mode so mutations are only allowed within actions.
configure({
  enforceActions: "always"
});

class RootStore {
  client = undefined;
  address = undefined;
  networkInfo = undefined;

  navigationBreadcrumbs = [];

  constructor() {
    makeAutoObservable(this);

    this.contentStore = new ContentStore(this);
    this.editStore = new EditStore(this);
    this.filesStore = new FilesStore(this);

    this.Initialize();
  }

  Initialize = flow(function * () {
    this.client = new FrameClient({target: window.parent, timeout: 60});
    this.address = yield this.client.CurrentAccountAddress();
    this.networkInfo = yield this.client.NetworkInfo();

    yield this.contentStore.Initialize();
  });

  SetNavigationBreadcrumbs(breadcrumbs) {
    this.navigationBreadcrumbs = breadcrumbs || [];
  }
}

export const rootStore = new RootStore();
export const contentStore = rootStore.contentStore;
export const editStore = rootStore.editStore;
export const filesStore = rootStore.filesStore;

window.rootStore = rootStore;
