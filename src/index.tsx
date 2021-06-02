import React from "react";
import ReactDOM from "react-dom";
import App from "./components/App";
import "bulma/css/bulma.min.css";

import { QueryClient, QueryClientProvider } from 'react-query'
import { apiFromKey } from "./catsApi";
import { CatApiContext } from "./hooks";

const queryClient = new QueryClient()

const api = apiFromKey();

ReactDOM.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <CatApiContext.Provider value={api}>
        <App />
      </CatApiContext.Provider>
    </QueryClientProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
