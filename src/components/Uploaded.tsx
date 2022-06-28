import Cat from "./Cat";
import React from "react";
import { useCats, useFavourites, useVotes } from "../hooks";
import { Grid } from "@mui/material";

const Uploaded = () => {
  const { data: cats, status: catsStatus, error: catsError } = useCats();
  const {
    data: favourites,
    status: favouritesStatus,
    error: favouritesError,
  } = useFavourites();
  const { data: votes, status: votesStatus, error: votesError } = useVotes();
  if (
    [catsStatus, favouritesStatus, votesStatus].some(
      (status) => status === "loading"
    )
  ) {
    return <div>Loading!</div>;
  }
  const error = [catsError, favouritesError, votesError].find((err) => !!err);
  if (error) {
    return <div>Error! {error.message}</div>;
  }
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
