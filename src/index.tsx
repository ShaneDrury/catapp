import React from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";
import "bulma/css/bulma.min.css";

import { QueryClient, QueryClientProvider } from "react-query";
import { apiFromKey } from "./catsApi";
import { CatApiContext } from "./hooks";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      suspense: true,
    },
  },
});

const api = apiFromKey();

const container = document.getElementById("root");
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <CatApiContext.Provider value={api}>
        <App />
      </CatApiContext.Provider>
    </QueryClientProvider>
  </React.StrictMode>
);
