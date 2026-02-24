"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Boxes, Factory, Package, Store, ShoppingCart, LogOut, User, BarChart3 } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabaseClient";

const DEPARTMENT_LINKS = [
  { href: "/dashboard/procurement", label: "Procurement", icon: Boxes, roles: ["PROCUREMENT"] },
  { href: "/dashboard/manufacturing", label: "Manufacturing", icon: Factory, roles: ["MANUFACTURING"] },
  { href: "/dashboard/distribution", label: "Distribution", icon: Package, roles: ["DISTRIBUTION"] },
  { href: "/dashboard/retail", label: "Retail", icon: Store, roles: ["RETAIL"] },
  { href: "/dashboard/pos", label: "Point of Sale", icon: ShoppingCart, roles: ["POS"] },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseClient();

  const [roles, setRoles] = useState<string[]>([]);
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles").select("department_role, full_name")
        .eq("id", session.user.id).single();

      if (profile) {
        let parsed: string[] = [];
        if (Array.isArray(profile.department_role)) {
          parsed = profile.department_role;
        } else if (typeof profile.department_role === "string") {
          parsed = profile.department_role.replace(/[{}]/g, "").split(",").map((r) => r.trim()).filter(Boolean);
        }
        setRoles(parsed);
        setFullName(profile.full_name);
      }
      setLoading(false);
    }
    getUser();
  }, [router, supabase]);

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push("/login"); };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f9ff]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#29b6f6] border-t-transparent" />
          <span className="text-sm text-slate-500">Loading workspace…</span>
        </div>
      </div>
    );
  }

  const visibleLinks = DEPARTMENT_LINKS.filter((l) => l.roles.some((r) => roles.includes(r)));
  const currentLabel = DEPARTMENT_LINKS.find((l) => pathname.startsWith(l.href))?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen bg-[#f0f9ff] font-sans">
      {/* ── Sidebar ── */}
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-[#b3e5fc] bg-white shadow-[2px_0_12px_rgba(41,182,246,0.08)]">
        {/* Brand */}
        <div className="flex h-16 items-center gap-2 border-b border-[#b3e5fc] px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#29b6f6] shadow-sm">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <Link href="/dashboard" className="text-base font-bold tracking-tight hover:opacity-80 transition">
            <span className="text-[#29b6f6]">Tmax</span>{" "}
            <span className="text-slate-800">RMS</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Departments</p>
          {visibleLinks.length > 0 ? (
            visibleLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${active
                      ? "bg-[#29b6f6] text-white shadow-[0_3px_10px_rgba(41,182,246,0.40)]"
                      : "text-slate-600 hover:bg-[#e1f5fe] hover:text-[#0288d1]"
                    }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })
          ) : (
            <div className="px-3 py-2 text-xs text-slate-400">No departments assigned yet.</div>
          )}
        </nav>

        {/* User */}
        <div className="border-t border-[#b3e5fc] p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e1f5fe] border border-[#b3e5fc]">
              <User className="h-4 w-4 text-[#0288d1]" />
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-semibold text-slate-800">{fullName || "User"}</p>
              <p className="truncate text-xs text-slate-400">{roles.join(", ")}</p>
            </div>
          </div>
          <button onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-500">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 flex h-14 items-center border-b border-[#b3e5fc] bg-white/80 px-8 backdrop-blur-md shadow-sm">
          <span className="text-sm font-semibold text-[#0288d1]">{currentLabel}</span>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
