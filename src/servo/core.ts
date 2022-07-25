export type ApiMethod = "GET" | "POST" | "DELETE" | "OPTIONS";
export type ApiQueryParam = string;
export type ApiRequestBody = "JSON" | undefined;

export type Method<N> = { type: "METHOD"; data: ApiMethod; next: N };
export type Path<S, U> = { type: "PATH"; data: U; next: S };
export type Or<S, T> = { type: "OR"; next: [S, T] };
export type Any<T extends any[]> = { type: "ANY"; next: T };
export type Capture<S, C extends string> = {
  type: "CAPTURE";
  data: C;
  next: S;
};
export type Header<S, H extends string> = { type: "HEADER"; data: H; next: S };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type QueryParam<S, T = unknown> = {
  type: "QUERY_PARAM";
  data: ApiQueryParam;
  next: S;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Body<S, T = unknown> = {
  type: "BODY";
  requestBodyType?: ApiRequestBody;
  next: S;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type HeaderResponse<T, S extends number, H extends string> = {
  type: "HEADER_RESPONSE";
  status: S;
  headers: H[];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type PlainResponse<T, S extends number> = {
  type: "PLAIN_RESPONSE";
  status: S;
};

export type AnyResponse =
  | PlainResponse<any, any>
  | HeaderResponse<any, any, any>;

export type AnyApi =
  | Method<AnyResponse[]>
  | Capture<any, any>
  | Path<any, any>
  | Or<any, any>
  | Header<any, any>
  | QueryParam<any>
  | Body<any, any>
  | Any<any>;

export const getHeaders = (response: AnyResponse) => {
  if (response.type === "HEADER_RESPONSE") {
    return response.headers;
  }
};

export const getStatus = (response: AnyResponse): number => response.status;

export type ArrayObj<T extends string> = { [key in T]: string };
