import React from "react";
import { apiFromKey, Favourite, Vote } from "./catsApi";

const api = apiFromKey();

interface CatProps {
  id: string;
  url: string;
  favourite: Favourite;
  votes?: Vote[];
  onVoteChange: () => void;
  onFavouriteChange: () => void;
  loading: boolean;
}

const Cat = ({
  id,
  url,
  favourite,
  votes = [],
  onVoteChange,
  onFavouriteChange,
  loading,
}: CatProps) => {
  const handleToggleFavourite = async () => {
    if (favourite) {
      await api.unfavouriteCat(favourite.id);
    } else {
      await api.favouriteCat(id);
    }
    onFavouriteChange();
  };

  const handleVoteUp = async () => {
    await api.voteUp(id);
    onVoteChange();
  };

  const handleVoteDown = async () => {
    await api.voteDown(id);
    onVoteChange();
  };

  const score = votes
    .map((vote) => 2 * vote.value - 1)
    .reduce((a, b) => a + b, 0);

  return (
    <div>
      <img src={url} alt="cat" width="25%" />
      <button disabled={loading} onClick={handleToggleFavourite}>
        {favourite ? "unfavourite" : "favourite"}
      </button>
      {score}
      <button disabled={loading} onClick={handleVoteUp}>
        Vote up
      </button>
      <button disabled={loading} onClick={handleVoteDown}>
        Vote down
      </button>
    </div>
  );
};

export default Cat;
