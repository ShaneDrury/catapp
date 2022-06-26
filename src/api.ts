import { MockedRequest, ResponseResolver, rest, RestContext } from "msw";
import { runRequest } from "./request";
import { SetupServerApi } from "msw/node";

type ApiPath = string;
type ApiCapture = string;
type ApiMethod = "GET" | "POST" | "DELETE" | "OPTIONS";
type ApiHeader = string;
type ApiQueryParam = string;
type ApiRequestBody = "JSON" | undefined;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Method<N> = { type: "METHOD"; data: ApiMethod; next: N };
type Path<S> = { type: "PATH"; data: ApiPath; next: S };
type Or<S, T> = { type: "OR"; next: [S, T] };
type Any<T extends any[]> = { type: "ANY"; next: T };
type Capture<S> = { type: "CAPTURE"; data: ApiCapture; next: S };
type Header<S> = { type: "HEADER"; data: ApiHeader; next: S };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type QueryParam<S, T = unknown> = {
  type: "QUERY_PARAM";
  data: ApiQueryParam;
  next: S;
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Body<S, T = unknown> = {
  type: "BODY";
  requestBodyType?: ApiRequestBody;
  next: S;
};

export const get = <N>(next: N): Method<N> => ({
  type: "METHOD",
  data: "GET",
  next,
});
export const post = <N>(next: N): Method<N> => ({
  type: "METHOD",
  data: "POST",
  next,
});
export const delete_ = <N>(next: N): Method<N> => ({
  type: "METHOD",
  data: "DELETE",
  next,
});
export const options = <N>(next: N): Method<N> => ({
  type: "METHOD",
  data: "OPTIONS",
  next,
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
  <A>(next: A): Body<A, T> => ({
    type: "BODY",
    requestBodyType: requestBody,
    next,
  });

export const or = <S, T>(x1: S, x2: T): Or<S, T> => ({
  type: "OR",
  next: [x1, x2],
});

export const any = <T extends any[]>(...xs: T): Any<T> => ({
  type: "ANY",
  next: xs,
});

export const combine = <A, B>(x1: (x: A) => B, x2: A) => x1(x2);

type AddPath<T> = T extends [infer F, ...infer Rest]
  ? [Path<F>, ...AddPath<Rest>]
  : [];

type Paths<R> = R extends Path<infer N>
  ? Paths<N>
  : R extends Or<infer N, infer M>
  ? [Paths<N>, Paths<M>]
  : R extends Any<infer P>
  ? AddPath<P>
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
  R extends Method<infer T>
  ? string
  : R extends Capture<infer S>
  ? (c: string) => Paths<S>
  : R extends Header<infer S>
  ? Paths<S>
  : R extends QueryParam<infer S>
  ? Paths<S>
  : R extends Body<infer S>
  ? Paths<S>
  : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type JsonResponse<T> = {
  type: "JSON_RESPONSE";
};

type HeaderResponse<N, S extends string> = {
  type: "HEADER_RESPONSE";
  headers: S[];
  next: N;
};

type AnyResponse = JsonResponse<any> | HeaderResponse<any, any>;

type AnyApi =
  | Method<AnyResponse>
  | Capture<any>
  | Path<any>
  | Or<any, any>
  | Header<any>
  | QueryParam<any>
  | Body<any, any>
  | Any<any>;

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
    case "ANY": {
      const xs = a.next;
      return xs.map((x: A) => getPathsAcc(x, acc)) as Paths<typeof a>;
    }
    default: {
      return getPathsAcc(a.next, acc) as Paths<typeof a>;
    }
  }
}

export const getPaths = <A extends AnyApi>(a: A) => getPathsAcc(a, "");

type Response<T, S extends string | undefined = undefined> = S extends string
  ? {
      statusCode: number;
      data: T;
      headers: ArrayObj<S>;
    }
  : {
      statusCode: number;
      data: T;
    };

// consider just inlining N/next instead of higher order
export const withHeaders =
  <S extends string>(...headers: S[]) =>
  <N>(next: N): HeaderResponse<N, typeof headers[number]> => ({
    type: "HEADER_RESPONSE",
    headers,
    next,
  });

export const jsonResponse = <T>(): JsonResponse<T> => ({
  type: "JSON_RESPONSE",
});

export const r = jsonResponse;

// TODO: Could make this a class based dsl
// withHeaders(["foo"] as const).jsonResponse<string>()

export const ok = <T, H extends string>(
  data: T,
  headers?: { [key in H]: string }
): H extends string ? Response<T, H> : Response<T> =>
  ({
    statusCode: 200,
    data,
    ...(headers && { headers }),
  } as any);

export const serverError = <T>(data: T): Response<T> => ({
  statusCode: 500,
  data,
});

type AddMockHandler<T> = T extends [infer F, ...infer Rest]
  ? [MockHandler<F>, ...AddMockHandler<Rest>]
  : [];

type MockHandlerFromResponse<T> = T extends JsonResponse<infer D>
  ? {
      statusCode: number;
      data: D;
    }
  : T extends HeaderResponse<infer N, infer S>
  ? MockHandlerFromResponse<N> & { headers: ArrayObj<S> }
  : never;

type MockHandler<R> = R extends Path<infer N>
  ? MockHandler<N>
  : R extends Or<infer N, infer M>
  ? [MockHandler<N>, MockHandler<M>]
  : R extends Any<infer P>
  ? AddMockHandler<P>
  : R extends Method<infer T>
  ? (...s: MockHandlerFromResponse<T>[]) => void
  : R extends Capture<infer S>
  ? (c: string) => MockHandler<S>
  : R extends Header<infer S>
  ? MockHandler<S>
  : R extends QueryParam<infer S>
  ? MockHandler<S>
  : R extends Body<infer S>
  ? MockHandler<S>
  : never;

const MAP_METHOD_TO_MSW = {
  GET: rest.get,
  POST: rest.post,
  DELETE: rest.delete,
  OPTIONS: rest.options,
};

export function getMockHandlers<A extends AnyApi>(
  a: A,
  path: string,
  server: SetupServerApi
): MockHandler<typeof a> {
  switch (a.type) {
    case "METHOD": {
      return (<T, S extends string>(...mockData: Response<T, S>[]) => {
        // TODO: Specify content type in api, then can use json/other stuff here
        const mockDataArray: Response<T, S>[] = [...mockData];
        const method = MAP_METHOD_TO_MSW[a.data];
        // inspect responseType
        // e.g. if header, we grab those headers from response
        // and return something different
        // if not just return directly
        return server.use(
          method(path, (req, res, context) => {
            const { statusCode, data, headers } = (
              mockDataArray.length > 1
                ? mockDataArray.shift()
                : mockDataArray[0]
            ) as Response<T, S>;
            const handler: ResponseResolver<MockedRequest, RestContext> = (
              req,
              res,
              ctx
            ) => {
              if (a.next.type === "HEADER_RESPONSE") {
                const responseHeaders = a.next.headers.map((key) =>
                  ctx.set(key, headers[key])
                );
                return res(
                  ctx.status(statusCode),
                  ctx.json<T>(data),
                  ...responseHeaders
                );
              }
              return res(ctx.status(statusCode), ctx.json<T>(data));
            };
            return handler(req, res, context);
          })
        );
      }) as MockHandler<typeof a>;
    }
    case "PATH": {
      const nextAcc = `${path}/${a.data}`;
      return getMockHandlers(a.next, nextAcc, server) as MockHandler<typeof a>;
    }
    case "OR": {
      const [l, r] = a.next;
      return [
        getMockHandlers(l, path, server),
        getMockHandlers(r, path, server),
      ] as MockHandler<typeof a>;
    }
    case "ANY": {
      const xs = a.next;
      return xs.map((x: A) => getMockHandlers(x, path, server)) as MockHandler<
        typeof a
      >;
    }
    case "CAPTURE": {
      return ((c: string) =>
        getMockHandlers(a.next, `${path}/${c}`, server)) as MockHandler<
        typeof a
      >;
    }
    default: {
      return getMockHandlers(a.next, path, server) as MockHandler<typeof a>;
    }
  }
}

type AddClientHandler<T> = T extends [infer F, ...infer Rest]
  ? [ClientHandler<F>, ...AddClientHandler<Rest>]
  : [];

type ResponseTypeToData<T> = T extends JsonResponse<infer S>
  ? S
  : T extends HeaderResponse<infer N, infer S>
  ? { headers: ArrayObj<S>; data: ResponseTypeToData<N> }
  : never;

type ArrayObj<T extends string> = { [key in T]: string };

type ClientHandler<R> = R extends Path<infer N>
  ? ClientHandler<N>
  : R extends Or<infer N, infer M>
  ? [ClientHandler<N>, ClientHandler<M>]
  : R extends Any<infer P>
  ? AddClientHandler<P>
  : R extends Method<infer T>
  ? () => Promise<ResponseTypeToData<T>>
  : R extends Capture<infer S>
  ? (c: string) => ClientHandler<S>
  : R extends Header<infer S>
  ? (header: string) => ClientHandler<S>
  : R extends QueryParam<infer S, infer T>
  ? (queryParam: T) => ClientHandler<S>
  : R extends Body<infer S, infer T>
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
        return a.next.type === "HEADER_RESPONSE"
          ? { data: response.json, headers: response.headers }
          : response.json;
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
    case "ANY": {
      const xs = a.next;
      return xs.map((x: A) =>
        getClientHandlers(x, path, headers, queryParams, body)
      ) as ClientHandler<typeof a>;
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

type FancyReturn<T, R> = T extends Path<infer M>
  ? Path<FancyReturn<M, R>>
  : T extends Capture<infer M>
  ? Capture<FancyReturn<M, R>>
  : T extends Header<infer M>
  ? Header<FancyReturn<M, R>>
  : T extends QueryParam<infer M, infer N>
  ? QueryParam<FancyReturn<M, R>, N>
  : T extends Body<infer M, infer N>
  ? Body<FancyReturn<M, R>, N>
  : R;

class DslLeaf<T> {
  dsl: T;
  constructor(dsl: T) {
    this.dsl = dsl;
  }
  run = (): T => this.dsl;
}

type StripDslLeaf<T extends any[]> = T extends [DslLeaf<infer F>, ...infer Rest]
  ? [F, ...StripDslLeaf<Rest>]
  : [];

export class Dsl<T> {
  dsl: <N>(next: N) => T;
  constructor(dsl: <N>(next: N) => T) {
    this.dsl = dsl;
  }
  static empty = () => new Dsl((next) => next);
  get = <G>(
    next: G
  ): DslLeaf<FancyReturn<ReturnType<typeof this.dsl>, Method<G>>> =>
    new DslLeaf(this.dsl(get<G>(next))) as any;
  post = <G>(
    next: G
  ): DslLeaf<FancyReturn<ReturnType<typeof this.dsl>, Method<G>>> =>
    new DslLeaf(this.dsl(post<G>(next))) as any;
  delete_ = <G>(
    next: G
  ): DslLeaf<FancyReturn<ReturnType<typeof this.dsl>, Method<G>>> =>
    new DslLeaf(this.dsl(delete_<G>(next))) as any;
  options = <G>(
    next: G
  ): DslLeaf<FancyReturn<ReturnType<typeof this.dsl>, Method<G>>> =>
    new DslLeaf(this.dsl(options<G>(next))) as any;
  p = (url: string) => this.path(url);
  path = <M>(
    url: string
  ): Dsl<FancyReturn<ReturnType<typeof this.dsl>, Path<M>>> =>
    new Dsl((next) => this.dsl(path(url)(next))) as any;
  capture = <M>(
    placeholder: ApiPath
  ): Dsl<FancyReturn<ReturnType<typeof this.dsl>, Capture<M>>> =>
    new Dsl((next) => this.dsl(capture(placeholder)(next))) as any;
  header = <M>(
    name: string
  ): Dsl<FancyReturn<ReturnType<typeof this.dsl>, Header<M>>> =>
    new Dsl((next) => this.dsl(header(name)(next))) as any;
  queryParam = <Q, M = unknown>(
    name: string
  ): Dsl<FancyReturn<ReturnType<typeof this.dsl>, QueryParam<M, Q>>> =>
    new Dsl((next) => this.dsl(queryParam<Q>(name)(next))) as any;
  body = <Q, M = unknown>(
    requestBody?: ApiRequestBody
  ): Dsl<FancyReturn<ReturnType<typeof this.dsl>, Body<M, Q>>> =>
    new Dsl((next) => this.dsl(body<Q>(requestBody)(next))) as any;
  or = <P, Q>(
    l1: DslLeaf<P>,
    l2: DslLeaf<Q>
  ): DslLeaf<FancyReturn<ReturnType<typeof this.dsl>, Or<P, Q>>> =>
    new DslLeaf(this.dsl(or(l1.run(), l2.run()))) as any;
  any = <P extends any[]>(
    ...xs: P
  ): DslLeaf<FancyReturn<ReturnType<typeof this.dsl>, Any<StripDslLeaf<P>>>> =>
    new DslLeaf(this.dsl(any(...xs.map((x) => x.run())))) as any;
}

// TODO: Change these as any's to the real return type
// TODO: Could do e.g. d["foo"]["bar"] === Dsl.empty().path("foo").path("bar")
