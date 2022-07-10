import {
  Any,
  ApiPath,
  ApiRequestBody,
  Body,
  Capture,
  Header,
  HeaderResponse,
  Method,
  Or,
  Path,
  PlainResponse,
  QueryParam,
} from "./core";

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
