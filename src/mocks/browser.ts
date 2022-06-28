import { setupWorker } from "msw";

import { mockData } from "./mockData";
// This configures a Service Worker with the given request handlers.

export const worker = setupWorker(...mockData);
