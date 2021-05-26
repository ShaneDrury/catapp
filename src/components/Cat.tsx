import React from "react";
import { apiFromKey } from "../catsApi";
import { Favourite, Vote, Cat as ICat } from "../types";
import {
  faArrowDown,
  faArrowUp,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styled from "styled-components";

const api = apiFromKey();

const CardSpacer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const CatImage = styled.img`
  object-fit: contain;
`;

interface CatProps extends ICat {
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
    if (loading) {
      return;
    }
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
    <div className="card">
      <div className="card-image">
        <figure className="image is-4by3">
          <CatImage src={url} alt="cat" width="25%" />
        </figure>
      </div>
      <div className="card-content">
        <div className="content">
          <CardSpacer>
            <div>Score: {score}</div>
            <span className="icon is-clickable">
              <FontAwesomeIcon
                title={favourite ? "favourite" : "not favourite"}
                icon={favourite ? faHeart : faHeartRegular}
                color="red"
                onClick={handleToggleFavourite}
              />
            </span>
          </CardSpacer>
          <CardSpacer className="buttons">
            <button
              className="button"
              disabled={loading}
              onClick={handleVoteUp}
            >
              <span className="icon">
                <FontAwesomeIcon icon={faArrowUp} />
              </span>
              <span>Vote up</span>
            </button>
            <button
              className="button"
              disabled={loading}
              onClick={handleVoteDown}
            >
              <span className="icon">
                <FontAwesomeIcon icon={faArrowDown} />
              </span>
              <span>Vote down</span>
            </button>
          </CardSpacer>
        </div>
      </div>
    </div>
  );
};

export default Cat;
