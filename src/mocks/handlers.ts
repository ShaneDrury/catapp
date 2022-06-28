import { generateMockHandlers } from "../api";
import { api } from "../catsApi";

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
