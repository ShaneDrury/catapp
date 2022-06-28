import { ok } from "../api";
import { getMockHandlers } from "./handlers";

const {
  mockPostFavourite,
  mockDeleteFavourite,
  mockAllFavourites,
  mockAllVotes,
  mockVoteUp,
  mockVoteDown,
  mockAllImages,
  mockUploadCat,
} = getMockHandlers("https://api.thecatapi.com/v1");

export const mockData = [
  mockAllImages(ok([])),
  mockAllFavourites(ok([])),
  mockDeleteFavourite("favourite_id")(ok({})),
  mockPostFavourite(ok({})),
  mockAllVotes(ok([], { "pagination-count": "0" })),
  mockVoteUp(ok({})),
  mockVoteDown(ok({})),
  mockUploadCat(ok({})),
];
