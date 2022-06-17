import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";

import { QueryClient, QueryClientProvider } from "react-query";
import { apiFromKey } from "./catsApi";
import { CatApiContext } from "./hooks";
import GlobalErrorBoundary from "./components/GlobalErrorBoundary";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline } from "@mui/material";

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

const GlobalLoadingIndicator = () => <div>Loading!</div>;

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <CatApiContext.Provider value={api}>
        <GlobalErrorBoundary>
          <Suspense fallback={<GlobalLoadingIndicator />}>
            <BrowserRouter>
              <CssBaseline />
              <App />
            </BrowserRouter>
          </Suspense>
        </GlobalErrorBoundary>
      </CatApiContext.Provider>
    </QueryClientProvider>
  </React.StrictMode>
);
