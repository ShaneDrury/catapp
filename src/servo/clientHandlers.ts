import {
  Any,
  AnyApi,
  AnyResponse,
  ApiMethod,
  ApiQueryParam,
  ApiRequestBody,
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

type Acc = {
  path: string;
  headers: HeadersInit;
  queryParams: Record<string, string>;
  body: BodyInit | null;
};

export function getClientHandlers<A extends AnyApi>(
  a: A,
  acc: Acc
): ClientHandler<typeof a> {
  switch (a.type) {
    case "METHOD": {
      return handleMethod(a.data, a.next, acc) as ClientHandler<typeof a>;
    }
    case "PATH": {
      return addPath(
        a.data,
        (newAcc) => getClientHandlers(a.next, newAcc),
        acc
      ) as ClientHandler<typeof a>;
    }
    case "OR": {
      const [l, r] = a.next;
      return [
        getClientHandlers(l, acc),
        getClientHandlers(r, acc),
      ] as ClientHandler<typeof a>;
    }
    case "ANY": {
      return a.next.map((x: A) => getClientHandlers(x, acc)) as ClientHandler<
        typeof a
      >;
    }
    case "CAPTURE": {
      return addCapture(
        a.data,
        (newAcc) => getClientHandlers(a.next, newAcc),
        acc
      ) as ClientHandler<typeof a>;
    }
    case "HEADER": {
      return addHeader(
        a.data,
        (newAcc) => getClientHandlers(a.next, newAcc),
        acc
      ) as ClientHandler<typeof a>;
    }
    case "QUERY_PARAM": {
      return addQueryParam(
        a.data,
        (newAcc) => getClientHandlers(a.next, newAcc),
        acc
      ) as ClientHandler<typeof a>;
    }
    case "BODY": {
      return addRequestBody(
        a.requestBodyType,
        (newAcc) => getClientHandlers(a.next, newAcc),
        acc
      ) as ClientHandler<typeof a>;
    }
  }
}

const handleMethod = (
  method: ApiMethod,
  responseTemplates: AnyResponse[],
  { path, queryParams, headers, body }: Acc
) => {
  return async () => {
    const response = await runRequest({
      url: path,
      method,
      queryParams,
      headers,
      body,
    });

    const responseTemplate = responseTemplates.find(
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
  };
};

const addPath = <T>(path: string, continuation: (newAcc: Acc) => T, acc: Acc) =>
  continuation({
    ...acc,
    path: `${acc.path}/${path}`,
  });

const addCapture =
  <T>(captureName: string, continuation: (newAcc: Acc) => T, acc: Acc) =>
  (c: { [key in typeof captureName]: string }) =>
    continuation({
      ...acc,
      path: `${acc.path}/${c[captureName]}`,
    });

const addHeader =
  <T>(headerName: string, continuation: (newAcc: Acc) => T, acc: Acc) =>
  (h: { [key in typeof headerName]: any }) =>
    continuation({
      ...acc,
      headers: { ...acc.headers, [headerName]: h[headerName] },
    });

const addRequestBody =
  <T>(
    requestBodyType: ApiRequestBody,
    continuation: (newAcc: Acc) => T,
    acc: Acc
  ) =>
  (reqBody: any) =>
    continuation({
      ...acc,
      body: requestBodyType === "JSON" ? JSON.stringify(reqBody) : reqBody,
    });

const addQueryParam =
  <T>(
    queryParamName: ApiQueryParam,
    continuation: (newAcc: Acc) => T,
    acc: Acc
  ) =>
  (queryParam: any) =>
    continuation({
      ...acc,
      queryParams: {
        ...acc.queryParams,
        [queryParamName]: queryParam.toString(),
      },
    });
