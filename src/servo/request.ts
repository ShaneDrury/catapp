interface Request {
  url: string;
  method?: string;
  body: BodyInit | null;
  queryParams?: { [key: string]: string };
  headers?: HeadersInit;
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
  return fetch(`${url}?${searchParams.toString()}`, request);
};
