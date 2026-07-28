import { fireEvent, render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { describe, expect, it } from "vitest";
import { StatusTimeline } from "./status-timeline";
import type { TimelineItem } from "./timeline-types";

const items: TimelineItem[] = [
  {
    id: "reserved",
    title: "Reserved",
    status: "completed",
    timestamp: "2026-07-20 09:00 AM",
    actor: "Buyer",
    details: "Slot reserved for 30 minutes.",
    isMilestone: true,
  },
  {
    id: "mediator-assigned",
    title: "Mediator assigned",
    status: "pending",
    timestamp: "2026-07-20 11:15 AM",
    isMilestone: true,
    isCurrent: true,
    variant: "mediator_assigned",
    mediator: {
      name: "Amina Yusuf",
      responseSlaLabel: "Responds within 24 hours",
      responseDueLabel: "Due Tue, Jul 21 at 11:15 AM",
      slaProgress: 42,
      directMessageHref: "/dashboard/messages/amina-yusuf",
    },
  },
  {
    id: "follow-up",
    title: "Evidence follow-up",
    status: "warning",
    timestamp: "2026-07-20 02:45 PM",
  },
];

describe("StatusTimeline", () => {
  it("renders the mediator-assigned timeline block with SLA and direct message action", () => {
    render(<StatusTimeline items={items} />);

    expect(screen.getByText("Amina Yusuf")).toBeInTheDocument();
    expect(screen.getByText("Responds within 24 hours")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /message mediator/i })).toHaveAttribute(
      "href",
      "/dashboard/messages/amina-yusuf",
    );
    expect(
      screen.getByRole("progressbar", {
        name: /mediator sla progress for amina yusuf/i,
      }),
    ).toHaveAttribute("aria-valuenow", "42");
  });

  it("filters to milestones only and announces the toggle change", () => {
    render(<StatusTimeline items={items} />);

    const toggle = screen.getByRole("switch", { name: /show milestones only/i });
    fireEvent.click(toggle);

    expect(screen.getByText("2 milestones shown")).toBeInTheDocument();
    expect(screen.queryByText("Evidence follow-up")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Showing milestones only");
  });

  it("expands item details when requested", () => {
    render(<StatusTimeline items={items} />);

    fireEvent.click(screen.getByRole("button", { name: /show details/i }));

    expect(screen.getByText("Actor: Buyer")).toBeInTheDocument();
    expect(screen.getByText("Slot reserved for 30 minutes.")).toBeInTheDocument();
  });

  it("announces a mediator assignment for assistive tech", () => {
    render(<StatusTimeline items={items} />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Mediator Amina Yusuf assigned. Response SLA Responds within 24 hours.",
    );
  });

  it("has no obvious accessibility violations", async () => {
    const { container } = render(<StatusTimeline items={items} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
