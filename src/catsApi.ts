interface ApiRequest {
  url: string;
  method?: string;
  body?: {};
  queryParams?: {};
}

export interface Favourite {
  id: string;
  image_id: string;
}

export interface Vote {
  value: number;
  image_id: string;
}

export interface Cat {
  id: string;
  url: string;
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
    let items: unknown[] = [];
    let page = 0;

    while (true) {
      const response = await apiRequest(
        `${this.BASE_URL}/${url}`,
        method,
        this.apiKey,
        body,
        { ...queryParams, page: page.toString() }
      );
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
    return uploadRequest(`${this.BASE_URL}/${url}`, method, this.apiKey, body);
  };
}

export const apiFromKey = () => {
  const catsDataEl = document.getElementById("cats-api");

  const apiKey = catsDataEl && catsDataEl.dataset.key;
  return new CatsApi(apiKey || "test-api-key");
};

const apiRequest = async (
  url: string,
  method = "GET",
  apiKey: string,
  body?: {},
  queryParams: { [key: string]: string } = {}
) => {
  const searchParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    searchParams.append(key, value);
  });

  const request: RequestInit = {
    method,
    headers: {
      "x-api-key": apiKey,
      "Content-type": "application/json",
    },
  };
  if (body) {
    request.body = JSON.stringify(body);
  }
  const response = await fetch(`${url}?${searchParams.toString()}`, request);
  const json = await response.json();
  return { json, headers: response.headers };
};

const uploadRequest = async (
  url: string,
  method = "GET",
  apiKey: string,
  body?: FormData
) => {
  const response = await fetch(url, {
    method,
    body,
    headers: {
      "x-api-key": apiKey,
    },
  });
  return response.json();
};
