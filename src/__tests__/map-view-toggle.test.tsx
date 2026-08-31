import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  MapViewToggle,
  useMapView,
} from "@/components/marketplace/map-view-toggle";
import { act } from "react";

describe("MapViewToggle", () => {
  it("renders the view mode toggle radio group", () => {
    render(
      <MapViewToggle
        viewMode="list"
        onViewModeChange={vi.fn()}
      >
        <div>List content</div>
      </MapViewToggle>,
    );

    expect(
      screen.getByRole("radiogroup", { name: /View mode/i }),
    ).toBeInTheDocument();
  });

  it("renders List, Map, and Split buttons", () => {
    render(
      <MapViewToggle
        viewMode="list"
        onViewModeChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("radio", { name: /List view/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Map view/i })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Split view/i })).toBeInTheDocument();
  });

  it("marks the active view mode as aria-checked", () => {
    render(
      <MapViewToggle
        viewMode="map"
        onViewModeChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("radio", { name: /Map view/i }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("radio", { name: /List view/i }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("calls onViewModeChange when a mode button is clicked", () => {
    const onChange = vi.fn();
    render(
      <MapViewToggle
        viewMode="list"
        onViewModeChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("radio", { name: /Map view/i }));
    expect(onChange).toHaveBeenCalledWith("map");
  });

  it("renders children in list mode", () => {
    render(
      <MapViewToggle
        viewMode="list"
        onViewModeChange={vi.fn()}
      >
        <p>Supplier list</p>
      </MapViewToggle>,
    );

    expect(screen.getByText("Supplier list")).toBeInTheDocument();
  });

  it("shows map area in map mode", () => {
    render(
      <MapViewToggle
        viewMode="map"
        onViewModeChange={vi.fn()}
        supplierCount={5}
      />,
    );

    expect(
      screen.getByRole("region", { name: /Map view/i }),
    ).toBeInTheDocument();
  });

  it("shows map and children in split mode", () => {
    render(
      <MapViewToggle
        viewMode="split"
        onViewModeChange={vi.fn()}
        supplierCount={3}
      >
        <p>Split content</p>
      </MapViewToggle>,
    );

    expect(
      screen.getByRole("region", { name: /Map view/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("Split content")).toBeInTheDocument();
  });

  it("shows place search in map mode", () => {
    render(
      <MapViewToggle
        viewMode="map"
        onViewModeChange={vi.fn()}
      />,
    );

    expect(
      screen.getByPlaceholderText(/Search places/i),
    ).toBeInTheDocument();
  });

  it("shows 'Search this area' button when suppliers exist", () => {
    render(
      <MapViewToggle
        viewMode="map"
        onViewModeChange={vi.fn()}
        supplierCount={3}
      />,
    );

    expect(
      screen.getByText(/Search this area/i),
    ).toBeInTheDocument();
  });

  it("hides 'Search this area' when no suppliers", () => {
    render(
      <MapViewToggle
        viewMode="map"
        onViewModeChange={vi.fn()}
        supplierCount={0}
      />,
    );

    expect(
      screen.queryByText(/Search this area/i),
    ).not.toBeInTheDocument();
  });
});

describe("useMapView", () => {
  it("defaults to list mode", () => {
    function TestComponent() {
      const { viewMode } = useMapView("test-storage-key");
      return <p>{viewMode}</p>;
    }

    render(<TestComponent />);
    expect(screen.getByText("list")).toBeInTheDocument();
  });

  it("persists mode to localStorage", () => {
    function TestComponent() {
      const { viewMode, setViewMode } = useMapView("test-storage-persist");
      return (
        <div>
          <p>{viewMode}</p>
          <button onClick={() => setViewMode("map")}>Set Map</button>
        </div>
      );
    }

    render(<TestComponent />);

    expect(screen.getByText("list")).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.getByText("Set Map"));
    });

    expect(screen.getByText("map")).toBeInTheDocument();
    expect(localStorage.getItem("test-storage-persist")).toBe("map");
  });
});
