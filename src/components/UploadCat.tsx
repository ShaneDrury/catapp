import React from "react";
import { useNavigate } from "react-router-dom";
import { useUploadCat } from "../hooks";
import { Input, Stack, Typography } from "@mui/material";

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
    <Stack spacing={2}>
      <Typography variant="h1">Upload a cat</Typography>
      <Input
        inputProps={{ "aria-label": "Choose a file" }}
        disabled={uploadCat.status === "loading"}
        onChange={handleInputChange}
        type="file"
        name="file"
      />
      {uploadCat.status === "loading" && "Uploading image..."}
      {uploadCat.status === "error" && (
        <Typography>
          There was an error uploading your image: {uploadCat.error.message}
        </Typography>
      )}
    </Stack>
  );
};

export default UploadCat;
