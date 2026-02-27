"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  CheckCircle,
  Calendar,
  Clock,
  MessageSquare,
} from "lucide-react";
import { consultationSchema, type ConsultationForm } from "@/lib/validations";
import { apiPost, getApiError } from "@/lib/api";
import { useToast } from "@/store/uiStore";
import { useAuthStore } from "@/store/authStore";

const timeSlots = [
  "9:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
];

export default function ConsultationForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConsultationForm>({
    resolver: zodResolver(consultationSchema),
    defaultValues: {
      customerName: user?.name || "",
      customerEmail: user?.email || "",
      customerPhone: user?.phone || "",
    },
  });

  const onSubmit = async (data: ConsultationForm) => {
    setIsLoading(true);
    try {
      await apiPost("/consultations", data);
      setSubmitted(true);
    } catch (err) {
      toast(getApiError(err), "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-16 max-w-xl text-center mx-auto">
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="font-display text-2xl font-bold text-gray-900">
          Booking Received!
        </h2>
        <p className="mt-3 text-gray-500">
          Thank you for booking a consultation. We'll confirm your appointment
          and send you the details via email shortly.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Benefits */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            icon: Calendar,
            title: "Flexible Scheduling",
            desc: "Choose a time that works for you",
          },
          {
            icon: Clock,
            title: "60 Minutes",
            desc: "Dedicated one-on-one session",
          },
          {
            icon: MessageSquare,
            title: "Expert Advice",
            desc: "Tailored to your business needs",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-brand-50 rounded-xl p-4 text-center">
            <Icon className="w-6 h-6 text-brand-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Contact */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">Your Information</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { name: "customerName", label: "Full Name *", type: "text" },
              { name: "customerEmail", label: "Email *", type: "email" },
              { name: "customerPhone", label: "Phone Number *", type: "tel" },
              { name: "companyName", label: "Company Name", type: "text" },
            ].map(({ name, label, type }) => (
              <div key={name}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {label}
                </label>
                <input
                  type={type}
                  {...register(name as any)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-colors"
                />
                {(errors as any)[name] && (
                  <p className="mt-1 text-xs text-red-500">
                    {(errors as any)[name]?.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Subject and message */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">
            Consultation Details
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Subject *
              </label>
              <input
                type="text"
                {...register("subject")}
                placeholder="e.g. Office supply procurement strategy"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-colors"
              />
              {errors.subject && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.subject.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Describe what you need help with *
              </label>
              <textarea
                {...register("message")}
                rows={4}
                placeholder="Please describe your business needs, challenges, or what you'd like to discuss…"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none transition-colors"
              />
              {errors.message && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.message.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Preferred time */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-5">
            Preferred Schedule{" "}
            <span className="text-gray-400 font-normal text-sm">
              (optional)
            </span>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Preferred Date
              </label>
              <input
                type="date"
                {...register("preferredDate")}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Preferred Time
              </label>
              <select
                {...register("preferredTime")}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-500 bg-white"
              >
                <option value="">Any time</option>
                {timeSlots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 text-base"
        >
          {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
          Book Consultation
        </button>
      </form>
    </>
  );
}
