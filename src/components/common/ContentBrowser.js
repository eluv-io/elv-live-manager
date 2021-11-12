import React, {useEffect, useState} from "react";
import Modal from "Components/common/Modal";
import AsyncComponent from "Components/common/AsyncComponent";
import {contentStore} from "Stores";
import {observer} from "mobx-react";

import SearchIcon from "Assets/icons/search.svg";
import ImageIcon from "Components/common/ImageIcon";
import {onEnterPressed} from "Utils/Misc";

const ContentLookup = ({Select}) => {
  const [value, setValue] = useState("");
  const Lookup = async () => {
    Select(await contentStore.LookupContent(value));
    setValue("");
  };

  return (
    <div className="actions-container content-browser__lookup">
      <input
        className="action-input content-browser__lookup-input"
        value={value}
        onChange={event => setValue(event.target.value)}
        onKeyDown={onEnterPressed(Lookup)}
        placeholder="Find content by ID, hash, or address"
      />
      <button className="content-browser__lookup-button" onClick={Lookup}>
        <ImageIcon
          title="Find Content"
          icon={SearchIcon}
          className="content-browser__lookup-button-icon"
        />
      </button>
    </div>
  );
};

let pageTimeout, filterTimeout;
const Controls = ({filter, setFilter, page, setPage, totalPages}) => {
  const [ tempFilter, setTempFilter ] = useState(filter);
  const [ tempPage, setTempPage ] = useState(page);

  useEffect(() => {
    setTempPage(page);
    setTempFilter(filter);
  }, [filter, page, totalPages]);

  const UpdatePage = page => {
    clearTimeout(pageTimeout);
    setTempPage(page);
    pageTimeout = setTimeout(() => {
      setPage(page);
    }, 300);
  };

  return (
    <div className="actions-container content-browser__controls">
      <input
        value={tempFilter}
        onChange={event => {
          clearTimeout(filterTimeout);
          setTempFilter(event.target.value);
          filterTimeout = setTimeout(() => {
            setPage(1);
            setTempFilter(event.target.value);
            setFilter(event.target.value);
          }, 750);
        }}
        className="action-input content-browser__filter"
        placeholder="Filter..."
      />
      <div className="content-browser__page-controls">
        <button
          className="content-browser__page-button"
          disabled={page <= 1}
          onClick={() => UpdatePage(tempPage - 1)}
        >
          { "<" }
        </button>
        <div className="content-browser__page">
          { Math.min(tempPage, totalPages) } / { totalPages }
        </div>
        <button
          className="content-browser__page-button"
          disabled={page >= totalPages}
          onClick={() => UpdatePage(tempPage + 1)}
        >
          { ">" }
        </button>
      </div>
    </div>
  );
};

const VersionBrowser = observer(({libraryId, objectId, Select}) => {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [versions, setVersions] = useState([]);

  return (
    <>
      <Controls filter={filter} setFilter={setFilter} page={page} setPage={setPage} totalPages={totalPages} />
      <AsyncComponent
        key={`version-browser-${libraryId}-${objectId}`}
        Load={async () => {
          await contentStore.LoadLibraries();
          const objectInfo = await contentStore.LoadObject({libraryId, objectId});

          setVersions(objectInfo.versions);
          setTotalPages(Math.ceil(objectInfo.versions.length / contentStore.OBJECTS_PER_PAGE));
        }}
      >
        <div className="list content-list content-list-versions">
          {
            (versions || [])
              .filter(versionHash => !filter || versionHash.includes(filter))
              .slice((page - 1) * contentStore.OBJECTS_PER_PAGE, page * contentStore.OBJECTS_PER_PAGE)
              .map(versionHash =>
                <button onClick={() => Select(versionHash)} className="list__item content-list__item" key={`version-${versionHash}`}>
                  { versionHash }
                </button>
              )
          }
        </div>
      </AsyncComponent>
    </>
  );
});

const ObjectBrowser = observer(({libraryId, Select}) => {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [objects, setObjects] = useState([]);

  return (
    <>
      <Controls filter={filter} setFilter={setFilter} page={page} setPage={setPage} totalPages={totalPages} />
      <AsyncComponent
        key={`object-browser-${libraryId}-${page}-${filter}`}
        Load={async () => {
          await contentStore.LoadLibraries();
          const { objects, paging } = await contentStore.LoadObjects({libraryId, filter, page});

          setPage(page);
          setTotalPages(paging.pages);
          setObjects(objects);
        }}
      >
        <div className="list content-list content-list-objects">
          {
            (objects || [])
              .map(({objectId, versionHash, name, playable, title}) =>
                <button title={title} onClick={() => Select({name, playable, objectId, versionHash})} className="list__item content-list__item" key={`object-${objectId}`}>
                  { name }
                </button>
              )
          }
        </div>
      </AsyncComponent>
    </>
  );
});

const LibraryBrowser = observer(({Select}) => {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  return (
    <>
      <Controls filter={filter} setFilter={setFilter} page={page} setPage={setPage} totalPages={totalPages} />
      <AsyncComponent
        Load={async () => {
          await contentStore.LoadLibraries();
          setPage(1);
          setTotalPages(Math.ceil(Object.keys(contentStore.libraries).length / contentStore.OBJECTS_PER_PAGE));
        }}
      >
        <div className="list content-list content-list-libraries">
          {
            Object.values(contentStore.libraries || {})
              .filter(({name}) => !filter || (name || "").toLowerCase().includes(filter))
              .sort((a, b) => (a.name || "").toLowerCase() < (b.name || "").toLowerCase() ? -1 : 1)
              .slice((page - 1) * contentStore.OBJECTS_PER_PAGE, page * contentStore.OBJECTS_PER_PAGE)
              .map(({libraryId, name}) =>
                <button onClick={() => Select(libraryId)} className="list__item content-list__item" key={`library-${libraryId}`}>
                  { name }
                </button>
              )
          }
        </div>
      </AsyncComponent>
    </>
  );
});

const ContentBrowser = observer(({header, Select, Close, requireVersion=false}) => {
  const [libraryId, setLibraryId] = useState("");
  const [objectId, setObjectId] = useState("");
  const [objectName, setObjectName] = useState("");
  const [objectPlayable, setObjectPlayable] = useState(false);

  const FinalSelect = args => {
    Select(args);
    Close();
  };
  return (
    <div className="content-browser">
      <div className="content-browser__header-actions">
        <ContentLookup
          Select={({name, playable, libraryId, objectId, versionHash, latestVersionHash}) => {
            if(versionHash) {
              FinalSelect({name, libraryId, objectId, versionHash});
            } else if(objectId && !requireVersion) {
              FinalSelect({name, libraryId, objectId, versionHash: latestVersionHash});
            } else if(objectId) {
              setLibraryId(libraryId);
              setObjectId(objectId);
            } else if(libraryId) {
              setLibraryId(libraryId);
            }

            setObjectName(name);
            setObjectPlayable(playable);
          }}
        />
        {
          Close ?
            <div className="actions-container">
              <button className="action action-secondary" onClick={Close}>
                Cancel
              </button>
            </div> : null
        }
      </div>
      <div className="content-browser__header">
        <h1 className="content-header">
          { header || "Select an Object" }
        </h1>
      </div>
      <div className="content-browser__navigation">
        {
          libraryId ?
            <button
              className="content-browser__back-button"
              onClick={() => {
                if(objectId) {
                  setObjectId(undefined);
                  setObjectName("");
                  setObjectPlayable(false);
                } else {
                  setLibraryId(undefined);
                }
              }}
            >
              Back to {objectId ? "Content Objects" : "Libraries"}
            </button> : null
        }
        <h2 className="content-browser__location">
          { !libraryId ? "Content Libraries" : (objectName || (contentStore.libraries[libraryId] || {}).name) }
        </h2>
      </div>
      { !libraryId ?
        <LibraryBrowser
          Select={libraryId => {
            setLibraryId(libraryId);
          }}
        /> : null
      }
      { libraryId && !objectId ?
        <ObjectBrowser
          libraryId={libraryId}
          Select={({name, playable, objectId, versionHash}) => {
            if(requireVersion) {
              setObjectName(name);
              setObjectPlayable(name);
              setObjectId(objectId);
            } else {
              FinalSelect({
                name,
                playable,
                libraryId,
                objectId,
                versionHash
              });
            }
          }}
        /> : null
      }
      { libraryId && objectId ?
        <VersionBrowser
          libraryId={libraryId}
          objectId={objectId}
          Select={versionHash => FinalSelect({name: objectName, playable: objectPlayable, libraryId, objectId, versionHash})}
        /> : null
      }
    </div>
  );
});

export const ContentBrowserModal = (args) => {
  return (
    <Modal className="content-browser-modal" Close={args.Close}>
      <ContentBrowser {...args} />
    </Modal>
  );
};


export default ContentBrowser;
