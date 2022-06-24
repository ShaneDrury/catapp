import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import App from "./App";
import { mocker, Wrapped } from "./testing";
import * as mocks from "./mocks";
import { ok } from "../api";
import userEvent from "@testing-library/user-event";

test("happy path, rendering the score and buttons", async () => {
  mocker(mocks.mockAllImages(ok([{ id: "cat_id", url: "some-url" }])));
  mocker(
    mocks.mockAllFavourites(ok([{ id: "favourite_id", image_id: "cat_id" }]))
  );
  mocker(
    mocks.mockAllVotes(
      ok([
        { value: 1, image_id: "cat_id" },
        { value: 1, image_id: "cat_id" },
      ])
    )
  );
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
  mocker(mocks.mockAllImages(ok([{ id: "cat_id", url: "some-url" }])));
  mocker(
    mocks.mockAllFavourites(ok([{ id: "favourite_id", image_id: "cat_id" }]))
  );
  // TODO: Check that vote up/down are separated
  // i.e. handle the body in the mock handler
  mocker(mocks.mockVoteUp(ok({})));
  mocker(mocks.mockVoteDown(ok({})));
  mocker([
    mocks.mockAllVotes(
      ok([
        { value: 1, image_id: "cat_id" },
        { value: 1, image_id: "cat_id" },
      ])
    ),
    mocks.mockAllVotes(
      ok([
        { value: 1, image_id: "cat_id" },
        { value: 1, image_id: "cat_id" },
        { value: 1, image_id: "cat_id" },
      ])
    ),
    mocks.mockAllVotes(
      ok([
        { value: 1, image_id: "cat_id" },
        { value: 1, image_id: "cat_id" },
      ])
    ),
    mocks.mockAllVotes(ok([{ value: 1, image_id: "cat_id" }])),
  ]);
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
