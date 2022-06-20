import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import { setupServer } from "msw/node";
import App from "./App";
import {
  mockAllFavourites,
  mockAllImages,
  mockAllVotes,
  Wrapped,
} from "./testing";
import { ok } from "../api";

const server = setupServer(
  mockAllImages(ok([{ id: "cat_id", url: "some-url" }])),
  mockAllFavourites(ok([{ id: "favourite_id", image_id: "cat_id" }])),
  mockAllVotes(
    ok([
      { value: 1, image_id: "cat_id" },
      { value: 1, image_id: "cat_id" },
    ])
  )
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
