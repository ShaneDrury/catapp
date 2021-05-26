import { render, screen } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import App from "./App";
import { BASE_URL } from "../catsApi";

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
  const { unmount } = render(<App />);

  const score = await screen.findByText(/Score: 2/i);
  expect(score).toBeInTheDocument();

  const favourite = await screen.findByText(/favourite/i);
  expect(favourite).toBeInTheDocument();

  const voteUp = await screen.findByText(/Vote up/i);
  expect(voteUp).toBeInTheDocument();
  unmount();
});
