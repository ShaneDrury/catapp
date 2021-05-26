import React from "react";
import { apiFromKey } from "./catsApi";

import { useHistory } from "react-router-dom";

const api = apiFromKey();

const UploadCat = () => {
  const history = useHistory();
  const handleInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const eventFiles = event.target.files;
    if (eventFiles) {
      const file = eventFiles[0];
      await api.newCat(file);
      history.push("/");
    }
  };
  return (
    <div>
      <input type="file" name="file" onChange={handleInputChange} />
    </div>
  );
};

export default UploadCat;
