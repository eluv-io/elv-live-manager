import {FrameClient} from "@eluvio/elv-client-js/src/FrameClient";
import {configure, flow, makeAutoObservable} from "mobx";
import ContentStore from "Stores/Content";

// Force strict mode so mutations are only allowed within actions.
configure({
  enforceActions: "always"
});

class RootStore {
  client = undefined;
  address = undefined;
  networkInfo = undefined;

  constructor() {
    makeAutoObservable(this);

    this.Initialize();
  }

  Initialize = flow(function * () {
    this.client = new FrameClient({target: window.parent, timeout: 60});
    this.address = yield this.client.CurrentAccountAddress();
    this.networkInfo = yield this.client.NetworkInfo();

    this.contentStore = new ContentStore(this);

    yield this.contentStore.Initialize();
  });
}

export const rootStore = new RootStore();
export const contentStore = rootStore.contentStore;

window.rootStore = rootStore;
