import React from "react";
import { Favourite, Vote, Cat as ICat } from "./types";
import { apiFromKey } from "./catsApi";
import { groupBy } from "lodash";

const api = apiFromKey();

const useLoader = <S>(
  getData: () => Promise<S>,
  initial: S
): [boolean, S, () => void] => {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [stale, setStale] = React.useState<boolean>(true);
  const [data, setData] = React.useState<S>(initial);
  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const newData = await getData();
      setStale(false);
      setLoading(false);
      setData(newData);
    };
    if (stale && !loading) {
      fetchData();
    }
  }, [getData, loading, stale]);
  const fetchData = () => {
    setStale(true);
  };
  return [loading, data, fetchData];
};

export const useCats = (): [boolean, ICat[]] => {
  const [loading, cats] = useLoader<ICat[]>(api.uploaded, []);
  return [loading, cats];
};

export const useFavourites = (): [
  boolean,
  { [key: string]: Favourite },
  () => void
] => {
  const [loading, favourites, fetchFavourites] = useLoader<Favourite[]>(
    api.favourites,
    []
  );
  const groupedFavourites = favourites.reduce(
    (acc, favourite) => ({ ...acc, [favourite.image_id]: favourite }),
    {}
  );
  return [loading, groupedFavourites, fetchFavourites];
};

export const useVotes = (): [
  boolean,
  { [key: string]: Vote[] },
  () => void
] => {
  const [loading, votes, fetchVotes] = useLoader<Vote[]>(api.votes, []);
  const groupedVotes = groupBy(votes, (vote) => vote.image_id);
  return [loading, groupedVotes, fetchVotes];
};
