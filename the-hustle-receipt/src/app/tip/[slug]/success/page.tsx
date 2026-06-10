"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

function SuccessContent() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const txRef = searchParams.get("tx_ref");

  const [status, setStatus] = useState<"verifying" | "success" | "failed">(
    "verifying"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!txRef) {
      setStatus("failed");
      setError("No transaction reference found");
      return;
    }

    async function verify() {
      try {
        const res = await fetch("/api/tip/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ txRef }),
        });

        const data = await res.json();

        if (!res.ok) {
          setStatus("failed");
          setError(data.error || "Verification failed");
          return;
        }

        setStatus("success");
      } catch {
        setStatus("failed");
        setError("Could not verify payment");
      }
    }

    verify();
  }, [txRef]);

  if (status === "verifying") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="animate-spin mx-auto h-10 w-10 rounded-full border-4 border-gray-300 border-t-black" />
        <p className="mt-4 text-gray-600">Verifying your payment...</p>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <span className="text-2xl text-red-600">!</span>
        </div>
        <h1 className="mt-4 text-xl font-bold text-gray-900">
          Payment Failed
        </h1>
        <p className="mt-2 text-gray-600">{error}</p>
        <Link
          href={`/tip/${slug}`}
          className="mt-6 inline-block rounded-lg bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Try Again
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <span className="text-2xl text-green-600">&#10003;</span>
      </div>
      <h1 className="mt-4 text-xl font-bold text-gray-900">Tip Sent!</h1>
      <p className="mt-2 text-gray-600">
        Your tip has been sent successfully. Thank you for supporting @{slug}!
      </p>
      <Link
        href={`/tip/${slug}`}
        className="mt-6 inline-block rounded-lg bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        Send Another Tip
      </Link>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-20 text-center">
          <div className="animate-spin mx-auto h-10 w-10 rounded-full border-4 border-gray-300 border-t-black" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
