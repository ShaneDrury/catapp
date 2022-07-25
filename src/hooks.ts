import { Favourite, Vote, Cat as ICat } from "./types";
import { api, makeApiCalls } from "./catsApi";
import { groupBy } from "./utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { getQueryKeys } from "./servo/queryKeys";

const [[[allImagesQueryKey], [allFavouritesQueryKey], [allVotesQueryKey]]] =
  getQueryKeys(api);

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

const handle200 =
  <T>(
    apiCall: () => Promise<
      | { status: 200; data: T }
      | { status: Omit<number, "200">; data: { message: string } }
    >
  ) =>
  async () => {
    const response = await apiCall();
    if (response.status === 200) {
      return response.data as T;
    }
    throw new Error(response.data.message);
  };

export const useCats = () => {
  const api = useCatApi();
  return useQuery<ICat[], { message: string }>(
    allImagesQueryKey,
    handle200(api.getAllImages(100))
  );
};

export const useFavourites = () => {
  const api = useCatApi();
  return useQuery<Record<string, Favourite>, { message: string }>(
    allFavouritesQueryKey,
    async () => {
      const data = await handle200(api.getAllFavourites)();
      return data.reduce<Record<string, Favourite>>(
        (acc, favourite) => ({ ...acc, [favourite.image_id]: favourite }),
        {}
      );
    }
  );
};

export const useVotes = () => {
  const api = useCatApi();
  return useQuery<Record<string, Vote[]>, { message: string }>(
    allVotesQueryKey,
    async () => {
      let page = 0;
      const items: Vote[] = [];
      while (true) {
        const result = await api.getAllVotes(page)();
        if (result.status === 200) {
          items.push(...result.data);
          page += 1;
          const totalCount = parseInt(
            result.headers["pagination-count"] || "0",
            10
          );
          if (items.length >= totalCount) {
            break;
          }
        } else {
          throw new Error(result.data.message);
        }
      }
      return groupBy(items, (vote) => vote.image_id);
    }
  );
};

export const useUploadCat = () => {
  const api = useCatApi();
  const queryClient = useQueryClient();
  return useMutation<unknown, { message: string }, File>(
    async (catData: File) => {
      const catPicture = new FormData();
      catPicture.append("file", catData);
      const response = await api.uploadCat(catPicture)();
      if (response.status === 200) {
        return response.data;
      }
      throw new Error(response.data.message);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(allImagesQueryKey);
      },
    }
  );
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
      onSuccess: () => {
        queryClient.invalidateQueries(allVotesQueryKey);
      },
    }
  );
};

export const useVoteUp = (id: string) => {
  const api = useCatApi();
  const queryClient = useQueryClient();
  return useMutation(() => api.voteUp({ image_id: id, value: 1 })(), {
    onSuccess: () => {
      queryClient.invalidateQueries(allVotesQueryKey);
    },
  });
};

export const useFavourite = (id: string, favourite: Favourite) => {
  const api = useCatApi();
  const queryClient = useQueryClient();
  return useMutation(
    () => {
      if (favourite) {
        return api.deleteFavourite({ favouriteId: favourite.id })();
      } else {
        return api.postFavourite({ image_id: id })();
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(allFavouritesQueryKey);
      },
    }
  );
};
