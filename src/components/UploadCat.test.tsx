import { render, screen } from "@testing-library/react";
import UploadCat from "./UploadCat";
import { Wrapped } from "./testing";
import * as mocks from "./mocks";
import userEvent from "@testing-library/user-event";
import { ok, serverError } from "../api";
import { Route, Routes } from "react-router-dom";

test("uploading success", async () => {
  mocks.mockUploadCat(ok({}));
  render(
    <Wrapped initialEntries={["/upload"]}>
      <Routes>
        <Route path="/upload" element={<UploadCat />} />
        <Route path="/" element={<div>Success</div>} />
      </Routes>
    </Wrapped>
  );

  const file = new File(["hello"], "cat.png", { type: "image/png" });

  const input = screen.getByLabelText("Choose a file");
  await userEvent.upload(input, file);
  expect(await screen.findByText("Uploading image...")).toBeInTheDocument();
  expect(await screen.findByText("Success")).toBeInTheDocument();
});

test("uploading failure", async () => {
  mocks.mockUploadCat(serverError({ message: "some error" }));
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
