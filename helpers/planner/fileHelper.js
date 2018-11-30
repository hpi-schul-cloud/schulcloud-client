const DEFAULT_FOLDER = "users/0000d231816abba584714c9e/templateData/";

export const handleFileClick = file => {
  window.open(
    `/files/file?download=1&file=${DEFAULT_FOLDER}${file.name}`,
    "_blank"
  );
  self.focus();
};

const uploadFile = async (file, id) => {
  // Get signed URL
  const fileData = await $.post("/files/file", {
    path: DEFAULT_FOLDER + file.name,
    type: file.type
  });

  // Upload to S3
  const options = {
    method: "PUT",
    body: file,
    headers: fileData.headers
  };
  await fetch(fileData.signedUrl.url, options);

  // Persist information in file model of DB
  const fileModel = await $.post("/files/fileModel", {
    key:
      fileData.signedUrl.header["x-amz-meta-path"] +
      "/" +
      encodeURIComponent(file.name),
    path: fileData.signedUrl.header["x-amz-meta-path"] + "/",
    name: file.name,
    type: file.type,
    size: file.size,
    flatFileName: fileData.signedUrl.header["x-amz-meta-flat-name"],
    thumbnail: fileData.signedUrl.header["x-amz-meta-thumbnail"]
  });

  return fileModel._id;
};

export const handleFileAdd = (
  { file: { file, tempId }, onComplete, onError },
  id
) => {
  uploadFile(file, id).then(
    id => {
      onComplete({
        file: file.name,
        name: file.name,
        type: file.type,
        id
      });
    },
    e => {
      onError(tempId);
      console.log(e);
    }
  );
};

export const handleFileRemove = file => {
  $.ajax({
    url: "/files/file",
    type: "DELETE",
    data: {
      key: `${DEFAULT_FOLDER}${file.name}`
    }
  });
};
