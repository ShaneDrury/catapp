import Cat from "./Cat";
import React from "react";
import { useCats, useFavourites, useVotes } from "./hooks";

const Uploaded = () => {
  const [catsLoading, cats] = useCats();
  const [loadingFavourites, favourites, fetchFavourites] = useFavourites();
  const [loadingVotes, votes, fetchVotes] = useVotes();

  return (
    <div className="columns is-multiline">
      {cats.map((cat) => (
        <div key={cat.id} className="column is-one-quarter">
          <Cat
            {...cat}
            loading={catsLoading || loadingVotes || loadingFavourites}
            favourite={favourites[cat.id]}
            votes={votes[cat.id]}
            onVoteChange={fetchVotes}
            onFavouriteChange={fetchFavourites}
          />
        </div>
      ))}
    </div>
  );
};

export default Uploaded;
