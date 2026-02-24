"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [roles, setRoles] = useState<string[]>(["PROCUREMENT"]);
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createSupabaseClient();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (isSignUp) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        department_roles: roles,
                    },
                },
            });

            if (error) {
                alert(error.message);
            } else if (data.user) {
                alert("Successfully signed up! You can now log in.");
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                alert(error.message);
            } else {
                router.push("/dashboard");
            }
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
            <form onSubmit={handleAuth} className="w-full max-w-sm space-y-4 rounded-xl border border-blue-100 bg-white/90 backdrop-blur-md shadow-xl p-8 shadow-2xl backdrop-blur-sm">
                <h2 className="mb-2 text-2xl font-bold">
                    {isSignUp ? "Create an Account" : "Sign In to RMS"}
                </h2>

                {isSignUp && (
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-slate-700">Full Name</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full rounded-md border border-blue-200 bg-slate-50 px-3 py-2 focus:border-blue-500 focus:outline-none"
                            required={isSignUp}
                        />
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-md border border-blue-200 bg-slate-50 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full rounded-md border border-blue-200 bg-slate-50 px-3 py-2 focus:border-blue-500 focus:outline-none"
                        required
                    />
                </div>

                {isSignUp && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Department Roles</label>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { value: "PROCUREMENT", label: "Procurement" },
                                { value: "MANUFACTURING", label: "Manufacturing" },
                                { value: "DISTRIBUTION", label: "Distribution" },
                                { value: "RETAIL", label: "Retail" },
                                { value: "POS", label: "Point of Sale (POS)" }
                            ].map((dept) => (
                                <label key={dept.value} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={roles.includes(dept.value)}
                                        onChange={() => {
                                            if (roles.includes(dept.value)) {
                                                setRoles(roles.filter(r => r !== dept.value));
                                            } else {
                                                setRoles([...roles, dept.value]);
                                            }
                                        }}
                                        className="rounded border-blue-200 bg-slate-50 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                                    />
                                    {dept.label}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 w-full rounded-md bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                    {loading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
                </button>

                <div className="mt-4 text-center text-sm text-slate-400">
                    {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        className="text-blue-400 hover:underline"
                    >
                        {isSignUp ? "Sign In" : "Sign Up"}
                    </button>
                </div>
            </form>
        </div>
    );
}
