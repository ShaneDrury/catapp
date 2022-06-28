import { Cat, Favourite, Vote } from "./types";
import { Dsl, getClientHandlers, r, withHeaders } from "./api";

export const BASE_URL = "https://api.thecatapi.com/v1";

const d = Dsl.empty();

const favouritesApi = d
  .path("favourites")
  .any(
    d.get(r<Favourite[]>()),
    d.capture(":favouriteId").delete_(r()),
    d.body<{ image_id: string }>("JSON").post(r())
  );

const votesApi = d
  .path("votes")
  .any(
    d
      .queryParam<number>("page")
      .get(withHeaders("pagination-count")(r<Vote[]>())),
    d.body<{ image_id: string; value: 1 }>("JSON").post(r()),
    d.body<{ image_id: string; value: 0 }>("JSON").post(r())
  );

const catsApi = d
  .path("images")
  .any(d.queryParam<number>("limit").get(r<Cat[]>()));

const uploadApi = d.path("images").path("upload").body<FormData>().post(r());

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
