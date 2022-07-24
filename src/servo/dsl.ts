import {
  Any,
  AnyResponse,
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
  : T extends Capture<infer M, infer C>
  ? Capture<FancyReturn<M, R>, C>
  : T extends Header<infer M, infer H>
  ? Header<FancyReturn<M, R>, H>
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
  get = <G extends AnyResponse[]>(
    ...next: G
  ): DslLeaf<FancyReturn<ReturnType<typeof this.dsl>, Method<G>>> =>
    new DslLeaf(this.dsl({ type: "METHOD", data: "GET", next })) as any;
  post = <G extends AnyResponse[]>(
    ...next: G
  ): DslLeaf<FancyReturn<ReturnType<typeof this.dsl>, Method<G>>> =>
    new DslLeaf(
      this.dsl({
        type: "METHOD",
        data: "POST",
        next,
      })
    ) as any;
  delete_ = <G extends AnyResponse[]>(
    ...next: G
  ): DslLeaf<FancyReturn<ReturnType<typeof this.dsl>, Method<G>>> =>
    new DslLeaf(
      this.dsl({
        type: "METHOD",
        data: "DELETE",
        next,
      })
    ) as any;
  options = <G extends AnyResponse[]>(
    ...next: G
  ): DslLeaf<FancyReturn<ReturnType<typeof this.dsl>, Method<G>>> =>
    new DslLeaf(
      this.dsl({
        type: "METHOD",
        data: "OPTIONS",
        next,
      })
    ) as any;
  p = (url: string) => this.path(url);
  path = <M>(
    url: string
  ): Dsl<FancyReturn<ReturnType<typeof this.dsl>, Path<M>>> =>
    new Dsl((next) => this.dsl({ type: "PATH", data: url, next })) as any;
  capture = <M, C extends string>(
    placeholder: C
  ): Dsl<FancyReturn<ReturnType<typeof this.dsl>, Capture<M, C>>> =>
    new Dsl((next) =>
      this.dsl({
        type: "CAPTURE",
        data: placeholder,
        next,
      })
    ) as any;
  header = <M, H extends string>(
    name: H
  ): Dsl<FancyReturn<ReturnType<typeof this.dsl>, Header<M, H>>> =>
    new Dsl((next) =>
      this.dsl({
        type: "HEADER",
        data: name,
        next,
      })
    ) as any;
  queryParam = <Q, M = unknown>(
    name: string
  ): Dsl<FancyReturn<ReturnType<typeof this.dsl>, QueryParam<M, Q>>> =>
    new Dsl((next) =>
      this.dsl({
        type: "QUERY_PARAM",
        data: name,
        next,
      })
    ) as any;
  body = <Q, M = unknown>(
    requestBody?: ApiRequestBody
  ): Dsl<FancyReturn<ReturnType<typeof this.dsl>, Body<M, Q>>> =>
    new Dsl((next) =>
      this.dsl({ type: "BODY", requestBodyType: requestBody, next })
    ) as any;
  or = <P, Q>(
    l1: DslLeaf<P>,
    l2: DslLeaf<Q>
  ): DslLeaf<FancyReturn<ReturnType<typeof this.dsl>, Or<P, Q>>> =>
    new DslLeaf(
      this.dsl({
        type: "OR",
        next: [l1.run(), l2.run()],
      })
    ) as any;
  any = <P extends any[]>(
    ...xs: P
  ): DslLeaf<FancyReturn<ReturnType<typeof this.dsl>, Any<StripDslLeaf<P>>>> =>
    new DslLeaf(
      this.dsl({
        type: "ANY",
        next: xs.map((x) => x.run()),
      })
    ) as any;
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

const d = Dsl.empty();

export const get = <G extends AnyResponse[]>(...next: G) => d.get<G>(...next);
export const path = (url: string) => d.path(url);
export const body = <Q>(requestBody?: ApiRequestBody) => d.body<Q>(requestBody);
export const queryParam = <T>(name: string) => d.queryParam<T>(name);
export const capture = <M, C extends string>(c: C) => d.capture<M, C>(c);
export const header = <M, H extends string>(name: H) => d.header<M, H>(name);
export const post = <G extends AnyResponse[]>(...next: G) => d.post<G>(...next);
export const delete_ = <G extends AnyResponse[]>(...next: G) =>
  d.delete_<G>(...next);
export const options = <G extends AnyResponse[]>(...next: G) =>
  d.options<G>(...next);
export const or = <P, Q>(l1: DslLeaf<P>, l2: DslLeaf<Q>) => d.or(l1, l2);
export const any = <P extends DslLeaf<any>[]>(...xs: P) => d.any(...xs);
