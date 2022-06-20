import { render, screen } from "@testing-library/react";
import { setupServer } from "msw/node";
import UploadCat from "./UploadCat";
import { mockPostFavourite, Wrapped } from "./testing";
import userEvent from "@testing-library/user-event";
import { serverError } from "../api";

const server = setupServer(
  mockPostFavourite(serverError({ message: "some error" }))
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

  const file = new File(["hello"], "cat.png", { type: "image/png" });

  const input = screen.getByLabelText("Choose a file");
  await userEvent.upload(input, file);
  expect(await screen.findByText("Uploading image...")).toBeInTheDocument();

  expect(
    await screen.findByText(
      "There was an error uploading your image: some error"
    )
  ).toBeInTheDocument();
});
