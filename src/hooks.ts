import { Favourite, Vote, Cat as ICat } from "./types";
import { makeApiCalls } from "./catsApi";
import { groupBy } from "./utils";
import { useMutation, useQuery, useQueryClient } from "react-query";
import React from "react";

export const CatApiContext = React.createContext<
  ReturnType<typeof makeApiCalls> | undefined
>(undefined);

export const useCatApi = () => {
  const api = React.useContext(CatApiContext);
  if (api === undefined) {
    throw new Error("Please pass in api to CatApiContext");
  }
  return api;
};

export const useCats = () => {
  const api = useCatApi();
  return useQuery<ICat[], string>("cats", api.getAllImages(100));
};

export const useFavourites = () => {
  const api = useCatApi();
  const { data, ...rest } = useQuery<Favourite[], string>(
    "favourites",
    api.getAllFavourites
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
  const { data, ...rest } = useQuery<Vote[], string>("votes", api.getAllVotes);
  const groupedVotes = React.useMemo(
    () => data && groupBy(data, (vote) => vote.image_id),
    [data]
  );
  return { ...rest, data: groupedVotes };
};

export const useUploadCat = () => {
  const api = useCatApi();
  return useMutation<unknown, { message: string }, File>((catData: File) => {
    const catPicture = new FormData();
    catPicture.append("file", catData);
    return api.uploadCat(catPicture)();
  });
};

export const useVoteDown = (id: string) => {
  const api = useCatApi();
  const queryClient = useQueryClient();
  return useMutation(
    () =>
      api.voteDown({
        image_id: id,
        value: 0,
      })(),
    {
      onSuccess: () => queryClient.invalidateQueries("votes"),
    }
  );
};

export const useVoteUp = (id: string) => {
  const api = useCatApi();
  const queryClient = useQueryClient();
  return useMutation(() => api.voteUp({ image_id: id, value: 1 })(), {
    onSuccess: () => queryClient.invalidateQueries("votes"),
  });
};

export const useFavourite = (id: string, favourite: Favourite) => {
  const api = useCatApi();
  const queryClient = useQueryClient();
  return useMutation(
    () => {
      if (favourite) {
        return api.deleteFavourite(favourite.id)();
      } else {
        return api.postFavourite({ image_id: id })();
      }
    },
    {
      onSuccess: () => queryClient.invalidateQueries("favourites"),
    }
  );
};
