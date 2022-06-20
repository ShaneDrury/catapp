type ApiPath = string;
type ApiCapture = string;
type ApiMethod = "GET" | "POST";

type Method = { type: "METHOD"; data: ApiMethod };
type Path<S> = { type: "PATH"; data: ApiPath; next: S };
type Or<S, T> = { type: "OR"; next: [S, T] };
type Capture<S> = { type: "CAPTURE"; data: ApiCapture; next: S };

const get = (): Method => ({ type: "METHOD", data: "GET" });

const path =
  (url: ApiPath) =>
  <A>(next: A): Path<A> => ({
    type: "PATH",
    data: url,
    next,
  });

const capture =
  (c: ApiPath) =>
  <A>(next: A): Capture<A> => ({
    type: "CAPTURE",
    data: c,
    next,
  });

const or = <S, T>(x1: S, x2: T): Or<S, T> => ({
  type: "OR",
  next: [x1, x2],
});

const combine = <A, B>(x1: (x: A) => B, x2: A) => x1(x2);

type Paths<R> = R extends Path<infer N>
  ? Paths<N>
  : R extends Or<infer N, infer M>
  ? [Paths<N>, Paths<M>]
  : R extends Method
  ? string
  : R extends Capture<infer S>
  ? (c: string) => Paths<S>
  : never;

function getPathsAcc<
  A extends Method | Capture<any> | Path<any> | Or<any, any>
>(a: A, acc: string): Paths<typeof a> {
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

export const getPaths = <
  A extends Method | Capture<any> | Path<any> | Or<any, any>
>(
  a: A
) => getPathsAcc(a, "");

const simpleApi = combine(capture(":foo"), get());
const simple = getPaths(simpleApi);

console.log({ simple: simple("bar") });

export const api = combine(
  path("v1"),
  or(
    combine(path("images"), or(get(), combine(capture(":imageId"), get()))),
    combine(path("favourites"), get())
  )
);

const [[getAllImages, getImage], getAllFavourites] = getPaths(api);

console.log([getAllImages, getImage("001"), getAllFavourites]);
