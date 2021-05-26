import React from "react";
import { Favourite, Vote, Cat as ICat } from "./types";
import { apiFromKey } from "./catsApi";
import { groupBy } from "lodash";

interface CatDataState {
  items: { [key: string]: ICat };
  loading: boolean;
  stale: boolean;
}

interface VotesState {
  stale: boolean;
  items: { [key: string]: Vote[] };
  loading: boolean;
}

interface FavouritesState {
  stale: boolean;
  items: { [key: string]: Favourite };
  loading: boolean;
}

const api = apiFromKey();

export const useCats = (): [string[], CatDataState] => {
  const [catIds, setCatIds] = React.useState<string[]>([]);
  const [catData, setCatData] = React.useState<CatDataState>({
    stale: true,
    items: {},
    loading: false,
  });
  React.useEffect(() => {
    const getCats = async () => {
      setCatData({ ...catData, loading: true });
      const cats = await api.uploaded();
      setCatIds(cats.map((cat) => cat.id));
      setCatData({
        loading: false,
        stale: false,
        items: cats.reduce((acc, cat) => ({ ...acc, [cat.id]: cat }), {}),
      });
    };
    if (catData.stale && !catData.loading) {
      getCats();
    }
  }, [catData]);
  return [catIds, catData];
};

export const useFavourites = (): [FavouritesState, () => void] => {
  const [favourites, setFavourites] = React.useState<FavouritesState>({
    stale: true,
    items: {},
    loading: false,
  });
  React.useEffect(() => {
    const getFavourites = async () => {
      setFavourites({ ...favourites, loading: true });
      const newFavourites = await api.favourites();
      return setFavourites({
        stale: false,
        loading: false,
        items: newFavourites.reduce(
          (acc, favourite) => ({ ...acc, [favourite.image_id]: favourite }),
          {}
        ),
      });
    };
    if (favourites.stale && !favourites.loading) {
      getFavourites();
    }
  }, [favourites]);

  const fetchFavourites = () => {
    setFavourites({ ...favourites, stale: true });
  };
  return [favourites, fetchFavourites];
};

export const useVotes = (): [VotesState, () => void] => {
  const [votes, setVotes] = React.useState<VotesState>({
    stale: true,
    items: {},
    loading: false,
  });

  React.useEffect(() => {
    const getVotes = async () => {
      setVotes({ ...votes, loading: true });
      const newVotes = await api.votes();
      return setVotes({
        stale: false,
        loading: false,
        items: groupBy(newVotes, (vote) => vote.image_id),
      });
    };
    if (votes.stale && !votes.loading) {
      getVotes();
    }
  }, [votes]);
  const fetchVotes = () => {
    setVotes({ ...votes, stale: true });
  };
  return [votes, fetchVotes];
};
