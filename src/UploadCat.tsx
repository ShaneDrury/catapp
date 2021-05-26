import React from "react";
import { apiFromKey } from "./catsApi";

import { useHistory } from "react-router-dom";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const api = apiFromKey();

const UploadCat = () => {
  const history = useHistory();
  const [loading, setLoading] = React.useState<boolean>(false);

  const handleInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const eventFiles = event.target.files;
    if (eventFiles) {
      const file = eventFiles[0];
      setLoading(true);
      await api.newCat(file);
      history.push("/");
    }
  };
  return (
    <section className="hero">
      <div className="hero-body">
        <p className="title">Upload a cat</p>
      </div>
      <div className="file">
        <label className="file-label">
          <input
            disabled={loading}
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
      {loading && "Uploading cat..."}
    </section>
  );
};

export default UploadCat;
