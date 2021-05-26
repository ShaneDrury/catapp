import { Cat, Favourite, Vote } from "./types";
import { runRequest } from "./request";

interface ApiRequest {
  url: string;
  method?: string;
  body?: {};
  queryParams?: {};
}

export class CatsApi {
  BASE_URL = "https://api.thecatapi.com/v1";

  apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  uploaded = (): Promise<Cat[]> => {
    return this._makeApiRequest({
      url: "images/",
      queryParams: { limit: 100 },
    }) as Promise<Cat[]>;
  };

  newCat = (catData: File) => {
    const catPicture = new FormData();
    catPicture.append("file", catData);
    return this._makeRequest("images/upload", "POST", catPicture);
  };

  favourites = (): Promise<Favourite[]> => {
    return this._makeApiRequest({ url: "favourites" }) as Promise<Favourite[]>;
  };

  favouriteCat = (catId: string) => {
    return this._makeApiRequest({
      url: "favourites",
      method: "POST",
      body: { image_id: catId },
    });
  };

  unfavouriteCat = (favouriteId: string) => {
    return this._makeApiRequest({
      url: `favourites/${favouriteId}`,
      method: "DELETE",
    });
  };

  votes = (): Promise<Vote[]> => {
    return this._makeApiRequest({ url: "votes" }) as Promise<Vote[]>;
  };

  voteUp = (catId: string) => {
    return this._makeApiRequest({
      url: "votes",
      method: "POST",
      body: {
        image_id: catId,
        value: 1,
      },
    });
  };

  voteDown = (catId: string) => {
    return this._makeApiRequest({
      url: "votes",
      method: "POST",
      body: {
        image_id: catId,
        value: 0,
      },
    });
  };

  _makeApiRequest = async ({
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
        url: `${this.BASE_URL}/${url}`,
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

  _makeRequest = (url: string, method = "GET", body?: FormData) => {
    return runRequest({
      url: `${this.BASE_URL}/${url}`,
      method,
      headers: { "x-api-key": this.apiKey },
      body,
    });
  };
}

export const apiFromKey = () => {
  const catsDataEl = document.getElementById("cats-api");

  const apiKey = catsDataEl && catsDataEl.dataset.key;
  return new CatsApi(apiKey || "test-api-key");
};
