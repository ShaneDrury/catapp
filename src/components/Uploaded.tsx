import Cat from "./Cat";
import React from "react";
import { useCats, useFavourites, useVotes } from "../hooks";
import { Grid } from "@mui/material";

const Uploaded = () => {
  const { data: cats } = useCats();
  const { data: favourites } = useFavourites();
  const { data: votes } = useVotes();
  return (
    <Grid container spacing={2}>
      {cats!.map((cat) => (
        <Grid item key={cat.id} xs={12} md={4}>
          <Cat
            {...cat}
            favourite={favourites![cat.id]}
            votes={votes![cat.id]}
          />
        </Grid>
      ))}
    </Grid>
  );
};

export default Uploaded;
