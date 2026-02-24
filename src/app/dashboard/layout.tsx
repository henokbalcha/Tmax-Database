"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  Factory,
  Package,
  Store,
  ShoppingCart,
  LogOut,
  User,
  BarChart3,
} from "lucide-react";
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
        .from("profiles")
        .select("department_role, full_name")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        let parsedRoles: string[] = [];
        if (Array.isArray(profile.department_role)) {
          parsedRoles = profile.department_role;
        } else if (typeof profile.department_role === "string") {
          parsedRoles = profile.department_role
            .replace(/[{}]/g, "").split(",").map((r) => r.trim()).filter(Boolean);
        }
        setRoles(parsedRoles);
        setFullName(profile.full_name);
      }
      setLoading(false);
    }
    getUser();
  }, [router, supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <span className="text-sm text-slate-500">Loading workspace…</span>
        </div>
      </div>
    );
  }

  const visibleLinks = DEPARTMENT_LINKS.filter((link) =>
    link.roles.some((r) => roles.includes(r))
  );

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* ── Sidebar ── */}
      <aside className="flex w-64 flex-shrink-0 flex-col border-r border-slate-200 bg-white shadow-sm">
        {/* Logo / Brand header */}
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <Link href="/dashboard" className="text-base font-bold text-blue-700 tracking-tight hover:text-blue-600 transition">
            Tmax <span className="text-slate-800">RMS</span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Departments
          </p>
          {visibleLinks.length > 0 ? (
            visibleLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${active
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })
          ) : (
            <div className="px-3 py-2 text-xs text-slate-400">
              No departments assigned yet.
            </div>
          )}
        </nav>

        {/* User info + sign out */}
        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-semibold text-slate-800">{fullName || "User"}</p>
              <p className="truncate text-xs text-slate-400">{roles.join(", ")}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md">
          <h1 className="text-sm font-medium text-slate-500">
            {DEPARTMENT_LINKS.find(l => pathname.startsWith(l.href))?.label ?? "Dashboard"}
          </h1>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
