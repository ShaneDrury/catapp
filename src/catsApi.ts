import { Cat, Favourite, Vote } from "./types";
import {
  badRequest,
  r,
  withHeaders,
  get,
  path,
  body,
  queryParam,
  capture,
  header,
} from "servo/dsl";
import { getClientHandlers } from "servo/clientHandlers";

export const BASE_URL = "https://api.thecatapi.com/v1";

const favouritesApi = path("favourites").any(
  get(r<Favourite[]>(), badRequest<{ message: string }>()),
  capture("favouriteId").delete_(r()),
  body<{ image_id: string }>("JSON").post(r())
);

const votesApi = path("votes").any(
  queryParam<number>("page").get(
    withHeaders("pagination-count")(r<Vote[]>()),
    badRequest<{ message: string }>()
  ),
  body<{ image_id: string; value: 1 }>("JSON").post(r()),
  body<{ image_id: string; value: 0 }>("JSON").post(r())
);

const catsApi = path("images").any(
  queryParam<number>("limit").get(r<Cat[]>(), badRequest<{ message: string }>())
);

const uploadApi = path("images")
  .path("upload")
  .body<FormData>()
  .post(r(), badRequest<{ message: string }>());

export const api = header("x-api-key")
  .any(header("Content-type").any(catsApi, favouritesApi, votesApi), uploadApi)
  .run();

// could recursive functions take a second parameter which is next?

// export const apiTest =
//   header("x-api-key", [
//     header("Content-type", [catsApi, favouritesApi, votesApi]),
//     uploadApi,
//   ])

export const makeApiCalls = (apiKey: string, baseUrl: string) => {
  const allEndpoints = getClientHandlers(api, baseUrl, {}, {}, null);
  const [jsonEndpoints, uploadCat] = allEndpoints(apiKey);
  const [
    [getAllImages],
    [getAllFavourites, deleteFavourite, postFavourite],
    [getAllVotes, voteUp, voteDown],
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

export const apiFromKey = (baseUrl: string) => {
  const catsDataEl = document.getElementById("cats-api");

  const apiKey = catsDataEl && catsDataEl.dataset.key;
  return makeApiCalls(apiKey || "test-api-key", baseUrl);
};
