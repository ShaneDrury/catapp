import { Cat, Favourite, Vote } from "./types";
import { Dsl, getClientHandlers } from "./api";

export const BASE_URL = "https://api.thecatapi.com/v1";

// TODO: Probably add page numbers for votes, as these go > 100 easily

const d = Dsl.empty();

const favouritesApi = d
  .path("favourites")
  .any(
    d.get<Favourite[]>(),
    d.capture(":favouriteId").delete_(),
    d.body<{ image_id: string }>("JSON").post()
  );

const votesApi = d
  .path("votes")
  .any(
    d.get<Vote[]>(),
    d.body<{ image_id: string; value: 1 }>("JSON").post<{}>(),
    d.body<{ image_id: string; value: 0 }>("JSON").post<{}>()
  );

const catsApi = d
  .path("images")
  .any(d.queryParam<number>("limit").get<Cat[]>());

const uploadApi = d
  .path("images")
  .path("upload")
  .body<FormData>()
  .post<{ message: string }>();

export const api = d
  .header("x-api-key")
  .any(
    d.header("Content-type").any(catsApi, favouritesApi, votesApi),
    uploadApi
  )
  .run();

// could recursive functions take a second parameter which is next?

// export const apiTest = d
//   .header("x-api-key", [
//     d.header("Content-type", [catsApi, favouritesApi, votesApi]),
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
