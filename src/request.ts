interface Request {
  url: string;
  method?: string;
  body?: BodyInit;
  queryParams?: { [key: string]: string };
  headers?: { [key: string]: string };
}

export const runRequest = async ({
  url,
  method = "GET",
  body,
  queryParams = {},
  headers,
}: Request) => {
  const searchParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    searchParams.append(key, value);
  });

  const request: RequestInit = {
    method,
    headers,
    body,
  };
  const response = await fetch(`${url}?${searchParams.toString()}`, request);
  const json = await response.json();
  if (response.ok) {
    return { json, headers: response.headers };
  } else {
    throw new Error(json.message);
  }
};
