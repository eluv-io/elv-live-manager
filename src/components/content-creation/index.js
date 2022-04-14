import React, {useEffect, useState} from "react";
import ImageIcon from "../common/ImageIcon";
import {Form, Input} from "../common/Inputs";
import {observer} from "mobx-react";
import {useDropzone} from "react-dropzone";

import PictureIcon from "../../static/icons/image.svg";
import LoadingIcon from "../../static/icons/loading.gif";
import CheckmarkIcon from "../../static/icons/check.svg";
import EllipsisIcon from "../../static/icons/ellipsis.svg";
import ErrorIcon from "../../static/icons/circle-exclamation.svg";

import {rootStore} from "../../stores/index";
import {toJS} from "mobx";
import Preview from "./Preview";
import UrlJoin from "url-join";

const ContentCreation = observer(() => {
  const [files, setFiles] = useState([]);
  const [disableDrm, setDisableDrm] = useState(false);

  useEffect( () => {
    if(!rootStore.ingestStore.libraryId) throw Error("Unable to find library ID");

    const GetDrmCert = async () => {
      if(!rootStore.ingestStore.client) return;
      const response = await rootStore.ingestStore.client.ContentLibrary({
        libraryId: rootStore.ingestStore.libraryId
      });
      const drmCert = await rootStore.ingestStore.client.ContentObjectMetadata({
        libraryId: rootStore.ingestStore.libraryId,
        objectId: response.qid,
        metadataSubtree: UrlJoin("elv", "media", "drm", "fps", "cert")
      });
      return !!drmCert;
    };

    setDisableDrm(GetDrmCert());
  }, []);

  const HandleFiles = (files) => {
    if(!files.length) return;
    files = files.map(file => {
      const preview = file.type.startsWith("image") ? URL.createObjectURL(file) : undefined;

      return Object.assign(file, {preview});
    });
    setFiles(files);
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    // accept: "audio/*, video/*, image/*",
    multiple: false,
    onDrop: HandleFiles
  });

  const HandleUpload = async () => {
    const libraryId = rootStore.ingestStore.libraryId;
    await rootStore.ingestStore.CreateProductionMaster({
      libraryId,
      type: "hq__KkgmjowhPqV6a4tSdNDfCccFA23RSSiSBggszF4p5s3u4evvZniFkn6fWtZ3AzfkFxxFmSoR2G",
      files,
      title: rootStore.editStore.Value(libraryId, "", "title") || file.name,
      encrypt: rootStore.editStore.Value(libraryId, "", "enable_drm") || false
    });
  };

  const IngestForm = () => {
    const objectId = rootStore.ingestStore.libraryId;

    return (
      <Form className="ingest-form">
        <div className="form__section">
          <Input
            required
            name="title"
            label="Title"
            objectId={objectId}
            path=""
          />
          <Input
            type="checkbox"
            objectId={objectId}
            label="Use Digital Right Management (DRM) copy protection during playback"
            name="enable_drm"
            path=""
            disabled={disableDrm}
          />
        </div>
        <button
          className="action action-primary"
          type="submit"
          disabled={!rootStore.editStore.Value(objectId, "", "title") || !files}
          onClick={HandleUpload}
        >
          Ingest
        </button>
      </Form>
    );
  };

  const SetIcon = (step) => {
    const ingestObject = toJS(rootStore.ingestStore.ingestObject);
    if(!ingestObject) return null;

    switch(step) {
      case "upload":
        return ingestObject.upload?.percentage === 100 ? CheckmarkIcon : LoadingIcon;
      case "ingest":
        if(rootStore.ingestStore.ingestErrors.errors.length) {
          return ErrorIcon;
        } else if(ingestObject.currentStep === "ingest" || ingestObject.ingest.runState === "finished") {
          return ingestObject.ingest?.percentage === 100 ? CheckmarkIcon : LoadingIcon;
        } else {
          return EllipsisIcon;
        }
      case "finalize":
        if(ingestObject.currentStep === "finalize") {
          return ingestObject.finalize.mezzanineHash ? CheckmarkIcon : LoadingIcon;
        } else {
          return EllipsisIcon;
        }
    }
  };

  const IngestingErrors = () => {
    const {errors, warnings} = toJS(rootStore.ingestStore.ingestErrors);

    return (
      [...errors, ...warnings].map((message, i) => (
        <div className={`error-notification${message ? " visible" : ""}`} key={i}>{message}</div>
      ))
    );
  };

  const IngestView = () => {
    let ingestObject = toJS(rootStore.ingestStore.ingestObject) || {};

    return (
      <React.Fragment>
        <div className="details-header">Your file is being ingested:</div>
        <div className="file-details">
          <div>File: {files.length ? files[0].name : ""}</div>
          <div>Title: {rootStore.editStore.Value(rootStore.ingestStore.libraryId, "", "title")}</div>
          <div>Use DRM: {rootStore.editStore.Value(rootStore.ingestStore.libraryId, "", "enable_drm") ? "yes" : "no"}</div>
        </div>
        <div className="details-header">Progress:</div>
        <div className="file-details-steps progress">
          <div className="progress-step">
            <ImageIcon
              icon={SetIcon("upload")}
              className="progress-icon"
            />
            <span>Upload file</span>
            <span>{`${ingestObject.upload?.percentage}% Complete`}</span>
          </div>

          <div className={`progress-step${ingestObject.currentStep === "upload" ? " pending-step" : ""}`}>
            <ImageIcon
              icon={SetIcon("ingest")}
              className="progress-icon"
            />
            <span>Convert to streaming format</span>
            <span>{ingestObject.currentStep === "ingest" && `${ingestObject.ingest?.percentage || 0}% Complete`}</span>
          </div>

          <div className={`progress-step${(["upload", "ingest"].includes(ingestObject.currentStep)) ? " pending-step" : ""}`}>
            <ImageIcon
              icon={SetIcon("finalize")}
              className="progress-icon"
            />
            <span>Finalize</span>
            <span></span>
          </div>
        </div>
        { IngestingErrors() }
        {
          !!rootStore.ingestStore.ingestErrors.errors.length && <div className="actions-container form-actions">
            <button
              className="action action-primary"
              onClick={() => {
                rootStore.ingestStore.ResetIngestForm();
                setFiles([]);
              }}
            >
              Back
            </button>
          </div>
        }
      </React.Fragment>
    );
  };

  const FormView = () => {
    return (
      <React.Fragment>
        <div>Upload a video or audio file</div>
        <div className="description">Types of files supported: .avi, .mp3, .mp4, .mpeg, .wav</div>
        <section className="drop-container">
          <div {...getRootProps()} className={`dropzone${isDragActive ? " drag-active" : ""}`}>
            <ImageIcon
              className="icon"
              icon={PictureIcon}
            />
            <input {...getInputProps()} />
          </div>
        </section>
        <Preview file={files.length ? files[0] : {}} />
        <div>File selected: {files.length ? files[0].name : ""}</div>
        { IngestForm() }
      </React.Fragment>
    );
  };

  return (
    <div className="page-content">
      <div className="edit-page__header">
        <h2 className="edit-page__header__text">Ingest Media File
        </h2>
      </div>
      {
        rootStore.ingestStore.ingestObjectId ?
          IngestView() :
          FormView()
      }
    </div>
  );
});

export default ContentCreation;
