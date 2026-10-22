"use client";

import { useMemo, useState } from "react";
import { userAction } from "@/app/(app)/admin/users/actions";
import { Button } from "@/components/ui/button";
import type { UserAction, UserRow, UserStatus } from "@/lib/admin-users";
import { formatDate } from "@/lib/format";
import { matchesQuery, nextSort, sortBy, type SortState } from "@/lib/table";
import { cn } from "@/lib/utils";
import { ConfirmButton } from "./confirm-button";
import { SortHeader } from "./sort-header";
import { TableToolbar } from "./table-toolbar";

const STATUS_STYLE: Record<UserStatus, string> = { pending: "text-amber-600", active: "text-emerald-600", suspended: "text-destructive" };
const STATUS_RANK: Record<UserStatus, number> = { pending: 0, suspended: 1, active: 2 };
type Key = "name" | "status" | "joined" | "accounts";
type Filter = "all" | "pending" | "active" | "suspended";

function Act({ user, action, label, danger, confirm }: { user: UserRow; action: UserAction; label: string; danger?: boolean; confirm?: string }) {
  const variant = danger ? "destructive" : "outline";
  return (
    <form action={userAction}>
      <input type="hidden" name="user_id" value={user.id} />
      <input type="hidden" name="action" value={action} />
      {confirm
        ? <ConfirmButton message={confirm} size="sm" variant={variant}>{label}</ConfirmButton>
        : <Button type="submit" size="sm" variant={variant}>{label}</Button>}
    </form>
  );
}

export function UsersTable({ users, initialFilter }: { users: UserRow[]; initialFilter: Filter }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [sort, setSort] = useState<SortState<Key>>({ key: initialFilter === "pending" ? "joined" : "joined", dir: "desc" });
  const activeAdmins = users.filter((u) => u.role === "admin" && u.status === "active").length;
  const count = (s: UserStatus) => users.filter((u) => u.status === s).length;

  const shown = useMemo(() => {
    const filtered = users.filter((u) => (filter === "all" || u.status === filter) && matchesQuery(query, u.name, u.email, u.role));
    const get = (u: UserRow) => (sort.key === "name" ? u.name || u.email : sort.key === "status" ? STATUS_RANK[u.status] : sort.key === "joined" ? u.created_at : u.accounts);
    return sortBy(filtered, get, sort.dir);
  }, [users, query, filter, sort]);

  const header = (key: Key, label: string, align: "left" | "right" = "left", first: "asc" | "desc" = "asc") => (
    <SortHeader label={label} align={align} active={sort.key === key} dir={sort.dir} onClick={() => setSort(nextSort(sort, key, first))} />
  );

  return (
    <div className="flex flex-col gap-3">
      <TableToolbar
        query={query} onQuery={setQuery} placeholder="Search name or email"
        filters={[
          { value: "all", label: "All", count: users.length }, { value: "pending", label: "Waiting", count: count("pending") },
          { value: "active", label: "Active", count: count("active") }, { value: "suspended", label: "Suspended", count: count("suspended") },
        ]}
        filter={filter} onFilter={setFilter} shown={shown.length} total={users.length}
      />
      {shown.length === 0 ? (
        <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {filter === "pending" && !query ? "Nobody is waiting for approval." : "No users match. Try a different search or filter."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted">
              <tr>
                {header("name", "User")}{header("status", "Status")}
                <th scope="col" className="p-3 text-xs font-medium uppercase text-muted-foreground">Role</th>
                {header("joined", "Joined", "left", "desc")}{header("accounts", "Accounts", "right", "desc")}
                <th scope="col" className="p-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id} className="border-t border-border align-top hover:bg-muted/40">
                  <td className="p-3">
                    <div className="font-medium">{u.name || u.email || "Unknown"}</div>
                    {u.name && <div className="text-xs text-muted-foreground">{u.email}</div>}
                  </td>
                  <td className={cn("p-3 font-medium capitalize", STATUS_STYLE[u.status])}>{u.status}</td>
                  <td className="p-3">{u.role === "admin" ? "Admin" : "Affiliate"}</td>
                  <td className="whitespace-nowrap p-3">{formatDate(u.created_at)}</td>
                  <td className="p-3 text-right tabular-nums">{u.accounts}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {u.status === "pending" && <Act user={u} action="approve" label="Approve" />}
                      {u.status === "suspended" && <Act user={u} action="reactivate" label="Reactivate" />}
                      {u.status === "active" && u.role === "affiliate" && <Act user={u} action="suspend" label="Suspend" confirm={`Suspend ${u.name || u.email}? They lose access immediately.`} />}
                      {u.status === "active" && u.role === "affiliate" && <Act user={u} action="make_admin" label="Make admin" />}
                      {u.role === "admin" && activeAdmins > 1 && <Act user={u} action="remove_admin" label="Remove admin" />}
                      {u.role === "affiliate" && <Act user={u} action="delete" label="Delete" danger confirm={`Permanently delete ${u.name || u.email}, their connected accounts and all their statistics? This cannot be undone.`} />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
