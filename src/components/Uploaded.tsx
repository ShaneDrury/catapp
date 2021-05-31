import Cat from "./Cat";
import React from "react";
import { useCats, useFavourites, useVotes } from "../hooks";

const Uploaded = () => {
  const { isLoading: loadingCats, data: cats, error: catsError } = useCats();
  const {
    isLoading: loadingFavourites,
    data: favourites,
    error: favouritesError,
  } = useFavourites();
  const {
    isLoading: loadingVotes,
    data: votes,
    error: votesError,
  } = useVotes();

  if (loadingCats) {
    return <div>Loading!</div>;
  }

  if (catsError || favouritesError || votesError) {
    return <div>Error loading cats: {catsError}</div>;
  }

  return (
    <div className="columns is-multiline">
      {cats!.map((cat) => (
        <div key={cat.id} className="column is-one-quarter">
          <Cat
            {...cat}
            loading={loadingCats || loadingVotes || loadingFavourites}
            favourite={favourites[cat.id]}
            votes={votes[cat.id]}
          />
        </div>
      ))}
    </div>
  );
};

export default Uploaded;
