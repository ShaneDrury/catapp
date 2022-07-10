import Cat from "./Cat";
import React from "react";
import { useCats, useFavourites, useVotes } from "../hooks";
import { Grid } from "@mui/material";
import combineQueryResults from "combineQueryResults";

const Uploaded = () => {
  const catsQuery = useCats();
  const favouritesQuery = useFavourites();
  const votesQuery = useVotes();
  const combined = combineQueryResults(catsQuery, favouritesQuery, votesQuery);
  if (combined.status === "loading" || combined.status === "idle") {
    return <div>Loading!</div>;
  }
  const error = combined.error;
  if (error) {
    return <div>Error! {error.message}</div>;
  }
  const [cats, favourites, votes] = combined.data;
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
