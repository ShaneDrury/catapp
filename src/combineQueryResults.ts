import { UseQueryResult } from "react-query";

type Status = "success" | "idle" | "error" | "loading";

const compareStatuses = (statuses: Status[]): Status => {
  if (statuses.some((status) => status === "error")) {
    return "error";
  }
  if (statuses.some((status) => status === "loading")) {
    return "loading";
  }
  if (statuses.every((status) => status === "idle")) {
    return "idle";
  }
  if (statuses.every((status) => status === "success" || status === "idle")) {
    return "success";
  }
  throw new Error("huh");
};

type Datas<T> = T extends [UseQueryResult<infer D>, ...infer Rest]
  ? [D, ...Datas<Rest>]
  : [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Errors<T> = T extends [UseQueryResult<infer D, infer E>, ...infer Rest]
  ? [E, ...Errors<Rest>]
  : [];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AnyError<T> = T extends [UseQueryResult<infer D, infer E>, ...infer Rest]
  ? E | AnyError<Rest>
  : never;

type MakeUndefined<T> = T extends [UseQueryResult, ...infer Rest]
  ? [undefined, ...MakeUndefined<Rest>]
  : [];

type CombineReturn<T> =
  | {
      data: Datas<T>;
      status: "success";
      errors: [];
      error: undefined;
    }
  | {
      data: MakeUndefined<T>;
      status: "error";
      errors: Errors<T>;
      error: AnyError<T>;
    }
  | {
      data: MakeUndefined<T>;
      status: "loading";
      errors: [];
      error: undefined;
    }
  | {
      data: MakeUndefined<T>;
      status: "idle";
      errors: [];
      error: undefined;
    };

const combineQueryResults = <T extends any[]>(
  ...queryResults: T
): CombineReturn<T> => {
  return {
    data: queryResults.map((queryResult) => queryResult.data),
    status: compareStatuses(
      queryResults.map((queryResult) => queryResult.status)
    ),
    errors: queryResults.map((queryResult) => queryResult.error),
    error: queryResults
      .map((queryResult) => queryResult.error)
      .find((err) => !!err),
  } as CombineReturn<T>;
};

export default combineQueryResults;
