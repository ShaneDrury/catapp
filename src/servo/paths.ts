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

type Paths<R, Acc extends string = ""> = R extends Path<
  infer N,
  infer U extends string
>
  ? Paths<N, `${Acc}/${U}`>
  : R extends Or<infer N, infer M>
  ? [Paths<N, Acc>, Paths<M, Acc>]
  : R extends Any<infer P>
  ? AddPath<P, Acc>
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
  R extends Method<infer T, infer M>
  ? `${M} ${Acc}`
  : R extends Capture<infer S, infer C>
  ? Paths<S, `${Acc}/${C}`>
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
  R extends Header<infer S, infer H>
  ? Paths<S, Acc>
  : R extends QueryParam<infer S>
  ? Paths<S, Acc>
  : R extends Body<infer S>
  ? Paths<S, Acc>
  : never;

type AddPath<T, Acc extends string> = T extends [infer F, ...infer Rest]
  ? [Paths<F, Acc>, ...AddPath<Rest, Acc>]
  : [];

export function getPathsAcc<A extends AnyApi, Acc extends string>(
  a: A,
  acc: Acc
): Paths<typeof a, Acc> {
  switch (a.type) {
    case "METHOD": {
      return `${a.data} ${acc}` as Paths<typeof a, Acc>;
    }
    case "PATH": {
      const nextAcc = `${acc}/${a.data}`;
      return getPathsAcc(a.next, nextAcc) as Paths<typeof a, Acc>;
    }
    case "OR": {
      const [l, r] = a.next;
      return [getPathsAcc(l, acc), getPathsAcc(r, acc)] as Paths<typeof a, Acc>;
    }
    case "CAPTURE": {
      return getPathsAcc(a.next, `${acc}/${a.data}`) as Paths<typeof a, Acc>;
    }
    case "ANY": {
      const xs = a.next;
      return xs.map((x: A) => getPathsAcc(x, acc)) as Paths<typeof a, Acc>;
    }
    default: {
      return getPathsAcc(a.next, acc) as Paths<typeof a, Acc>;
    }
  }
}

export const getPaths = <A extends AnyApi>(a: A) => getPathsAcc(a, "");
