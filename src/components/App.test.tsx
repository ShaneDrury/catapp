import {
  render,
  screen,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import App from "./App";
import { server, Wrapped } from "./testing";
import mocks from "../mocks/testMocks";
import { ok, response } from "servo/mocks";
import userEvent from "@testing-library/user-event";

beforeEach(() => {
  server.use(mocks.mockAllImages(ok([{ id: "cat_id", url: "some-url" }])));
  server.use(
    mocks.mockAllFavourites(ok([{ id: "favourite_id", image_id: "cat_id" }]))
  );
  // TODO: Check that vote up/down are separated
  // i.e. handle the body in the mock handler
  // could pass in body to data callback
  server.use(mocks.mockVoteUp(ok()));
  server.use(mocks.mockVoteDown(ok()));
  server.use(
    mocks.mockAllVotes(
      ok(
        [
          { value: 1, image_id: "cat_id" },
          { value: 1, image_id: "cat_id" },
        ],
        { "pagination-count": "2" }
      )
    )
  );
  server.use(mocks.mockPostFavourite(ok()));
  server.use(mocks.mockDeleteFavourite("favourite_id")(ok()));
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
  server.use(
    mocks.mockAllVotes(
      ok(
        [
          { value: 1, image_id: "cat_id" },
          { value: 1, image_id: "cat_id" },
        ],
        { "pagination-count": "2" }
      ),
      ok(
        [
          { value: 1, image_id: "cat_id" },
          { value: 1, image_id: "cat_id" },
          { value: 1, image_id: "cat_id" },
        ],
        { "pagination-count": "3" }
      ),
      ok(
        [
          { value: 1, image_id: "cat_id" },
          { value: 1, image_id: "cat_id" },
        ],
        { "pagination-count": "2" }
      ),
      ok([{ value: 1, image_id: "cat_id" }], { "pagination-count": "1" })
    )
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

test("favouriting a cat", async () => {
  server.use(
    mocks.mockAllFavourites(
      ok([{ id: "favourite_id", image_id: "cat_id" }]),
      ok([]),
      ok([{ id: "favourite_id", image_id: "cat_id" }])
    )
  );
  render(
    <Wrapped>
      <App />
    </Wrapped>
  );
  const unfavouriteButton = await screen.findByRole("button", {
    name: "Unfavourite cat cat_id",
  });
  expect(unfavouriteButton).toBeInTheDocument();
  await userEvent.click(unfavouriteButton);
  const favouriteButton = await screen.findByRole("button", {
    name: "Favourite cat cat_id",
  });
  expect(favouriteButton).toBeInTheDocument();
  await userEvent.click(favouriteButton);
  expect(
    await screen.findByRole("button", {
      name: "Unfavourite cat cat_id",
    })
  ).toBeInTheDocument();
});

test("vote pagination works", async () => {
  server.use(
    mocks.mockAllVotes(
      ok(
        [
          { value: 1, image_id: "cat_id" },
          { value: 1, image_id: "cat_id" },
          { value: 1, image_id: "cat_id" },
          { value: 1, image_id: "cat_id" },
          { value: 1, image_id: "cat_id" },
          { value: 1, image_id: "cat_id" },
          { value: 1, image_id: "cat_id" },
          { value: 1, image_id: "cat_id" },
          { value: 1, image_id: "cat_id" },
          { value: 1, image_id: "cat_id" },
        ],
        { "pagination-count": "11" }
      ),
      ok([{ value: 1, image_id: "cat_id" }], { "pagination-count": "11" })
    )
  );
  render(
    <Wrapped>
      <App />
    </Wrapped>
  );
  await waitForElementToBeRemoved(() => screen.queryByText("Loading!"));

  expect(await screen.findByText("Score: 11")).toBeInTheDocument();
});

test("cats fail to load", async () => {
  server.use(mocks.mockAllImages(response({ message: "Some error" }, 400)));
  render(
    <Wrapped>
      <App />
    </Wrapped>
  );
  await waitForElementToBeRemoved(() => screen.queryByText("Loading!"));

  expect(await screen.findByText("Error! Some error")).toBeInTheDocument();
});

test("favourites fail to load", async () => {
  server.use(mocks.mockAllFavourites(response({ message: "Some error" }, 400)));
  render(
    <Wrapped>
      <App />
    </Wrapped>
  );
  await waitForElementToBeRemoved(() => screen.queryByText("Loading!"));

  expect(await screen.findByText("Error! Some error")).toBeInTheDocument();
});

test("votes fail to load", async () => {
  server.use(mocks.mockAllVotes(response({ message: "Some error" }, 400)));
  render(
    <Wrapped>
      <App />
    </Wrapped>
  );
  await waitForElementToBeRemoved(() => screen.queryByText("Loading!"));

  expect(await screen.findByText("Error! Some error")).toBeInTheDocument();
});
