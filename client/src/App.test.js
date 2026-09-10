import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders leave management login", () => {
  render(<App />);
  expect(screen.getByText(/leave management system/i)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
});
