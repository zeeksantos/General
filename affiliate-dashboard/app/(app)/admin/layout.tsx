import { notFound, redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/admin-nav";
import { loadPendingCount } from "@/lib/data";
import { getViewer } from "@/lib/viewer";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login");
  if (viewer.role !== "admin" || viewer.status !== "active") notFound();
  const pending = await loadPendingCount();
  return (
    <div className="max-w-6xl">
      <AdminNav pending={pending} />
      {children}
    </div>
  );
}
