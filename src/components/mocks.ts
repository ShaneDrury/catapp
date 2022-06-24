import { getMockHandlers } from "../api";
import { api } from "../catsApi";
import { server } from "./testing";

export const [
  [
    [mockAllImages],
    [mockAllFavourites, mockDeleteFavourites, mockPostFavourite],
    [mockAllVotes, mockVoteUp, mockVoteDown],
  ],
  mockUploadCat,
] = getMockHandlers(api, "", server);
