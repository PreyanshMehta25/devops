import { render, screen } from "@testing-library/react";
import App from "../src/App";

test("renders app", () => {
  render(<App />);
  expect(screen.getAllByText(/stackit/i).length).toBeGreaterThan(0);
});
