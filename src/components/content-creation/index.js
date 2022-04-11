import React, {useEffect, useState} from "react";
import ImageIcon from "../common/ImageIcon";
import {Form, Input} from "../common/Inputs";
import {observer} from "mobx-react";
import {useDropzone} from "react-dropzone";

import PictureIcon from "../../static/icons/image.svg";
import LoadingIcon from "../../static/icons/loading.gif";
import CheckmarkIcon from "../../static/icons/check.svg";
import EllipsisIcon from "../../static/icons/ellipsis.svg";

import {rootStore} from "../../stores/index";
import {toJS} from "mobx";

const ContentCreation = observer(() => {
  const [files, setFiles] = useState([]);
  const [ingestingStep, setIngestingStep] = useState(undefined);
  const [ingestingProgress, setIngestingProgress] = useState(0);
  const [ingestingError, setIngestingError] = useState("");
  const [objectId, setObjectId] = useState("");
  let currentIngestObject = {};

  useEffect(() => {
    if(!rootStore.ingestStore.libraryId) throw Error("Unable to find library ID");

    currentIngestObject = toJS(rootStore.ingestStore.ingestObject) || {};
  }, []);

  const HandleFiles = (files) => {
    if(!files.length) return;

    setFiles(files);
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    accept: "audio/*, video/*",
    multiple: false,
    onDrop: HandleFiles
  });

  const HandleUpload = async () => {
    const libraryId = rootStore.ingestStore.libraryId;
    setIngestingStep(1);
    const {streamWarnings, errors, id, type, hash} = await rootStore.ingestStore.CreateProductionMaster({
      libraryId,
      type: "hq__KkgmjowhPqV6a4tSdNDfCccFA23RSSiSBggszF4p5s3u4evvZniFkn6fWtZ3AzfkFxxFmSoR2G",
      files,
      title: rootStore.editStore.Value(libraryId, "", "title") || file.name,
      encrypt: rootStore.editStore.Value(libraryId, "", "enable_drm") || false,
      // callback: progress => {
      //   const fileProgress = progress[files[0].path];
      //   setIngestingProgress(Math.round((fileProgress.uploaded / fileProgress.total) * 100));
      // },
      OnComplete: () => {
        setIngestingStep(2);
      }
    });

    setObjectId(id);

    if(streamWarnings.noAudio) setIngestingError("Warning: No audio streams found in file");
    if(streamWarnings.noVideo) setIngestingError("Warning: No video streams found in file");
    if(errors && errors.length) setIngestingError("Error: Unable to ingest selected media file.");

    // await HandleIngest({
    //   libraryId,
    //   type,
    //   hash,
    //   masterObjectId: id
    // });
  };

  const HandleIngest = async ({libraryId, type, hash, masterObjectId}) => {
    await rootStore.ingestStore.CreateABRMezzanine({
      libraryId,
      type,
      masterObjectId,
      name: rootStore.editStore.Value(libraryId, "", "title"),
      masterVersionHash: hash
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
    if(ingestingStep === step) {
      return (ingestingProgress === 100) ? CheckmarkIcon : LoadingIcon;
    } else if(ingestingStep < step) {
      return EllipsisIcon;
    } else {
      return CheckmarkIcon;
    }
  };

  const IngestView = () => {
    const ingestObject = toJS(rootStore.ingestStore.ingestObject) || {};

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
              icon={SetIcon(1)}
              className="progress-icon"
            />
            <span>Upload file</span>
            <span>{`${ingestObject.uploadPercent}% Complete`}</span>
          </div>

          <div className={`progress-step${ingestObject.uploadPercent < 100 ? " pending-step" : ""}`}>
            <ImageIcon
              icon={SetIcon(2)}
              className="progress-icon"
            />
            <span>Convert to streaming format</span>
            <span>{ingestObject.uploadPercent === 100 && `${ingestObject.ingestPercent || 0}% Complete`}</span>
          </div>

          <div className={`progress-step${(ingestObject.uploadPercent < 100 || !ingestObject.ingestRunState || ingestObject.ingestRunState !== "finished") ? " pending-step" : ""}`}>
            <ImageIcon
              icon={SetIcon(3)}
              className="progress-icon"
            />
            <span>Finalize</span>
            <span></span>
          </div>
        </div>
        <div className={`error-notification${ingestingError ? " visible" : ""}`}>{ingestingError}</div>
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
