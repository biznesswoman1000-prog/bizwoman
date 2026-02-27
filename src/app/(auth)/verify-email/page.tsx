// src/app/(auth)/verify-email/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { apiPost, getApiError } from "@/lib/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }
    apiPost("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(getApiError(err));
      });
  }, [token]);

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 text-brand-600 animate-spin mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-gray-900">
              Verifying your email…
            </h2>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-900">
              Email verified!
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Your account is now active. You can sign in.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
            >
              Sign In
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-900">
              Verification failed
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {message || "This link may be expired or invalid."}
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center text-sm font-medium text-brand-600 hover:text-brand-800"
            >
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
