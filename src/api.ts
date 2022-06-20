import { rest, RestHandler } from "msw";
import { runRequest } from "./request";

type ApiPath = string;
type ApiCapture = string;
type ApiMethod = "GET" | "POST" | "DELETE";
type ApiHeader = string;
type ApiQueryParam = string;
type ApiRequestBody = "JSON" | undefined;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Method<T = void> = { type: "METHOD"; data: ApiMethod };
type Path<S> = { type: "PATH"; data: ApiPath; next: S };
type Or<S, T> = { type: "OR"; next: [S, T] };
type Capture<S> = { type: "CAPTURE"; data: ApiCapture; next: S };
type Header<S> = { type: "HEADER"; data: ApiHeader; next: S };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type QueryParam<S, T = unknown> = {
  type: "QUERY_PARAM";
  data: ApiQueryParam;
  next: S;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Body<T, S> = {
  type: "BODY";
  requestBodyType?: ApiRequestBody;
  next: S;
};

export const get = <T>(): Method<T> => ({ type: "METHOD", data: "GET" });
export const post = <T = void>(): Method<T> => ({
  type: "METHOD",
  data: "POST",
});
export const delete_ = <T = void>(): Method<T> => ({
  type: "METHOD",
  data: "DELETE",
});

export const path =
  (url: ApiPath) =>
  <A>(next: A): Path<A> => ({
    type: "PATH",
    data: url,
    next,
  });

export const capture =
  (c: ApiPath) =>
  <A>(next: A): Capture<A> => ({
    type: "CAPTURE",
    data: c,
    next,
  });

export const header =
  (name: string) =>
  <A>(next: A): Header<A> => ({
    type: "HEADER",
    data: name,
    next,
  });

export const queryParam =
  <T>(name: string) =>
  <A>(next: A): QueryParam<A, T> => ({
    type: "QUERY_PARAM",
    data: name,
    next,
  });

export const body =
  <T>(requestBody?: ApiRequestBody) =>
  <A>(next: A): Body<T, A> => ({
    type: "BODY",
    requestBodyType: requestBody,
    next,
  });

export const or = <S, T>(x1: S, x2: T): Or<S, T> => ({
  type: "OR",
  next: [x1, x2],
});

export const combine = <A, B>(x1: (x: A) => B, x2: A) => x1(x2);

type Paths<R> = R extends Path<infer N>
  ? Paths<N>
  : R extends Or<infer N, infer M>
  ? [Paths<N>, Paths<M>]
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
  R extends Method<infer T>
  ? string
  : R extends Capture<infer S>
  ? (c: string) => Paths<S>
  : R extends Header<infer S>
  ? Paths<S>
  : R extends QueryParam<infer S>
  ? Paths<S>
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
  R extends Body<infer T, infer S>
  ? Paths<S>
  : never;

type AnyApi =
  | Method<any>
  | Capture<any>
  | Path<any>
  | Or<any, any>
  | Header<any>
  | QueryParam<any>
  | Body<any, any>;

function getPathsAcc<A extends AnyApi>(a: A, acc: string): Paths<typeof a> {
  switch (a.type) {
    case "METHOD": {
      return acc as Paths<typeof a>;
    }
    case "PATH": {
      const nextAcc = `${acc}/${a.data}`;
      return getPathsAcc(a.next, nextAcc) as Paths<typeof a>;
    }
    case "OR": {
      const [l, r] = a.next;
      return [getPathsAcc(l, acc), getPathsAcc(r, acc)] as Paths<typeof a>;
    }
    case "CAPTURE": {
      return ((c: string) => getPathsAcc(a.next, `${acc}/${c}`)) as Paths<
        typeof a
      >;
    }
    default: {
      return getPathsAcc(a.next, acc) as Paths<typeof a>;
    }
  }
}

export const getPaths = <A extends AnyApi>(a: A) => getPathsAcc(a, "");

type Response<T> = { statusCode: number; data: T };

export const ok = <T>(data: T): Response<T> => ({ statusCode: 200, data });
export const serverError = <T>(data: T): Response<T> => ({
  statusCode: 500,
  data,
});

type MockHandler<R> = R extends Path<infer N>
  ? MockHandler<N>
  : R extends Or<infer N, infer M>
  ? [MockHandler<N>, MockHandler<M>]
  : R extends Method<infer T>
  ? (s: Response<T>) => RestHandler
  : R extends Capture<infer S>
  ? (c: string) => MockHandler<S>
  : R extends Header<infer S>
  ? MockHandler<S>
  : R extends QueryParam<infer S>
  ? MockHandler<S>
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
  R extends Body<infer T, infer S>
  ? MockHandler<S>
  : never;

const MAP_METHOD_TO_MSW = {
  GET: rest.get,
  POST: rest.post,
  DELETE: rest.delete,
};

export function getMockHandlers<A extends AnyApi>(
  a: A,
  path: string
): MockHandler<typeof a> {
  switch (a.type) {
    case "METHOD": {
      const method = MAP_METHOD_TO_MSW[a.data];
      return (({ statusCode, data }: Response<any>) => {
        return method(path, (req, res, ctx) =>
          res(ctx.status(statusCode), ctx.json(data))
        );
      }) as MockHandler<typeof a>;
    }
    case "PATH": {
      const nextAcc = `${path}/${a.data}`;
      return getMockHandlers(a.next, nextAcc) as MockHandler<typeof a>;
    }
    case "OR": {
      const [l, r] = a.next;
      return [
        getMockHandlers(l, path),
        getMockHandlers(r, path),
      ] as MockHandler<typeof a>;
    }
    case "CAPTURE": {
      return ((c: string) =>
        getMockHandlers(a.next, `${path}/${c}`)) as MockHandler<typeof a>;
    }
    default: {
      return getMockHandlers(a.next, path) as MockHandler<typeof a>;
    }
  }
}

type ClientHandler<R> = R extends Path<infer N>
  ? ClientHandler<N>
  : R extends Or<infer N, infer M>
  ? [ClientHandler<N>, ClientHandler<M>]
  : R extends Method<infer T>
  ? () => Promise<T>
  : R extends Capture<infer S>
  ? (c: string) => ClientHandler<S>
  : R extends Header<infer S>
  ? (header: string) => ClientHandler<S>
  : R extends QueryParam<infer S, infer T>
  ? (queryParam: T) => ClientHandler<S>
  : R extends Body<infer T, infer S>
  ? (body: T) => ClientHandler<S>
  : never;

export function getClientHandlers<A extends AnyApi>(
  a: A,
  path: string,
  headers: HeadersInit,
  queryParams: Record<string, string>,
  body: BodyInit | null
): ClientHandler<typeof a> {
  switch (a.type) {
    case "METHOD": {
      return (async () => {
        const response = await runRequest({
          url: path,
          method: a.data,
          queryParams,
          headers,
          body,
        });
        return response.json;
      }) as ClientHandler<typeof a>;
    }
    case "PATH": {
      const nextAcc = `${path}/${a.data}`;
      return getClientHandlers(
        a.next,
        nextAcc,
        headers,
        queryParams,
        body
      ) as ClientHandler<typeof a>;
    }
    case "OR": {
      const [l, r] = a.next;
      return [
        getClientHandlers(l, path, headers, queryParams, body),
        getClientHandlers(r, path, headers, queryParams, body),
      ] as ClientHandler<typeof a>;
    }
    case "CAPTURE": {
      return ((c: string) =>
        getClientHandlers(
          a.next,
          `${path}/${c}`,
          headers,
          queryParams,
          body
        )) as ClientHandler<typeof a>;
    }
    case "HEADER": {
      return ((h: string) =>
        getClientHandlers(
          a.next,
          path,
          { ...headers, [a.data]: h },
          queryParams,
          body
        )) as ClientHandler<typeof a>;
    }
    case "QUERY_PARAM": {
      return ((queryParam: any) =>
        getClientHandlers(
          a.next,
          path,
          headers,
          {
            ...queryParams,
            [a.data]: queryParam.toString(),
          },
          body
        )) as ClientHandler<typeof a>;
    }
    case "BODY": {
      return ((reqBody: any) =>
        getClientHandlers(
          a.next,
          path,
          headers,
          queryParams,
          a.requestBodyType === "JSON" ? JSON.stringify(reqBody) : reqBody
        )) as ClientHandler<typeof a>;
    }
  }
}
