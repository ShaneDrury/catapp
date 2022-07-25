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

type QueryKeys<R, Acc extends string[] = []> = R extends Path<
  infer N,
  infer U extends string
>
  ? QueryKeys<N, [...Acc, U]>
  : R extends Or<infer N, infer M>
  ? [QueryKeys<N, Acc>, QueryKeys<M, Acc>]
  : R extends Any<infer P>
  ? AddPath<P, Acc>
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
  R extends Method<infer T>
  ? Acc
  : R extends Capture<infer S, infer C>
  ? (c: { [k in C]: string }) => QueryKeys<S, Acc>
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
  R extends Header<infer S, infer H>
  ? QueryKeys<S, Acc>
  : R extends QueryParam<infer S>
  ? QueryKeys<S, Acc>
  : R extends Body<infer S>
  ? QueryKeys<S, Acc>
  : never;

type AddPath<T, Acc extends string[]> = T extends [infer F, ...infer Rest]
  ? [QueryKeys<F, Acc>, ...AddPath<Rest, Acc>]
  : [];

function getQueryKeysAcc<A extends AnyApi>(
  a: A,
  acc: string[]
): QueryKeys<typeof a> {
  switch (a.type) {
    case "METHOD": {
      return acc as QueryKeys<typeof a, []>;
    }
    case "PATH": {
      const nextAcc = [...acc, a.data];
      return getQueryKeysAcc(a.next, nextAcc) as QueryKeys<typeof a>;
    }
    case "OR": {
      const [l, r] = a.next;
      return [getQueryKeysAcc(l, acc), getQueryKeysAcc(r, acc)] as QueryKeys<
        typeof a
      >;
    }
    case "CAPTURE": {
      return ((c: { [key in typeof a.data]: string }) =>
        getQueryKeysAcc(a.next, [...acc, c[a.data]])) as QueryKeys<typeof a>;
    }
    case "ANY": {
      const xs = a.next;
      return xs.map((x: A) => getQueryKeysAcc(x, acc)) as QueryKeys<typeof a>;
    }
    default: {
      return getQueryKeysAcc(a.next, acc) as QueryKeys<typeof a>;
    }
  }
}

export const getQueryKeys = <A extends AnyApi>(a: A) => getQueryKeysAcc(a, []);
