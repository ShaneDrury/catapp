import React from "react";
import { CatApiContext } from "../hooks";
import { QueryClient, QueryClientProvider } from "react-query";
import { apiFromKey } from "../catsApi";
import { MemoryRouter } from "react-router-dom";
import { MockApiData } from "../api";
import { setupServer, SetupServerApi } from "msw/node";
import { rest } from "msw";

const apiClient = apiFromKey("");

export const Wrapped = ({ children }: { children: React.ReactNode }) => {
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
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <CatApiContext.Provider value={apiClient}>
          {children}
        </CatApiContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

export const server = setupServer();

const MAP_METHOD_TO_MSW = {
  GET: rest.get,
  POST: rest.post,
  DELETE: rest.delete,
  OPTIONS: rest.options,
};

export const chainMock = (server: SetupServerApi) => {
  return (mocks: MockApiData[] | MockApiData) => {
    const arrayMocks = Array.isArray(mocks) ? mocks : [mocks];
    const resolvers: MockApiData[] = [...arrayMocks];
    const url = resolvers[0].url;
    const method = MAP_METHOD_TO_MSW[resolvers[0].method];
    return server.use(
      method(url, (req, res, context) => {
        const resolver = (
          resolvers.length > 1 ? resolvers.shift() : resolvers[0]
        ) as MockApiData;
        return resolver.handler(req, res, context);
      })
    );
  };
};

export const mocker = chainMock(server);
