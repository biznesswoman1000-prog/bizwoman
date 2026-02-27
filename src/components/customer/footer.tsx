"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
} from "lucide-react";
import { apiGet } from "@/lib/api";

const shopLinks = [
  { label: "All Products", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "New Arrivals", href: "/products?isNewArrival=true" },
  { label: "Featured", href: "/products?isFeatured=true" },
];

const serviceLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Request Quotation", href: "/quotation" },
  { label: "Book Consultation", href: "/consultation" },
  { label: "Blog", href: "/blog" },
];

const accountLinks = [
  { label: "My Account", href: "/account" },
  { label: "Order History", href: "/account/orders" },
  { label: "Saved Addresses", href: "/account/addresses" },
];

interface SiteSettings {
  siteName?: string;
  email?: string;
  phone?: string;
  address?: string;
  whatsapp?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
}

export function Footer() {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiGet<any>("/settings")
      .then((res) => setSettings(res.data.settings))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const siteName = settings.siteName || "EquipUniverse";
  const socialLinks = [
    {
      icon: Facebook,
      href: settings.facebook || "#",
      label: "Facebook",
      show: !!settings.facebook,
    },
    {
      icon: Instagram,
      href: settings.instagram || "#",
      label: "Instagram",
      show: !!settings.instagram,
    },
    {
      icon: Twitter,
      href: settings.twitter || "#",
      label: "Twitter",
      show: !!settings.twitter,
    },
    {
      icon: Linkedin,
      href: settings.linkedin || "#",
      label: "LinkedIn",
      show: !!settings.linkedin,
    },
  ].filter((link) => link.show);

  if (isLoading) {
    return (
      <footer className="bg-gray-900 text-gray-300 mt-auto">
        <div className="container py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-48" />
            <div className="h-4 bg-gray-800 rounded w-full max-w-md" />
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <span className="font-display text-2xl font-bold text-white">
                Equip<span className="text-gold-400">Universe</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              Premium business solutions and professional services empowering
              the modern business woman across Nigeria and beyond.
            </p>
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-3">
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-brand-600 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-white font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              {shopLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {serviceLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="text-white font-semibold mt-6 mb-4">Account</h4>
            <ul className="space-y-2">
              {accountLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              {settings.address && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-400">
                    {settings.address}
                  </span>
                </li>
              )}
              {settings.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gold-400 shrink-0" />
                  <a
                    href={`tel:${settings.phone}`}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {settings.phone}
                  </a>
                </li>
              )}
              {settings.email && (
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gold-400 shrink-0" />
                  <a
                    href={`mailto:${settings.email}`}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {settings.email}
                  </a>
                </li>
              )}
            </ul>

            {/* Newsletter mini */}
            <div className="mt-6">
              <p className="text-sm font-medium text-white mb-2">
                Stay updated
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
                >
                  →
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <p>
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </p>
            <span className="hidden sm:inline text-gray-700">•</span>
            <p>
              Developed by{" "}
              <a
                href="https://calstins.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-400 hover:text-brand-300 transition-colors font-medium"
              >
                Calstins Ltd
              </a>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              className="hover:text-gray-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-gray-300 transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
