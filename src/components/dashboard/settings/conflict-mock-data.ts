import type { SyncConflict } from "../types";

export const sampleConflicts: SyncConflict[] = [
  {
    id: "conflict-1",
    eventTitle: "Product strategy call",
    dateTime: "Tue, Apr 1, 2026, 10:00 – 11:30",
    localChanges: [
      { field: "title", localValue: "Product strategy call", remoteValue: "Strategy sync" },
      { field: "description", localValue: "Q2 roadmap review", remoteValue: "Quarterly planning" },
      { field: "location", localValue: "Conference Room A", remoteValue: "Zoom" },
    ],
    remoteChanges: [
      { field: "title", localValue: "Product strategy call", remoteValue: "Strategy sync" },
      { field: "description", localValue: "Q2 roadmap review", remoteValue: "Quarterly planning" },
      { field: "location", localValue: "Conference Room A", remoteValue: "Zoom" },
    ],
  },
  {
    id: "conflict-2",
    eventTitle: "Design review",
    dateTime: "Wed, Apr 2, 2026, 14:00 – 15:00",
    localChanges: [
      { field: "title", localValue: "Design review", remoteValue: "UX critique session" },
      { field: "attendees", localValue: "alex@example.com", remoteValue: "team@example.com" },
    ],
    remoteChanges: [
      { field: "title", localValue: "Design review", remoteValue: "UX critique session" },
      { field: "attendees", localValue: "alex@example.com", remoteValue: "team@example.com" },
    ],
  },
  {
    id: "conflict-3",
    eventTitle: "Weekly sync",
    dateTime: "Thu, Apr 3, 2026, 09:00 – 09:30",
    localChanges: [
      { field: "recurrence", localValue: "Weekly", remoteValue: "Bi-weekly" },
    ],
    remoteChanges: [
      { field: "recurrence", localValue: "Weekly", remoteValue: "Bi-weekly" },
    ],
  },
];

export const manyConflicts: SyncConflict[] = Array.from({ length: 15 }, (_, i) => ({
  id: `conflict-batch-${i + 1}`,
  eventTitle: `Event ${i + 1}`,
  dateTime: `Day ${i + 1}, Apr 2026`,
  localChanges: [
    { field: "title", localValue: `Event ${i + 1}`, remoteValue: `Event ${i + 1} (updated)` },
  ],
  remoteChanges: [
    { field: "title", localValue: `Event ${i + 1}`, remoteValue: `Event ${i + 1} (updated)` },
  ],
}));
