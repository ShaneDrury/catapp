import { Favourite, Vote, Cat as ICat } from "./types";
import { apiFromKey } from "./catsApi";
import { groupBy } from "lodash";
import { useQuery } from "react-query";

const api = apiFromKey();

export const useCats = () => {
  return useQuery<ICat[], string>("cats", api.uploaded);
};

export const useFavourites = () => {
  const { data, ...rest } = useQuery<Favourite[], string>(
    "favourites",
    api.favourites
  );
  let groupedFavourites: { [key: string]: Favourite } = {};
  if (data) {
    groupedFavourites = data.reduce(
      (acc, favourite) => ({ ...acc, [favourite.image_id]: favourite }),
      {}
    );
  }
  return { ...rest, data: groupedFavourites };
};

export const useVotes = () => {
  const { data, ...rest } = useQuery<Vote[], string>("votes", api.votes);
  let groupedVotes: { [key: string]: Vote[] } = {};
  if (data) {
    groupedVotes = groupBy(data, (vote) => vote.image_id);
  }
  return { ...rest, data: groupedVotes };
};
