import UrlJoin from "url-join";

export const imageTypes = ["gif", "jpg", "jpeg", "png", "svg", "webp"];

// Convert a FileList to file info for UploadFiles
export const FileInfo = async (path, fileList) => {
  return await Promise.all(
    Array.from(fileList).map(async file => {
      const data = await new Response(file).arrayBuffer();
      const filePath = file.webkitRelativePath || file.name;
      return {
        path: UrlJoin(path, filePath).replace(/^\/+/g, ""),
        type: "file",
        size: file.size,
        mime_type: file.type,
        data
      };
    })
  );
};


/*
// Convert a FileList to file info for UploadFiles
export const FileInfo = async (path, fileList) => {
  // If path is ".", clear it to prevent paths being composed as "./<filename>"
  path = (path === ".") ? "" : path;

  return await Promise.all(
    Array.from(fileList).map(async file => {
      const data = await new Response(file).arrayBuffer();
      let filePath = file.overrideName || file.webkitRelativePath || file.name;

      return {
        path: UrlJoin(path, filePath).replace(/^\/+/g, ""),
        type: "file",
        mime_type: file.type,
        size: file.size,
        data
      };
    })
  );
};

 */