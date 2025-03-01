import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import App from "../App";

describe("App", () => {
  it("renders Censordle title", () => {
    render(<App />);
    const censordleElement = screen.getByText("Censordle");
    expect(censordleElement).toBeInTheDocument();
  });
});
