import {
  Any,
  AnyApi,
  ArrayObj,
  Body,
  Capture,
  getHeaders,
  getStatus,
  Header,
  HeaderResponse,
  Method,
  Or,
  Path,
  PlainResponse,
  QueryParam,
} from "./core";
import { runRequest } from "./request";

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

type ClientHandler<R> = R extends Path<infer N>
  ? ClientHandler<N>
  : R extends Or<infer N, infer M>
  ? [ClientHandler<N>, ClientHandler<M>]
  : R extends Any<infer P>
  ? AddClientHandler<P>
  : R extends Method<infer N>
  ? () => Promise<ArrayResponseType<N>>
  : R extends Capture<infer S, infer C>
  ? (c: { [k in C]: string }) => ClientHandler<S>
  : R extends Header<infer S, infer H>
  ? (header: { [k in H]: string }) => ClientHandler<S>
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
      return ((c: { [key in typeof a.data]: string }) =>
        getClientHandlers(
          a.next,
          `${path}/${c[a.data]}`,
          headers,
          queryParams,
          body
        )) as ClientHandler<typeof a>;
    }
    case "HEADER": {
      return ((h: { [key in typeof a.data]: any }) =>
        getClientHandlers(
          a.next,
          path,
          { ...headers, [a.data]: h[a.data] },
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
