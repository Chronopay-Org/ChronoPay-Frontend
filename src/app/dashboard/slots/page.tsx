import { redirect } from "next/navigation";

/** The slots index lives on the dashboard; keep breadcrumb links working. */
export default function SlotsIndexPage() {
  redirect("/dashboard");
}
