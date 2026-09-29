import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";
import { EmptyStateCard } from "./empty-state-card";

expect.extend(toHaveNoViolations);

describe("EmptyStateCard", () => {
  const defaultProps = {
    eyebrow: "Empty State",
    title: "No Data Found",
    description: "There is no data to display right now.",
    accentLabel: "Data",
    status: {
      label: "System Normal",
      tone: "info" as const,
    },
    guidance: ["Check back later.", "Refresh the page."],
  };

  it("renders with required props without errors", () => {
    render(<EmptyStateCard {...defaultProps} />);
    
    expect(screen.getByText("Empty State")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No Data Found", level: 2 })).toBeInTheDocument();
    expect(screen.getByText("There is no data to display right now.")).toBeInTheDocument();
    expect(screen.getByText("System Normal")).toBeInTheDocument();
    
    const list = screen.getByRole("list", { name: "No Data Found guidance" });
    expect(list).toBeInTheDocument();
    
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Check back later.");
    expect(items[1]).toHaveTextContent("Refresh the page.");
  });

  it("renders with optional actions", () => {
    render(
      <EmptyStateCard 
        {...defaultProps} 
        actions={<button>Retry Action</button>} 
      />
    );
    
    expect(screen.getByRole("button", { name: "Retry Action" })).toBeInTheDocument();
  });

  it("renders without optional variant and alt attributes (falling back to defaults/omitting)", () => {
    render(
      <EmptyStateCard 
        {...defaultProps} 
      />
    );
    // Since variant is "default" by default, and alt is optional.
    expect(screen.getByRole("heading", { name: "No Data Found", level: 2 })).toBeInTheDocument();
  });

  it("renders with a specific variant", () => {
    render(
      <EmptyStateCard 
        {...defaultProps} 
        variant="error" 
      />
    );
    expect(screen.getByRole("heading", { name: "No Data Found", level: 2 })).toBeInTheDocument();
  });

  it("renders with no tone in status", () => {
    render(
      <EmptyStateCard 
        {...defaultProps} 
        status={{ label: "Unknown Status" }} 
      />
    );
    expect(screen.getByText("Unknown Status")).toBeInTheDocument();
  });

  it("should have no accessibility violations", async () => {
    const { container } = render(
      <main>
        <EmptyStateCard {...defaultProps} />
      </main>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
