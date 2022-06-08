import { render, screen } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import { BASE_URL } from "../catsApi";
import UploadCat from "./UploadCat";
import user from "@testing-library/user-event";
import { Wrapped } from "./testing";

const server = setupServer(
  rest.post(`${BASE_URL}/images/upload`, (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ message: "some error" }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("uploading failure", async () => {
  render(
    <Wrapped>
      <UploadCat />
    </Wrapped>
  );

  expect(await screen.findByText(/Choose a file/i)).toBeInTheDocument();

  const file = new File(["hello"], "cat.png", { type: "image/png" });

  const input = screen.getByLabelText("Choose a file");
  await user.upload(input, file);
  expect(await screen.findByText(/Loading/i)).toBeInTheDocument();

  expect(
    await screen.findByText(
      /There was an error uploading your image: some error/i
    )
  ).toBeInTheDocument();
});
