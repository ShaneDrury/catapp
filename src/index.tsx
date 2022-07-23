import React from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiFromKey, BASE_URL } from "./catsApi";
import { CatApiContext } from "./hooks";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline } from "@mui/material";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const api = apiFromKey(BASE_URL);

const container = document.getElementById("root");
const root = createRoot(container!);

if (process.env.NODE_ENV === "development") {
  // const { worker } = require("./mocks/browser");
  // worker.start();
}

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <CatApiContext.Provider value={api}>
        <BrowserRouter>
          <CssBaseline />
          <App />
        </BrowserRouter>
      </CatApiContext.Provider>
    </QueryClientProvider>
  </React.StrictMode>
);
