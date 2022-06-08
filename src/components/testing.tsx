import React from "react";
import { CatApiContext } from "../hooks";
import { QueryClient, QueryClientProvider } from "react-query";
import { apiFromKey } from "../catsApi";
import { MemoryRouter } from "react-router-dom";

const api = apiFromKey();

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
      <CatApiContext.Provider value={api}>{children}</CatApiContext.Provider>
    </QueryClientProvider>
  </MemoryRouter>
);
