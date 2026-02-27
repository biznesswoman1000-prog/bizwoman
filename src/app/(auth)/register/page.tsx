"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { registerSchema, type RegisterForm } from "@/lib/validations";
import { useAuth } from "@/hooks/useAuth";
import { getFieldErrors } from "@/lib/api";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [backendErrors, setBackendErrors] = useState<Record<string, string>>(
    {},
  );
  const { register: registerUser, isLoading } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  const onSubmit = async (data: RegisterForm) => {
    setBackendErrors({});
    try {
      const { confirmPassword, ...payload } = data;
      await registerUser(payload);
    } catch (error) {
      const fieldErrors = getFieldErrors(error);
      setBackendErrors(fieldErrors);
    }
  };

  // Helper to get error message (frontend or backend)
  const getError = (field: keyof RegisterForm) => {
    return errors[field]?.message || backendErrors[field];
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Create account
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Join EquipUniverse and start shopping
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              {...register("name")}
              placeholder="Jane Doe"
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors ${
                getError("name")
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-200 focus:border-brand-500 focus:ring-brand-100"
              }`}
            />
            {getError("name") && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {getError("name")}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
              placeholder="you@example.com"
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors ${
                getError("email")
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-200 focus:border-brand-500 focus:ring-brand-100"
              }`}
            />
            {getError("email") && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {getError("email")}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Phone Number{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              {...register("phone")}
              placeholder="+234 800 000 0000"
              className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors ${
                getError("phone")
                  ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                  : "border-gray-200 focus:border-brand-500 focus:ring-brand-100"
              }`}
            />
            {getError("phone") && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {getError("phone")}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                {...register("password")}
                placeholder="e.g., MyPass123!"
                className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors ${
                  getError("password")
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-200 focus:border-brand-500 focus:ring-brand-100"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {!getError("password") && (
              <p className="mt-1.5 text-xs text-gray-500">
                Must be 8+ characters with uppercase, lowercase, number, and
                symbol (!@#$)
              </p>
            )}
            {getError("password") && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {getError("password")}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                {...register("confirmPassword")}
                placeholder="Repeat your password"
                className={`w-full px-4 py-3 pr-12 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-colors ${
                  getError("confirmPassword")
                    ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                    : "border-gray-200 focus:border-brand-500 focus:ring-brand-100"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            {getError("confirmPassword") && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {getError("confirmPassword")}
              </p>
            )}
            {/* Show match indicator when both fields have values */}
            {password && confirmPassword && !getError("confirmPassword") && (
              <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                ✓ Passwords match
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-600 hover:text-brand-800"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
