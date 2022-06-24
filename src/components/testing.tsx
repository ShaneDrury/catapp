import React from "react";
import { CatApiContext } from "../hooks";
import { QueryClient, QueryClientProvider } from "react-query";
import { apiFromKey } from "../catsApi";
import { MemoryRouter } from "react-router-dom";
import { setupServer } from "msw/node";

const apiClient = apiFromKey("");

export const Wrapped = ({
  children,
  initialEntries,
}: {
  children: React.ReactNode;
  initialEntries?: string[];
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        suspense: true,
        retry: false,
      },
    },
  });
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>
        <CatApiContext.Provider value={apiClient}>
          {children}
        </CatApiContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

export const server = setupServer();
