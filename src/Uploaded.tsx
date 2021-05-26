import Cat from "./Cat";
import React from "react";
import { useCats, useFavourites, useVotes } from "./hooks";

const Uploaded = () => {
  const [catsLoading, cats] = useCats();
  const [loadingFavourites, favourites, fetchFavourites] = useFavourites();
  const [loadingVotes, votes, fetchVotes] = useVotes();

  return (
    <div>
      {cats.map((cat) => (
        <Cat
          key={cat.id}
          {...cat}
          loading={catsLoading || loadingVotes || loadingFavourites}
          favourite={favourites[cat.id]}
          votes={votes[cat.id]}
          onVoteChange={fetchVotes}
          onFavouriteChange={fetchFavourites}
        />
      ))}
    </div>
  );
};

export default Uploaded;
