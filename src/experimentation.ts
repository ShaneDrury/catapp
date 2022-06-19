type ApiPath = string;
type ApiCapture = string;
type ApiMethod = "GET" | "POST";

type Api =
  | { type: "PATH"; data: ApiPath; next: Api }
  | { type: "METHOD"; data: ApiMethod }
  | { type: "CAPTURE"; data: ApiCapture; next: Api }
  | { type: "OR"; next: [Api, Api] };

const get = (): Api => ({ type: "METHOD", data: "GET" });

const path =
  (url: ApiPath) =>
  (next: Api): Api => ({
    type: "PATH",
    data: url,
    next,
  });

const or = (x1: Api, x2: Api): Api => ({
  type: "OR",
  next: [x1, x2],
});

const combine = (x1: (x: Api) => Api, x2: Api) => x1(x2);
const capture =
  (c: string) =>
  (next: Api): Api => ({
    type: "CAPTURE",
    data: c,
    next,
  });

type Paths<A> = A | Paths<A>[] | ((c: string) => Paths<A>);

// infer return type based on Api
// somehow...
// can do extends stuff?

export const getPaths = (a: Api, acc: string): Paths<string> => {
  switch (a.type) {
    case "METHOD": {
      return acc;
    }
    case "PATH": {
      const nextAcc = `${acc}/${a.data}`;
      return getPaths(a.next, nextAcc);
    }
    case "OR": {
      const [l, r] = a.next;
      return [getPaths(l, acc), getPaths(r, acc)];
    }
    case "CAPTURE": {
      return (c: string) => getPaths(a.next, `${acc}/${c}`);
    }
  }
};

const simple = getPaths(combine(capture(":foo"), get()), "");
if (typeof simple === "function") {
  console.log(simple("foo"));
}

export const api = combine(
  path("v1"),
  or(
    combine(path("images"), or(get(), combine(capture(":imageId"), get()))),
    combine(path("favourites"), get())
  )
);

const result = getPaths(api, "");

if (typeof result === "object") {
  const [firstTwo, getAllFavourites] = result;
  if (typeof firstTwo === "object") {
    const [getAllImages, getImage] = firstTwo;
    if (typeof getImage === "function") {
      console.log([getAllImages, getImage("001"), getAllFavourites]);
    }
  }
}
