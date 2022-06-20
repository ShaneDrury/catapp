import { Cat, Favourite, Vote } from "./types";
import {
  body,
  capture,
  combine,
  delete_,
  get,
  getClientHandlers,
  header,
  or,
  path,
  post,
  queryParam,
} from "./api";

// TODO: Implement with classes to allow e.g.
// const api2 = apiDsl((p, cap) => {
//   p("images").get<Cat[]>();
//   p("favourites").get<Favourite[]>().or(cap(":favouriteId").get<Favourite>());
//   p("votes").get<Vote[]>();
//   p("images").p("upload").post<{ message: string }>();
// });
// where 'newline' is 'Or'
// would help with unpacking as a top level array

export const BASE_URL = "https://api.thecatapi.com/v1";

// TODO: Probably add page numbers for votes, as these go > 100 easily

export const api = combine(
  header("x-api-key"),
  or(
    combine(
      header("Content-type"),
      or(
        or(
          combine(
            path("images"),
            combine(queryParam<number>("limit"), get<Cat[]>())
          ),
          combine(
            path("favourites"),
            or(
              or(
                get<Favourite[]>(),
                combine(capture(":favouriteId"), delete_())
              ),
              combine(body<{ image_id: string }>("JSON"), post())
            )
          )
        ),
        combine(
          path("votes"),
          or(
            get<Vote[]>(),
            or(
              combine(body<{ image_id: string; value: 1 }>("JSON"), post()),
              combine(body<{ image_id: string; value: 0 }>("JSON"), post())
            )
          )
        )
      )
    ),
    combine(
      path("images"),
      combine(
        path("upload"),
        combine(body<FormData>(), post<{ message: string }>())
      )
    )
  )
);

const allEndpoints = getClientHandlers(api, BASE_URL, {}, {}, null);

export const makeApiCalls = (apiKey: string) => {
  const [jsonEndpoints, uploadCat] = allEndpoints(apiKey);
  const [
    [getAllImages, [[getAllFavourites, deleteFavourite], postFavourite]],
    [getAllVotes, [voteUp, voteDown]],
  ] = jsonEndpoints("application/json");
  return {
    getAllImages,
    getAllFavourites,
    deleteFavourite,
    getAllVotes,
    postFavourite,
    uploadCat,
    voteUp,
    voteDown,
  };
};

export const apiFromKey = () => {
  const catsDataEl = document.getElementById("cats-api");

  const apiKey = catsDataEl && catsDataEl.dataset.key;
  return makeApiCalls(apiKey || "test-api-key");
};
