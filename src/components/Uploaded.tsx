import Cat from "./Cat";
import React from "react";
import { useCats, useFavourites, useVotes } from "../hooks";
import { Grid } from "@mui/material";
import combineQueryResults from "combineQueryResults";

const Uploaded = () => {
  const { status, data, error } = combineQueryResults(
    useCats(),
    useFavourites(),
    useVotes()
  );
  if (status === "loading") {
    return <div>Loading!</div>;
  }
  if (error) {
    return <div>Error! {error.message}</div>;
  }
  const [cats, favourites, votes] = data;
  return (
    <Grid container spacing={2}>
      {cats.map((cat) => (
        <Grid item key={cat.id} xs={12} md={4}>
          <Cat {...cat} favourite={favourites[cat.id]} votes={votes[cat.id]} />
        </Grid>
      ))}
    </Grid>
  );
};

export default Uploaded;
