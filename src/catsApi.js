export class CatsApi {
  BASE_URL = "https://api.thecatapi.com/v1";

  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  uploaded = () => {
    return this._makeApiRequest({
      url: "images/",
      queryParams: { limit: 100 },
    });
  };

  newCat = (catData) => {
    const catPicture = new FormData();
    catPicture.append("file", catData);
    return this._makeRequest("images/upload", "POST", catPicture);
  };

  favourites = () => {
    return this._makeApiRequest({ url: "favourites" });
  };

  favouriteCat = (catId) => {
    return this._makeApiRequest({
      url: "favourites",
      method: "POST",
      body: { image_id: catId },
    });
  };

  unfavouriteCat = (favouriteId) => {
    return this._makeApiRequest({
      url: `favourites/${favouriteId}`,
      method: "DELETE",
    });
  };

  votes = () => {
    return this._makeApiRequest({ url: "votes" });
  };

  voteUp = (catId) => {
    return this._makeApiRequest({
      url: "votes",
      method: "POST",
      body: {
        image_id: catId,
        value: 1,
      },
    });
  };

  voteDown = (catId) => {
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
    body = undefined,
    queryParams = {},
  }) => {
    let items = [];
    let page = 0;

    while (true) {
      const response = await apiRequest(
        `${this.BASE_URL}/${url}`,
        method,
        this.apiKey,
        body,
        { ...queryParams, page }
      );
      const totalCount = response.headers.get("pagination-count");

      items = items.concat(response.json);
      page += 1;
      if (items.length >= totalCount) {
        break;
      }
    }

    return items;
  };

  _makeRequest = (url, method = "GET", body = undefined) => {
    return uploadRequest(`${this.BASE_URL}/${url}`, method, this.apiKey, body);
  };
}

export const apiFromKey = () => {
  const apiKey = document.getElementById("cats-api").dataset.key;
  return new CatsApi(apiKey);
};

const apiRequest = async (
  url,
  method = "GET",
  apiKey,
  body = undefined,
  queryParams = {}
) => {
  const searchParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    searchParams.append(key, value);
  });
  const response = await fetch(`${url}?${searchParams.toString()}`, {
    method,
    body: JSON.stringify(body),
    headers: {
      "x-api-key": apiKey,
      "Content-type": "application/json",
    },
  });
  const json = await response.json();
  return { json, headers: response.headers };
};

const uploadRequest = async (url, method = "GET", apiKey, body = undefined) => {
  const response = await fetch(url, {
    method,
    body,
    headers: {
      "x-api-key": apiKey,
    },
  });
  return response.json();
};
