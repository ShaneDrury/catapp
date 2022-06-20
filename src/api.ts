import { rest, RestHandler } from "msw";

type ApiPath = string;
type ApiCapture = string;
type ApiMethod = "GET" | "POST";

type Method<T> = { type: "METHOD"; data: ApiMethod };
type Path<S> = { type: "PATH"; data: ApiPath; next: S };
type Or<S, T> = { type: "OR"; next: [S, T] };
type Capture<S> = { type: "CAPTURE"; data: ApiCapture; next: S };

export const get = <T>(): Method<T> => ({ type: "METHOD", data: "GET" });

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

export const or = <S, T>(x1: S, x2: T): Or<S, T> => ({
  type: "OR",
  next: [x1, x2],
});

export const combine = <A, B>(x1: (x: A) => B, x2: A) => x1(x2);

type Paths<R> = R extends Path<infer N>
  ? Paths<N>
  : R extends Or<infer N, infer M>
  ? [Paths<N>, Paths<M>]
  : R extends Method<infer T>
  ? string
  : R extends Capture<infer S>
  ? (c: string) => Paths<S>
  : never;

type AnyApi = Method<any> | Capture<any> | Path<any> | Or<any, any>;

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
  }
}

export const getPaths = <A extends AnyApi>(a: A) => getPathsAcc(a, "");

type MockHandler<R> = R extends Path<infer N>
  ? MockHandler<N>
  : R extends Or<infer N, infer M>
  ? [MockHandler<N>, MockHandler<M>]
  : R extends Method<infer T>
  ? (s: T) => RestHandler
  : R extends Capture<infer S>
  ? (c: string) => MockHandler<S>
  : never;

const MAP_METHOD_TO_MSW = {
  GET: rest.get,
  POST: rest.post,
};

export function getMockHandlers<A extends AnyApi>(
  a: A,
  path: string
): MockHandler<typeof a> {
  switch (a.type) {
    case "METHOD": {
      const method = MAP_METHOD_TO_MSW[a.data];
      return ((data: any) =>
        method(path, (req, res, ctx) => res(ctx.json(data)))) as MockHandler<
        typeof a
      >;
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
  }
}
