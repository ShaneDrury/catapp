import React from "react";
import { apiFromKey } from "./catsApi";

const api = apiFromKey();

const Cat = ({
  id,
  url,
  favourite,
  votes = [],
  onVoteChange,
  onFavouriteChange,
  loading,
}) => {
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

  return (
    <div>
      <img src={url} alt="cat" width="25%" />
      <button disabled={loading} onClick={handleToggleFavourite}>
        {favourite ? "unfavourite" : "favourite"}
      </button>
      {votes.map((vote) => 2 * vote.value - 1).reduce((a, b) => a + b, 0)}
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
