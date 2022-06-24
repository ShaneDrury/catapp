import { getMockHandlers } from "../api";
import { api } from "../catsApi";

export const [
  [
    [mockAllImages],
    [mockAllFavourites, mockDeleteFavourites, mockPostFavourite],
    [mockAllVotes, mockVoteUp, mockVoteDown],
  ],
  mockUploadCat,
] = getMockHandlers(api, "");
