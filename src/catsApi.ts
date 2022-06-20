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

interface ApiRequest {
  url: string;
  method?: string;
  body?: {};
  queryParams?: {};
}

export const BASE_URL = "https://api.thecatapi.com/v1";

export const api = combine(
  header("x-api-key"),
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
            combine(capture(":favouriteId"), delete_<undefined>())
          ),
          combine(body<{ image_id: string }>("JSON"), post<undefined>())
        )
      )
    ),
    or(
      combine(path("votes"), get<Vote[]>()),
      combine(
        path("images"),
        combine(path("upload"), post<{ message: string }>())
      )
    )
  )
);

const result = getClientHandlers(api, BASE_URL, {}, {}, null);

export const makeApiCalls = (apiKey: string) => {
  const [
    [getAllImages, [[getAllFavourites, deleteFavourite], postFavourite]],
    [getAllVotes, postCat],
  ] = result(apiKey);
  return {
    getAllImages,
    getAllFavourites,
    deleteFavourite,
    getAllVotes,
    postFavourite,
    postCat,
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

  voteUp = (catId: string) =>
    this._makeApiRequest({
      url: "votes",
      method: "POST",
      body: {
        image_id: catId,
        value: 1,
      },
    });

  voteDown = (catId: string) =>
    this._makeApiRequest({
      url: "votes",
      method: "POST",
      body: {
        image_id: catId,
        value: 0,
      },
    });

  private _makeApiRequest = async ({
    url,
    method = "GET",
    body,
    queryParams = {},
  }: ApiRequest): Promise<unknown> => {
    const jsonBody = JSON.stringify(body);
    let items: unknown[] = [];
    let page = 0;

    while (true) {
      const response = await runRequest({
        url: `${BASE_URL}/${url}`,
        method,
        body: jsonBody,
        queryParams: { ...queryParams, page: page.toString() },
        headers: {
          "x-api-key": this.apiKey,
          "Content-type": "application/json",
        },
      });
      const totalCount = parseInt(
        response.headers.get("pagination-count") || "0",
        10
      );

      items = items.concat(response.json);
      page += 1;
      if (items.length >= totalCount) {
        break;
      }
    }

    return items;
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
