import { render, screen } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import App from "./App";
import { apiFromKey, BASE_URL } from "../catsApi";
import { CatApiContext } from "../hooks";
import { QueryClient, QueryClientProvider } from "react-query";

const api = apiFromKey();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      suspense: true,
    },
  },
});

const WrappedApp = () => (
  <QueryClientProvider client={queryClient}>
    <CatApiContext.Provider value={api}>
      <App />
    </CatApiContext.Provider>
  </QueryClientProvider>
);

const server = setupServer(
  rest.get(`${BASE_URL}/images`, (req, res, ctx) => {
    return res(ctx.json([{ id: "cat_id", url: "some-url" }]));
  }),
  rest.get(`${BASE_URL}/favourites`, (req, res, ctx) => {
    return res(ctx.json([{ id: "favourite_id", image_id: "cat_id" }]));
  }),
  rest.get(`${BASE_URL}/votes`, (req, res, ctx) => {
    return res(
      ctx.json([
        { value: 1, image_id: "cat_id" },
        { value: 1, image_id: "cat_id" },
      ])
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("happy path, rendering the score and buttons", async () => {
  render(<WrappedApp />);

  expect(await screen.findByText(/Score: 2/i)).toBeInTheDocument();

  expect(await screen.findByText(/favourite/i)).toBeInTheDocument();

  expect(await screen.findByText(/Vote up/i)).toBeInTheDocument();
});
