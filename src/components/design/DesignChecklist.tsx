export default function DesignChecklist() {
  const items = [
    "Responsive (mobile → desktop)",
    "Accessible (keyboard + screen readers)",
    "Loading states implemented",
    "Empty states handled",
    "Error states handled",
    "Consistent spacing & hierarchy",
  ];

  return (
    <div
      className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg"
      aria-labelledby="design-qa-checklist-title"
    >
      <h2 id="design-qa-checklist-title" className="text-lg font-semibold mb-4">
        <span aria-hidden="true">🎯 </span>
        Design QA Checklist
      </h2>

      <ul className="space-y-2 text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-green-400" aria-hidden="true">
              ✔
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
