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
} from "lucide-react";
import { createSupabaseClient } from "@/lib/supabaseClient";

const DEPARTMENT_LINKS = [
  { href: "/dashboard/procurement", label: "Procurement", icon: Boxes, roles: ["PROCUREMENT"] },
  { href: "/dashboard/manufacturing", label: "Manufacturing", icon: Factory, roles: ["MANUFACTURING"] },
  { href: "/dashboard/distribution", label: "Distribution", icon: Package, roles: ["DISTRIBUTION"] },
  { href: "/dashboard/retail", label: "Retail", icon: Store, roles: ["RETAIL"] },
  { href: "/dashboard/pos", label: "POS", icon: ShoppingCart, roles: ["POS"] },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseClient();

  const [roles, setRoles] = useState<string[]>([]);
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getUser() {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        router.push("/login");
        return;
      }

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
            .replace(/[{}]/g, "")
            .split(",")
            .map((r) => r.trim())
            .filter(Boolean);
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
        Loading...
      </div>
    );
  }

  // Filter links: allow access if user's role matches, or if we want to show all for demonstration.
  // We'll show all links, but highlight what role they belong to. Or strictly enforce it.
  // For the RMS app, it might be better to let users see their department, plus we can allow them to see the hub.
  const visibleLinks = DEPARTMENT_LINKS.filter((link) => {
    return link.roles.some((r) => roles.includes(r));
  });

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="flex w-64 flex-col border-r border-blue-100 bg-white/80 backdrop-blur-md">
        <div className="flex h-16 items-center border-b border-blue-100 px-4 text-lg font-semibold tracking-tight">
          <Link href="/dashboard" className="transition hover:text-slate-300">
            RMS Dashboard
          </Link>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {visibleLinks.length > 0 ? (
            visibleLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${active
                    ? "bg-blue-100 text-slate-900"
                    : "text-slate-700 hover:bg-blue-50 hover:text-slate-50"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })
          ) : (
            <div className="px-3 py-2 text-sm text-slate-400">
              No departments assigned to your roles ({roles.join(", ")}).
            </div>
          )}
        </nav>

        <div className="border-t border-blue-100 p-4">
          <div className="mb-4 flex items-center gap-3 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
              <User className="h-4 w-4 text-slate-700" />
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-sm font-medium text-blue-950">{fullName || "User"}</p>
              <p className="truncate text-xs text-slate-400">{roles.join(", ")}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-blue-100 hover:text-slate-200"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

