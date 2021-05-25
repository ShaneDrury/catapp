export class CatsApi {
  BASE_URL = "https://api.thecatapi.com/v1";

  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  uploaded = () => {
    return this._makeApiRequest("images/");
  }

  newCat = (catData) => {
    const catPicture = new FormData();
    catPicture.append("file", catData);
    return this._makeRequest("images/upload", "POST", catPicture);
  }

  deleteCat = (catId) => {
    return this._makeApiRequest(`images/${catId}`, "DELETE");
  }

  favourites = () => {
    return this._makeApiRequest("favourites/");
  }

  favouriteCat = (catId) => {
    return this._makeApiRequest("favourites/", "POST", { image_id: catId });
  }

  unfavouriteCat = (favouriteId) => {
    return this._makeApiRequest(`favourites/${favouriteId}`, "DELETE");
  }

  votes = () => {
    return this._makeApiRequest("votes/");
  }

  voteUp = (catId) => {
    return this._makeApiRequest("votes/", "POST", { image_id: catId, value: 1 });
  }

  voteDown = (catId) => {
    return this._makeApiRequest("votes/", "POST", { image_id: catId, value: 0 });
  }

  vvoteDown = (favouriteId) => {
    return this._makeApiRequest(`favourites/${favouriteId}`, "DELETE");
  }

  _makeApiRequest(url, method = "GET", body = undefined) {
    return apiRequest(`${this.BASE_URL}/${url}`, method, this.apiKey, body);
  }

  _makeRequest(url, method = "GET", body = undefined) {
    return uploadRequest(`${this.BASE_URL}/${url}`, method, this.apiKey, body);
  }
}

export const apiFromKey = () => {
  const apiKey = document.getElementById("cats-api").dataset.key;
  return new CatsApi(apiKey);
}

const apiRequest = async (url, method = "GET", apiKey, body = undefined) => {
  const response = await fetch(url, {
    method,
    body: JSON.stringify(body),
    headers: {
      "x-api-key": apiKey,
      "Content-type": "application/json"
    }
  })
  return response.json();
}

const uploadRequest = async (url, method = "GET", apiKey, body = undefined) => {
  const response = await fetch(url, {
    method,
    body,
    headers: {
      "x-api-key": apiKey,
    }
  })
  return response.json();
}
