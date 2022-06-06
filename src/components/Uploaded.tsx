import Cat from "./Cat";
import React from "react";
import { useCats, useFavourites, useVotes } from "../hooks";

const Uploaded = () => {
  const { status: catsStatus, data: cats, error: catsError } = useCats();
  const {
    status: favouritesStatus,
    data: favourites,
    error: favouritesError,
  } = useFavourites();
  const { status: votesStatus, data: votes, error: votesError } = useVotes();

  if (
    catsStatus === "loading" ||
    favouritesStatus === "loading" ||
    votesStatus === "loading" ||
    catsStatus === "idle" ||
    favouritesStatus === "idle" ||
    votesStatus === "idle"
  ) {
    return <div>Loading!</div>;
  }

  if (catsError || favouritesError || votesError) {
    return <div>Error loading cats: {catsError}</div>;
  }

  return (
    <div className="columns is-multiline">
      {cats!.map((cat) => (
        <div key={cat.id} className="column is-one-quarter">
          <Cat {...cat} favourite={favourites[cat.id]} votes={votes[cat.id]} />
        </div>
      ))}
    </div>
  );
};

export default Uploaded;
