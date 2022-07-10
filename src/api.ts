import {
  MockedRequest,
  ResponseResolver,
  rest,
  RestContext,
  RestHandler,
} from "msw";
import { runRequest } from "./request";

type ApiPath = string;
type ApiCapture = string;
type ApiMethod = "GET" | "POST" | "DELETE" | "OPTIONS";
type ApiHeader = string;
type ApiQueryParam = string;
type ApiRequestBody = "JSON" | undefined;

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
export const post = <N = {}>(next: N): Method<N> => ({
  type: "METHOD",
  data: "POST",
  next,
});
export const delete_ = <N = {}>(next: N): Method<N> => ({
  type: "METHOD",
  data: "DELETE",
  next,
});
export const options = <N = {}>(next: N): Method<N> => ({
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
  ? Paths<S>
  : R extends Header<infer S>
  ? Paths<S>
  : R extends QueryParam<infer S>
  ? Paths<S>
  : R extends Body<infer S>
  ? Paths<S>
  : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type HeaderResponse<T, S extends number, H extends string> = {
  type: "HEADER_RESPONSE";
  status: S;
  headers: H[];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type PlainResponse<T, S extends number> = { type: "PLAIN_RESPONSE"; status: S };

type AnyResponse = PlainResponse<any, any> | HeaderResponse<any, any, any>;

type AnyApi =
  | Method<AnyResponse[]>
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
      return `${a.data} ${acc}` as Paths<typeof a>;
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
      return getPathsAcc(a.next, `${acc}/${a.data}`) as Paths<typeof a>;
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

type Response<T, S extends number, H extends string | undefined = undefined> = [
  H
] extends [string]
  ? {
      statusCode: S;
      data: T;
      headers: ArrayObj<H>;
    }
  : {
      statusCode: S;
      data: T;
    };

export const withHeaders =
  <H extends string>(...headers: H[]) =>
  <T, S extends number>(
    next: PlainResponse<T, S>
  ): HeaderResponse<T, S, typeof headers[number]> => ({
    ...next,
    headers,
    type: "HEADER_RESPONSE",
  });

export const jsonResponse = <T>(): PlainResponse<T, 200> => ({
  type: "PLAIN_RESPONSE",
  status: 200,
});

export const badRequest = <T>(): PlainResponse<T, 400> => ({
  type: "PLAIN_RESPONSE",
  status: 400,
});

export const r = jsonResponse;

// TODO: Could make this a class based dsl
// withHeaders(["foo"] as const).jsonResponse<string>()

export function ok(): Response<never, 200>;
export function ok<T>(data: T): Response<T, 200>;
export function ok<T>(data: T, headers: {}): Response<T, 200>;
export function ok<T, H extends string>(
  data: T,
  headers: { [key in H]: string }
): Response<T, 200, H>;
export function ok<T, H extends string>(
  data?: T,
  headers?: { [key in H]: string }
) {
  return {
    statusCode: 200,
    data: data || {},
    ...(headers && { headers }),
  };
}

export function serverError(data: any): Response<any, 500> {
  return {
    statusCode: 500,
    data,
  };
}

export function response(): Response<never, 200>;
export function response<T>(data: T): Response<T, 200>;
export function response<T, S extends number>(
  data: T,
  status: S
): Response<T, S>;
export function response<T, S extends number>(
  data: T,
  status: S,
  headers: {}
): Response<T, S>;
export function response<T, S extends number, H extends string>(
  data: T,
  status: S,
  headers: { [key in H]: string }
): Response<T, S, H>;
export function response<T, S extends number, H extends string>(
  data?: T,
  status?: S,
  headers?: { [key in H]: string }
) {
  return {
    statusCode: status || 200,
    data: data || {},
    ...(headers && { headers }),
  };
}

const MAP_METHOD_TO_MSW = {
  GET: rest.get,
  POST: rest.post,
  DELETE: rest.delete,
  OPTIONS: rest.options,
};

type AddClientHandler<T> = T extends [infer F, ...infer Rest]
  ? [ClientHandler<F>, ...AddClientHandler<Rest>]
  : [];

type ResponseTypeToData<T> = T extends HeaderResponse<infer D, infer S, infer H>
  ? { data: D; status: S; headers: ArrayObj<H> }
  : T extends PlainResponse<infer D, infer S>
  ? { data: D; status: S }
  : never;

type ArrayResponseType<T> = T extends [infer R, ...infer Rest]
  ? ResponseTypeToData<R> | ArrayResponseType<Rest>
  : never;

type ArrayObj<T extends string> = { [key in T]: string };

type ClientHandler<R> = R extends Path<infer N>
  ? ClientHandler<N>
  : R extends Or<infer N, infer M>
  ? [ClientHandler<N>, ClientHandler<M>]
  : R extends Any<infer P>
  ? AddClientHandler<P>
  : R extends Method<infer N>
  ? () => Promise<ArrayResponseType<N>>
  : R extends Capture<infer S>
  ? (c: string) => ClientHandler<S>
  : R extends Header<infer S>
  ? (header: string) => ClientHandler<S>
  : R extends QueryParam<infer S, infer T>
  ? (queryParam: T) => ClientHandler<S>
  : R extends Body<infer S, infer T>
  ? (body: T) => ClientHandler<S>
  : never;

const getHeaders = (response: AnyResponse) => {
  if (response.type === "HEADER_RESPONSE") {
    return response.headers;
  }
};

const getStatus = (response: AnyResponse): number => response.status;

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

        const responseTemplate = a.next.find(
          (responseTemplate) => getStatus(responseTemplate) === response.status
        );

        if (responseTemplate) {
          const json = await response.json();
          const headers = getHeaders(responseTemplate);
          if (headers) {
            return {
              data: json,
              status: response.status,
              headers: Object.fromEntries(
                headers.map((key) => [key, response.headers.get(key)])
              ),
            };
          } else {
            return {
              data: json,
              status: response.status,
            };
          }
        }
        throw new Error(
          `Unexpected response ${response.status} ${response.statusText}`
        );
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
  get = <G extends any[]>(
    ...next: G
  ): DslLeaf<FancyReturn<ReturnType<typeof this.dsl>, Method<G>>> =>
    new DslLeaf(this.dsl(get<G>(next))) as any;
  post = <G extends any[]>(
    ...next: G
  ): DslLeaf<FancyReturn<ReturnType<typeof this.dsl>, Method<G>>> =>
    new DslLeaf(this.dsl(post<G>(next))) as any;
  delete_ = <G extends any[]>(
    ...next: G
  ): DslLeaf<FancyReturn<ReturnType<typeof this.dsl>, Method<G>>> =>
    new DslLeaf(this.dsl(delete_<G>(next))) as any;
  options = <G extends any[]>(
    ...next: G
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

type AddMockHandler<T> = T extends [infer F, ...infer Rest]
  ? [MockHandler<F>, ...AddMockHandler<Rest>]
  : [];

type MockHandlerFromResponse<T> = T extends HeaderResponse<
  infer D,
  infer S,
  infer H
>
  ? {
      headers: ArrayObj<H>;
      statusCode: S;
      data: D;
    }
  : T extends PlainResponse<infer D, infer S>
  ? {
      statusCode: S;
      data: D;
    }
  : never;

type ArrayMockHandlerType<T> = T extends [infer R, ...infer Rest]
  ? MockHandlerFromResponse<R> | ArrayMockHandlerType<Rest>
  : never;

type MockHandler<R> = R extends Path<infer N>
  ? MockHandler<N>
  : R extends Or<infer N, infer M>
  ? [MockHandler<N>, MockHandler<M>]
  : R extends Any<infer P>
  ? AddMockHandler<P>
  : R extends Method<infer T>
  ? (...s: ArrayMockHandlerType<T>[]) => RestHandler
  : R extends Capture<infer S>
  ? (c: string) => MockHandler<S>
  : R extends Header<infer S>
  ? MockHandler<S>
  : R extends QueryParam<infer S>
  ? MockHandler<S>
  : R extends Body<infer S>
  ? MockHandler<S>
  : never;

export function generateMockHandlers<A extends AnyApi>(
  a: A,
  path: string
): MockHandler<typeof a> {
  switch (a.type) {
    case "METHOD": {
      return (<T, S extends number, H extends string>(
        ...mockResponses: Response<T, S, H>[]
      ) => {
        const mockResponsesArray = [...mockResponses];
        const method = MAP_METHOD_TO_MSW[a.data];
        const handler: ResponseResolver<MockedRequest, RestContext> = (
          req,
          res,
          ctx
        ) => {
          const { statusCode, data, headers } = (
            mockResponsesArray.length > 1
              ? mockResponsesArray.shift()
              : mockResponsesArray[0]
          ) as Response<T, S, any>;

          const responseTemplate = a.next.find(
            (responseTemplate) => getStatus(responseTemplate) === statusCode
          );
          if (responseTemplate) {
            const templateHeaders = getHeaders(responseTemplate);
            if (templateHeaders) {
              const responseHeaders = templateHeaders.map((key) =>
                ctx.set(key, headers[key])
              );
              return res(
                ctx.status(statusCode),
                ctx.json<T>(data),
                ...responseHeaders
              );
            }

            return res(ctx.status(statusCode), ctx.json<T>(data));
          }
          throw new Error("Couldn't mock");
        };
        return method(path, handler);
      }) as MockHandler<typeof a>;
    }
    case "PATH": {
      const nextAcc = `${path}/${a.data}`;
      return generateMockHandlers(a.next, nextAcc) as MockHandler<typeof a>;
    }
    case "OR": {
      const [l, r] = a.next;
      return [
        generateMockHandlers(l, path),
        generateMockHandlers(r, path),
      ] as MockHandler<typeof a>;
    }
    case "ANY": {
      const xs = a.next;
      return xs.map((x: A) => generateMockHandlers(x, path)) as MockHandler<
        typeof a
      >;
    }
    case "CAPTURE": {
      return ((c: string) =>
        generateMockHandlers(a.next, `${path}/${c}`)) as MockHandler<typeof a>;
    }
    default: {
      return generateMockHandlers(a.next, path) as MockHandler<typeof a>;
    }
  }
}
