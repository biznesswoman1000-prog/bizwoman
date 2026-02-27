"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Shield,
  Truck,
  Headphones,
  Award,
  Clock,
  CreditCard,
  Package,
  CheckCircle,
  Gift,
  DollarSign,
  Lock,
} from "lucide-react";
import { apiGet } from "@/lib/api";

interface TrustBadge {
  icon: string;
  title: string;
  description: string;
}

// Map icon string names (stored in DB) → lucide components
const ICON_MAP: Record<string, React.ElementType> = {
  star: Star,
  shield: Shield,
  truck: Truck,
  headphones: Headphones,
  award: Award,
  clock: Clock,
  creditCard: CreditCard,
  package: Package,
  checkCircle: CheckCircle,
  gift: Gift,
  dollarSign: DollarSign,
  lock: Lock,
};

const DEFAULT_BADGES: TrustBadge[] = [
  {
    icon: "truck",
    title: "Free Delivery",
    description: "On orders over ₦50,000",
  },
  {
    icon: "shield",
    title: "Secure Payment",
    description: "Powered by Paystack",
  },
  {
    icon: "star",
    title: "Quality Assured",
    description: "Premium verified products",
  },
  {
    icon: "headphones",
    title: "24/7 Support",
    description: "Always here to help",
  },
];

export function TrustBadges() {
  const [badges, setBadges] = useState<TrustBadge[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiGet<any>("/settings")
      .then((res) => {
        const raw =
          res.data?.settings?.trustBadges ?? res.data?.trustBadges ?? [];
        setBadges(raw.filter((b: any) => b.title));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const displayBadges = loaded && badges.length > 0 ? badges : DEFAULT_BADGES;

  return (
    <section className="border-b border-gray-100 bg-gray-50">
      <div className="container py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {displayBadges.map(({ icon, title, description }) => {
            const Icon = ICON_MAP[icon] ?? Star;
            return (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{title}</p>
                  <p className="text-xs text-gray-500">{description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
