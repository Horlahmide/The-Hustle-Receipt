"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

type Tip = {
  id: string;
  tipperName: string | null;
  tipperEmail: string | null;
  amount: number;
  message: string | null;
  createdAt: string;
};

type TipsData = {
  tips: Tip[];
  totalTips: number;
  totalAmount: number;
};

async function fetchTips(): Promise<TipsData> {
  const res = await fetch("/api/tips");
  if (!res.ok) throw new Error("Failed to fetch tips");
  return res.json();
}

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const { data, isLoading, error } = useQuery({
    queryKey: ["tips"],
    queryFn: fetchTips,
    enabled: status === "authenticated",
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <div className="animate-spin mx-auto h-10 w-10 rounded-full border-4 border-gray-300 border-t-black" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/auth/login");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600">
            Welcome back, {session?.user?.name}
          </p>
        </div>
        <a
          href={`/tip/${(session?.user as any)?.slug}`}
          target="_blank"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          View Tip Page
        </a>
      </div>

      {isLoading ? (
        <div className="mt-12 text-center text-gray-500">Loading tips...</div>
      ) : error ? (
        <div className="mt-12 text-center text-red-600">
          Failed to load tips
        </div>
      ) : data ? (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="text-sm text-gray-500">Total Tips</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                {data.totalTips}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="text-sm text-gray-500">Total Received</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">
                ₦{(data.totalAmount / 100).toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="text-sm text-gray-500">Your Tip Page</p>
              <p className="mt-1 text-sm font-medium text-gray-900 break-all">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/tip/${(session?.user as any)?.slug}`
                  : `/tip/${(session?.user as any)?.slug}`}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Tips
            </h2>
            {data.tips.length === 0 ? (
              <p className="mt-4 text-gray-500">
                No tips yet. Share your tip page to start receiving!
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {data.tips.slice(0, 10).map((tip) => (
                  <div
                    key={tip.id}
                    className="rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {tip.tipperName || "Anonymous"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(tip.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        ₦{(tip.amount / 100).toLocaleString()}
                      </p>
                    </div>
                    {tip.message && (
                      <p className="mt-2 text-sm text-gray-600 italic">
                        &ldquo;{tip.message}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {data.tips.filter((t) => t.message).length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900">
                Message Wall
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {data.tips
                  .filter((t) => t.message)
                  .map((tip) => (
                    <div
                      key={tip.id}
                      className="rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <p className="text-sm text-gray-600 italic">
                        &ldquo;{tip.message}&rdquo;
                      </p>
                      <p className="mt-2 text-xs text-gray-400">
                        — {tip.tipperName || "Anonymous"}
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
