import React from "react";
import { useNavigate } from "react-router-dom";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useUploadCat } from "../hooks";

const UploadCat = () => {
  const navigate = useNavigate();
  const uploadCat = useUploadCat();

  const handleInputChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const eventFiles = event.target.files;
      if (eventFiles) {
        const file = eventFiles[0];
        uploadCat.mutate(file, {
          onSuccess: () => navigate("/"),
        });
      }
    },
    [navigate, uploadCat]
  );

  return (
    <section className="hero">
      <div className="hero-body">
        <p className="title">Upload a cat</p>
      </div>
      <div className="file">
        <label className="file-label">
          <input
            disabled={uploadCat.status === "loading"}
            onChange={handleInputChange}
            className="file-input"
            type="file"
            name="file"
          />
          <span className="file-cta">
            <span className="file-icon">
              <FontAwesomeIcon icon={faUpload} />
            </span>
            <span className="file-label">Choose a file</span>
          </span>
        </label>
      </div>
      {uploadCat.status === "loading" && "Uploading image..."}
      {uploadCat.status === "error" && (
        <div>
          There was an error uploading your image: {uploadCat.error.message}
        </div>
      )}
    </section>
  );
};

export default UploadCat;
