import { generateMockHandlers } from "servo/mocks";
import { api } from "../api";

export const getMockHandlers = (baseUrl: string) => {
  const [
    [
      [mockAllImages],
      [mockAllFavourites, mockDeleteFavourite, mockPostFavourite],
      [mockAllVotes, mockVoteUp, mockVoteDown],
    ],
    mockUploadCat,
  ] = generateMockHandlers(api, baseUrl);
  return {
    mockAllImages,
    mockAllFavourites,
    mockDeleteFavourite,
    mockPostFavourite,
    mockAllVotes,
    mockVoteUp,
    mockVoteDown,
    mockUploadCat,
  };
};
