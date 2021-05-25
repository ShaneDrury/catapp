import React from "react";
import { apiFromKey } from "./catsApi";

const api = apiFromKey();

const UploadCat = () => {
  const handleInputChange = (event) => {
    const file = event.target.files[0];
    return api.newCat(file);
  }
  return (
    <div>
      <input type="file" name="file" onChange={handleInputChange} />
    </div>
  )
}

export default UploadCat;
