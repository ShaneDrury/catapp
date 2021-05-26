import Cat from "./Cat";
import React from "react";
import { useCats, useFavourites, useVotes } from "./hooks";

const Uploaded = () => {
  const [catIds, catData] = useCats();
  const [favourites, fetchFavourites] = useFavourites();
  const [votes, fetchVotes] = useVotes();

  return (
    <div>
      {catIds.map((id) => (
        <Cat
          key={id}
          {...catData.items[id]}
          loading={catData.loading || votes.loading || favourites.loading}
          favourite={favourites.items[id]}
          votes={votes.items[id]}
          onVoteChange={fetchVotes}
          onFavouriteChange={fetchFavourites}
        />
      ))}
    </div>
  );
};

export default Uploaded;
