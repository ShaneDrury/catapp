import { Favourite, Vote, Cat as ICat } from "./types";
import { CatsApi } from "./catsApi";
import { groupBy } from "lodash";
import { useMutation, useQuery, useQueryClient } from "react-query";
import React from "react";

export const CatApiContext = React.createContext<CatsApi | undefined>(
  undefined
);

export const useCatApi = () => {
  const api = React.useContext(CatApiContext);
  if (api === undefined) {
    throw new Error("Please pass in api to CatApiContext");
  }
  return api;
};

export const useCats = () => {
  const api = useCatApi();
  return useQuery<ICat[], string>("cats", api.uploaded);
};

export const useFavourites = () => {
  const api = useCatApi();
  const { data, ...rest } = useQuery<Favourite[], string>(
    "favourites",
    api.favourites
  );
  const groupedFavourites = React.useMemo(
    () =>
      data &&
      data.reduce<Record<string, Favourite>>(
        (acc, favourite) => ({ ...acc, [favourite.image_id]: favourite }),
        {}
      ),
    [data]
  );
  return { ...rest, data: groupedFavourites };
};

export const useVotes = () => {
  const api = useCatApi();
  const { data, ...rest } = useQuery<Vote[], string>("votes", api.votes);
  const groupedVotes = React.useMemo(
    () => data && groupBy(data, (vote) => vote.image_id),
    [data]
  );
  return { ...rest, data: groupedVotes };
};

export const useUploadCat = () => {
  const api = useCatApi();
  return useMutation<unknown, { message: string }, File>(api.newCat);
};

export const useVoteDown = (id: string) => {
  const api = useCatApi();
  const queryClient = useQueryClient();
  return useMutation(() => api.voteDown(id), {
    onSuccess: () => queryClient.invalidateQueries("votes"),
  });
};

export const useVoteUp = (id: string) => {
  const api = useCatApi();
  const queryClient = useQueryClient();
  return useMutation(() => api.voteUp(id), {
    onSuccess: () => queryClient.invalidateQueries("votes"),
  });
};

export const useFavourite = (id: string, favourite: Favourite) => {
  const api = useCatApi();
  const queryClient = useQueryClient();
  return useMutation(
    () => {
      if (favourite) {
        return api.unfavouriteCat(favourite.id);
      } else {
        return api.favouriteCat(id);
      }
    },
    {
      onSuccess: () => queryClient.invalidateQueries("favourites"),
    }
  );
};
