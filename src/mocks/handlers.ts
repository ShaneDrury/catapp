import { getRuntimeMockHandlers, ok } from "../api";
import { api } from "../catsApi";

const [
  [
    [mockAllImages],
    [mockAllFavourites, mockDeleteFavourite, mockPostFavourite],
    [mockAllVotes, mockVoteUp, mockVoteDown],
  ],
  mockUploadCat,
] = getRuntimeMockHandlers(api, "https://api.thecatapi.com/v1");

export const handlers = [
  mockAllImages(ok([])),
  mockAllFavourites(ok([])),
  mockDeleteFavourite("favourite_id")(ok({})),
  mockPostFavourite(ok({})),
  mockAllVotes(ok([], { "pagination-count": "0" })),
  mockVoteUp(ok({})),
  mockVoteDown(ok({})),
  mockUploadCat(ok({})),
];
