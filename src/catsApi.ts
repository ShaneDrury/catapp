import { Cat, Favourite, Vote } from "./types";
import { runRequest } from "./request";
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
            or(get<Favourite[]>(), combine(capture(":favouriteId"), delete_())),
            combine(body<{ image_id: string }>("JSON"), post())
          )
        )
      ),
      or(
        combine(
          path("votes"),
          or(
            get<Vote[]>(),
            or(
              combine(body<{ image_id: string; value: 1 }>("JSON"), post()),
              combine(body<{ image_id: string; value: 0 }>("JSON"), post())
            )
          )
        ),
        combine(
          path("images"),
          combine(path("upload"), post<{ message: string }>())
        )
      )
    )
  )
);

const result = getClientHandlers(api, BASE_URL, {}, {}, null);

export const makeApiCalls = (apiKey: string) => {
  const [
    [getAllImages, [[getAllFavourites, deleteFavourite], postFavourite]],
    [[getAllVotes, [voteUp, voteDown]], postCat],
  ] = result(apiKey)("application/json");
  return {
    getAllImages,
    getAllFavourites,
    deleteFavourite,
    getAllVotes,
    postFavourite,
    postCat,
    voteUp,
    voteDown,
  };
};

export class CatsApi {
  apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  uploaded = (): Promise<Cat[]> => {
    const { getAllImages } = makeApiCalls(this.apiKey);
    return getAllImages(100)();
  };

  newCat = (catData: File) => {
    const catPicture = new FormData();
    catPicture.append("file", catData);
    return this._makeRequest("images/upload", "POST", catPicture);
  };

  favourites = (): Promise<Favourite[]> => {
    const { getAllFavourites } = makeApiCalls(this.apiKey);
    return getAllFavourites();
  };

  favouriteCat = (catId: string) => {
    const { postFavourite } = makeApiCalls(this.apiKey);
    return postFavourite({ image_id: catId })();
  };

  unfavouriteCat = (favouriteId: string) => {
    const { deleteFavourite } = makeApiCalls(this.apiKey);
    return deleteFavourite(favouriteId)();
  };

  votes = (): Promise<Vote[]> => {
    const { getAllVotes } = makeApiCalls(this.apiKey);
    return getAllVotes();
  };

  voteUp = (catId: string) => {
    const { voteUp } = makeApiCalls(this.apiKey);
    return voteUp({
      image_id: catId,
      value: 1,
    })();
  };

  voteDown = (catId: string) => {
    const { voteDown } = makeApiCalls(this.apiKey);
    return voteDown({
      image_id: catId,
      value: 0,
    })();
  };

  private _makeRequest = (url: string, method = "GET", body: FormData | null) =>
    runRequest({
      url: `${BASE_URL}/${url}`,
      method,
      headers: { "x-api-key": this.apiKey },
      body,
    });
}

export const apiFromKey = () => {
  const catsDataEl = document.getElementById("cats-api");

  const apiKey = catsDataEl && catsDataEl.dataset.key;
  return new CatsApi(apiKey || "test-api-key");
};
