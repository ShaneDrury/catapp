import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import App from "./App";
import { Wrapped } from "./testing";
import * as mocks from "./mocks";
import { ok } from "../api";
import userEvent from "@testing-library/user-event";

beforeEach(() => {
  mocks.mockAllImages(ok([{ id: "cat_id", url: "some-url" }]));
  mocks.mockAllFavourites(ok([{ id: "favourite_id", image_id: "cat_id" }]));
  // TODO: Check that vote up/down are separated
  // i.e. handle the body in the mock handler
  mocks.mockVoteUp(ok({}));
  mocks.mockVoteDown(ok({}));
  mocks.mockAllVotes(
    ok([
      { value: 1, image_id: "cat_id" },
      { value: 1, image_id: "cat_id" },
    ])
  );
});

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

test("voting on a cat", async () => {
  mocks.mockAllVotes(
    ok([
      { value: 1, image_id: "cat_id" },
      { value: 1, image_id: "cat_id" },
    ]),
    ok([
      { value: 1, image_id: "cat_id" },
      { value: 1, image_id: "cat_id" },
      { value: 1, image_id: "cat_id" },
    ]),
    ok([
      { value: 1, image_id: "cat_id" },
      { value: 1, image_id: "cat_id" },
    ]),
    ok([{ value: 1, image_id: "cat_id" }])
  );

  render(
    <Wrapped>
      <App />
    </Wrapped>
  );
  expect(await screen.findByText("Score: 2")).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Upvote cat cat_id" })
  );
  expect(await screen.findByText("Score: 3")).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Downvote cat cat_id" })
  );
  expect(await screen.findByText("Score: 2")).toBeInTheDocument();
  await userEvent.click(
    screen.getByRole("button", { name: "Downvote cat cat_id" })
  );
  expect(await screen.findByText("Score: 1")).toBeInTheDocument();
});
