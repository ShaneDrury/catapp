import {
  MockedRequest,
  ResponseResolver,
  rest,
  RestContext,
  RestHandler,
} from "msw";
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
  : R extends Capture<infer S, infer C>
  ? (c: { [key in C]: string }) => MockHandler<S>
  : R extends Header<infer S, infer H>
  ? MockHandler<S>
  : R extends QueryParam<infer S>
  ? MockHandler<S>
  : R extends Body<infer S>
  ? MockHandler<S>
  : never;

const MAP_METHOD_TO_MSW = {
  GET: rest.get,
  POST: rest.post,
  DELETE: rest.delete,
  OPTIONS: rest.options,
};

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
      return a.next.map((x: A) => generateMockHandlers(x, path)) as MockHandler<
        typeof a
      >;
    }
    case "CAPTURE": {
      return ((c: { [key in typeof a.data]: string }) =>
        generateMockHandlers(a.next, `${path}/${c[a.data]}`)) as MockHandler<
        typeof a
      >;
    }
    default: {
      return generateMockHandlers(a.next, path) as MockHandler<typeof a>;
    }
  }
}

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
