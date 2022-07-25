import {
  Any,
  AnyApi,
  Body,
  Capture,
  Header,
  Method,
  Or,
  Path,
  QueryParam,
} from "./core";

type Paths<R> = R extends Path<infer N>
  ? Paths<N>
  : R extends Or<infer N, infer M>
  ? [Paths<N>, Paths<M>]
  : R extends Any<infer P>
  ? AddPath<P>
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
  R extends Method<infer T>
  ? string
  : R extends Capture<infer S, infer C>
  ? Paths<S>
  : R extends Header<infer S, infer H>
  ? Paths<S>
  : R extends QueryParam<infer S>
  ? Paths<S>
  : R extends Body<infer S>
  ? Paths<S>
  : never;

type AddPath<T> = T extends [infer F, ...infer Rest]
  ? [Path<F>, ...AddPath<Rest>]
  : [];

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
      return a.next.map((x: A) => getPathsAcc(x, acc)) as Paths<typeof a>;
    }
    default: {
      return getPathsAcc(a.next, acc) as Paths<typeof a>;
    }
  }
}

export const getPaths = <A extends AnyApi>(a: A) => getPathsAcc(a, "");
