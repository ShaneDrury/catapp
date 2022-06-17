import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import App from "./App";
import { BASE_URL } from "../catsApi";
import { Wrapped } from "./testing";

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
  render(
    <Wrapped>
      <App />
    </Wrapped>
  );
  await waitForElementToBeRemoved(() => screen.queryByText("Loading!"));

  expect(await screen.findByText("Score: 2")).toBeInTheDocument();

  expect(
    screen.getByRole("button", { name: "Unfavourite cat cat_id" })
  ).toBeInTheDocument();

  expect(
    screen.getByRole("button", { name: "Upvote cat cat_id" })
  ).toBeInTheDocument();

  expect(
    screen.getByRole("button", { name: "Downvote cat cat_id" })
  ).toBeInTheDocument();
});
