import React from "react";
import { CatApiContext } from "../hooks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiFromKey } from "../api";
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
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: false,
            cacheTime: Infinity,
          },
        },
        logger: {
          log: console.log,
          warn: console.warn,
          error: () => {},
        },
      })
  );
  return (
    <QueryClientProvider client={queryClient}>
      <CatApiContext.Provider value={apiClient}>
        <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
      </CatApiContext.Provider>
    </QueryClientProvider>
  );
};

export const server = setupServer();
