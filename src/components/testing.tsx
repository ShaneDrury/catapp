import React from "react";
import { CatApiContext } from "../hooks";
import { QueryClient, QueryClientProvider } from "react-query";
import { api, apiFromKey, BASE_URL } from "../catsApi";
import { MemoryRouter } from "react-router-dom";
import { getMockHandlers } from "../api";

const apiClient = apiFromKey();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      suspense: true,
    },
  },
});

export const Wrapped = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>
    <QueryClientProvider client={queryClient}>
      <CatApiContext.Provider value={apiClient}>
        {children}
      </CatApiContext.Provider>
    </QueryClientProvider>
  </MemoryRouter>
);

export const [
  [mockAllImages, [mockAllFavourites, mockPostFavourite]],
  [mockAllVotes, mockUploadCat],
] = getMockHandlers(api, BASE_URL);
