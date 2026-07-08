import { StatusTimeline } from "./status-timeline";
import { TimelineItem } from "./timeline-types";

export function BookingProgress({ items }: { items: TimelineItem[] }) {
  return <StatusTimeline items={items} />;
}
