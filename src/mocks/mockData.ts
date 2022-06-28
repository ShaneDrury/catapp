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
  mockAllImages(
    ok([
      { id: "1", url: "logo512.png" },
      { id: "2", url: "logo512.png" },
    ])
  ),
  mockAllFavourites(ok([{ id: "1", image_id: "1" }])),
  mockDeleteFavourite("favourite_id")(ok({})),
  mockPostFavourite(ok({})),
  mockAllVotes(
    ok(
      [
        { value: 1, image_id: "1" },
        { value: 1, image_id: "1" },
      ],
      { "pagination-count": "4" }
    ),
    ok(
      [
        { value: 1, image_id: "1" },
        { value: 1, image_id: "1" },
        { value: 1, image_id: "2" },
      ],
      { "pagination-count": "4" }
    )
  ),
  mockVoteUp(ok({})),
  mockVoteDown(ok({})),
  mockUploadCat(ok({})),
];
