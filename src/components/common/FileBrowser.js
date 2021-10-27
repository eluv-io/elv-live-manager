import React, { useState, useRef } from "react";
import UrlJoin from "url-join";
import {editStore} from "Stores";
import {observer} from "mobx-preact";
import AsyncComponent from "Components/common/AsyncComponent";
import PrettyBytes from "pretty-bytes";
import Modal from "Components/common/Modal";
import {Loader} from "Components/common/Loader";
import ImageIcon from "Components/common/ImageIcon";
import {FileInfo, imageTypes} from "Utils/Files";
import ImagePreview from "Components/common/ImagePreview";
import {onEnterPressed} from "Utils/Misc";

import FileIcon from "Assets/icons/file.svg";
import DirectoryIcon from "Assets/icons/directory.svg";

import UploadIcon from "Assets/icons/upload.svg";
import UploadDirectoryIcon from "Assets/icons/upload-directory.svg";
import DirectoryAddIcon from "Assets/icons/folder-plus.svg";
import PictureIcon from "Assets/icons/image.svg";
import DeleteIcon from "Assets/icons/x-circle.svg";
import Confirm from "Components/common/Confirm";

const DirectoryModal = observer(({Create, Close}) => {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const Submit = async () => {
    try {
      setLoading(true);
      await Create(name);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal Close={Close} className="directory-modal-container">
      <div className="directory-modal">
        <h1 className="page-header directory-modal__header">Create New Directory</h1>
        <div className="actions-container">
          <input
            value={name}
            onKeyDown={onEnterPressed(Submit)}
            onChange={event => setName(event.target.value)}
            placeholder="Directory Name..."
            className="action-input directory-modal__input"
            autoFocus
          />
        </div>
        {
          loading ?
            <div className="actions-container actions-container-loading">
              <Loader/>
            </div> :

            <div className="actions-container">
              <button
                disabled={!name}
                className="action action-primary"
                onClick={Submit}
              >
                Create
              </button>
              <button className="action action-secondary" onClick={Close}>
                Cancel
              </button>
            </div>
        }
      </div>
    </Modal>
  );
});

const FileBrowser = observer(({header="Select a File", objectId, extensions, Select, Close}) => {
  const [directoryModal, setDirectoryModal] = useState(null);

  const [sortKey, setSortKey] = useState("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState("");

  const [pathElements, setPathElements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(0);

  const filesRef = useRef(undefined);
  const directoriesRef = useRef(undefined);

  const mimeTypes = (editStore.files[objectId] || {})["mime-types"] || {};

  const SetSort = (key) => {
    if(sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  let fileMetadata = (editStore.files[objectId] || {}).files || {};
  pathElements.forEach(element => fileMetadata = fileMetadata[element]);

  const files = Object.keys(fileMetadata)
    .map(fileName => {
      if(fileName === ".") {
        return null;
      }

      const fileInfo = fileMetadata[fileName]["."] || {};
      const extension = (fileName.split(".").pop() || "").toLowerCase();

      if(fileInfo.type === "directory") {
        return {
          type: "directory",
          name: fileName,
          valid: true
        };
      }

      return {
        type: "file",
        name: fileName,
        extension: mimeTypes[extension] || extension,
        size: fileInfo.size ? PrettyBytes(fileInfo.size) : 0,
        valid: !extensions || extensions.includes(extension),
        isImage: imageTypes.includes(extension)
      };
    })
    .filter(file => file && (!filter || file.name.toLowerCase().includes(filter.toLowerCase())))
    .sort((a, b) => {
      if(a.type === b.type) {
        return ((a[sortKey] || "").toLowerCase() < (b[sortKey] || "").toLowerCase() ? (sortAsc ? -1 : 1) : (sortAsc ? 1 : -1));
      } else if(a.type === "directory") {
        return -1;
      } else {
        return 1;
      }
    });

  return (
    <AsyncComponent
      className="file-browser file-browser-loader"
      Load={async () => await editStore.Files({objectId})}
    >
      <div className="file-browser">
        { directoryModal }
        <div className="file-browser__header">
          <h1 className="content-header">
            { header }
          </h1>
          {
            Close ?
              <div className="actions-container">
                <button className="action action-secondary" onClick={Close}>
                  Cancel
                </button>
              </div> : null
          }
        </div>
        <div className="actions-container file-browser__actions">
          <input
            value={filter}
            onChange={event => setFilter(event.target.value)}
            className="action-input file-browser__filter"
            placeholder="Filter..."
          />
          <div className="file-browser__buttons">
            <button
              onClick={() =>
                setDirectoryModal(
                  <DirectoryModal
                    Create={async name => {
                      await editStore.CreateDirectory({objectId, directory: UrlJoin(...pathElements, name)});
                      setDirectoryModal(null);
                    }}
                    Close={() => setDirectoryModal(null)}
                  />
                )
              }
              className="action action-icon"
            >
              <ImageIcon
                className="action-icon__icon"
                icon={DirectoryAddIcon}
                title="Create New Directory"
              />
            </button>
            <input
              style={{display: "none"}}
              ref={filesRef}
              type="file"
              onChange={async event => {
                try {
                  setUploadStatus(0);
                  setLoading(true);
                  const fileInfo = await FileInfo(UrlJoin(...pathElements), event.target.files);
                  await editStore.UploadFiles({objectId, fileInfo, callback: status => setUploadStatus(status)});
                } finally {
                  setLoading(false);
                  setUploadStatus(0);
                }
              }}
              multiple
            />
            <input
              style={{display: "none"}}
              ref={directoriesRef}
              type="file"
              onChange={async event => {
                try {
                  setUploadStatus(0);
                  setLoading(true);
                  const fileInfo = await FileInfo(UrlJoin(...pathElements), event.target.files);
                  await editStore.UploadFiles({objectId, fileInfo, callback: status => setUploadStatus(status)});
                } finally {
                  setLoading(false);
                  setUploadStatus(0);
                }
              }}
              multiple
              webkitdirectory
              mozdirectory
              msdirectory
              odirectory
              directory
            />
            <button className="action action-icon" onClick={() => directoriesRef.current && directoriesRef.current.click()}>
              <ImageIcon
                icon={UploadDirectoryIcon}
                title="Upload Directory"
                className="action-icon__icon"
              />
            </button>
            <button className="action action-icon" onClick={() => filesRef.current && filesRef.current.click()}>
              <ImageIcon
                icon={UploadIcon}
                title="Upload Files"
                className="action-icon__icon"
              />
            </button>
          </div>
        </div>
        <div className="file-browser__path-container">
          <div className="file-browser__path">
            <button
              onClick={() => setPathElements([])}
              className="file-browser__path__element"
            >
              root
            </button>
            {
              pathElements.map((element, index) =>
                <>
                  <div className="file-browser__path__slash" key={`file-browser-slash-${index}`}>/</div>
                  <button
                    onClick={() => setPathElements(pathElements.slice(0, index + 1))}
                    className="file-browser__path__element"
                    key={`file-browser-slash-${index}`}
                  >
                    { element }
                  </button>
                </>
              )
            }
          </div>
          {
            loading ?
              <div className="file-browser__upload-status">
                <div className="file-browser__upload-status-percent">Uploading: { uploadStatus.toFixed(1) }%</div>
                <Loader />
              </div>: null }
        </div>
        <div className="list file-browser__list">
          <div className="list__item list__header file-browser__file file-browser__file-header">
            <div className="file-browser__file-header__column" />
            <button className="file-browser__file-header__column" onClick={() => SetSort("name")}>
              Name
            </button>
            <button className="file-browser__file-header__column" onClick={() => SetSort("extension")}>
              Type
            </button>
            <button className="file-browser__file-header__column" onClick={() => SetSort("size")}>
              Size
            </button>
            <div className="file-browser__file-header__column" />
          </div>
          {
            files.map(({type, name, extension, size, valid, isImage}) =>
              <button
                className="list__item file-browser__file"
                key={`file-browser-${name}`}
                disabled={!valid}
                onClick={() => {
                  if(type === "directory") {
                    setPathElements([...pathElements, name]);
                  } else if(Select) {
                    Select({
                      file: name,
                      pathElements,
                      path: UrlJoin(...pathElements, name)
                    });
                  }
                }}
              >
                <div className="no-ellipsis file-browser__file__column file-browser__file__column-icon">
                  {
                    isImage ?
                      <ImagePreview objectId={objectId} filePath={UrlJoin(...pathElements, name)}>
                        <ImageIcon
                          icon={PictureIcon}
                          title="Image"
                          className="file-browser__file__icon"
                        />
                      </ImagePreview> :
                      <ImageIcon
                        icon={type === "directory" ? DirectoryIcon : FileIcon}
                        title={type === "directory" ? "Directory" : "File"}
                        className="file-browser__file__icon"
                      />
                  }
                </div>
                <div className="file-browser__file__column">
                  { name }
                </div>
                <div className="file-browser__file__column">
                  { extension }
                </div>
                <div className="file-browser__file__column">
                  { size }
                </div>
                <div className="file-browser__file__column file-browser__file__column-actions no-ellipsis">
                  <button
                    className="action action-icon"
                    onClick={async event => {
                      event.stopPropagation();

                      await Confirm({
                        message: `Are you sure you want to delete '${name}'?`,
                        Confirm: async () => editStore.DeleteFile({objectId, path: UrlJoin(...pathElements, name)})
                      });
                    }}
                  >
                    <ImageIcon
                      title={`Delete '${name}'`}
                      className="action-icon__icon"
                      icon={DeleteIcon}
                    />
                  </button>
                </div>
              </button>
            )
          }
        </div>
      </div>
    </AsyncComponent>
  );
});

export const FileBrowserModal = (args) => {
  return (
    <Modal className="file-browser-modal" Close={args.Close}>
      <FileBrowser {...args} />
    </Modal>
  );
};

export default FileBrowser;
