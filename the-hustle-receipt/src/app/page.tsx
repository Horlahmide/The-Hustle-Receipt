import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        The Hustle Receipt
      </h1>
      <p className="mt-4 text-lg text-gray-600">
        Support your favorite creators with tips. Simple, fast, powered by
        Flutterwave.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Link
          href="/auth/signup"
          className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white hover:bg-gray-800"
        >
          Start Receiving Tips
        </Link>
        <Link
          href="/auth/login"
          className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
