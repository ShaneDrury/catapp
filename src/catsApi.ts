import { Cat, Favourite, Vote } from "./types";
import { Dsl, getClientHandlers } from "./api";

export const BASE_URL = "https://api.thecatapi.com/v1";

// TODO: Probably add page numbers for votes, as these go > 100 easily

const d = Dsl.empty();

const favouritesApi = d
  .path("favourites")
  .or(
    d.get<Favourite[]>(),
    d.or(
      d.capture(":favouriteId").delete_(),
      d.body<{ image_id: string }>("JSON").post()
    )
  );

const votesApi = d
  .path("votes")
  .or(
    d.get<Vote[]>(),
    d.or(
      d.body<{ image_id: string; value: 1 }>("JSON").post(),
      d.body<{ image_id: string; value: 0 }>("JSON").post()
    )
  );

const catsApi = d.path("images").queryParam<number>("limit").get<Cat[]>();

const uploadApi = d
  .path("images")
  .path("upload")
  .body<FormData>()
  .post<{ message: string }>();

export const api = d
  .header("x-api-key")
  .or(
    d.header("Content-type").or(catsApi, d.or(favouritesApi, votesApi)),
    uploadApi
  )
  .run();

const allEndpoints = getClientHandlers(api, BASE_URL, {}, {}, null);

export const makeApiCalls = (apiKey: string) => {
  const [jsonEndpoints, uploadCat] = allEndpoints(apiKey);
  const [
    getAllImages,
    [
      [getAllFavourites, [deleteFavourite, postFavourite]],
      [getAllVotes, [voteUp, voteDown]],
    ],
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
