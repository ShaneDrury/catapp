import { UseQueryResult } from "@tanstack/react-query";

type ExtractData<T> = T extends [UseQueryResult<infer D>, ...infer Rest]
  ? [D, ...ExtractData<Rest>]
  : [];

type ExtractError<T> = T extends [
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  UseQueryResult<infer D, infer E>,
  ...infer Rest
]
  ? [E | undefined, ...ExtractError<Rest>]
  : [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AnyError<T> = T extends [UseQueryResult<infer D, infer E>, ...infer Rest]
  ? E | AnyError<Rest>
  : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type MapConst<T, U> = T extends [infer R, ...infer Rest]
  ? [U, ...MapConst<Rest, U>]
  : [];

type CombineQueryResults<T> =
  | {
      data: ExtractData<T>;
      status: "success";
      errors: [];
      error: undefined;
    }
  | {
      data: MapConst<T, undefined>;
      status: "error";
      errors: ExtractError<T>;
      error: AnyError<T>;
    }
  | {
      data: MapConst<T, undefined>;
      status: "loading";
      errors: [];
      error: undefined;
    };

type Status = CombineQueryResults<any>["status"];

const summariseStatuses = (statuses: Status[]): Status => {
  if (statuses.some((status) => status === "error")) {
    return "error";
  }
  if (statuses.some((status) => status === "loading")) {
    return "loading";
  }
  return "success";
};

const combineQueryResults = <T extends UseQueryResult<any, any>[]>(
  ...queryResults: T
): CombineQueryResults<T> => {
  const errors = queryResults.map((queryResult) => queryResult.error);
  return {
    data: queryResults.map((queryResult) => queryResult.data),
    status: summariseStatuses(
      queryResults.map((queryResult) => queryResult.status)
    ),
    errors,
    error: errors.find((err) => !!err),
  } as CombineQueryResults<T>;
};

export default combineQueryResults;
