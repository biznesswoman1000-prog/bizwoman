//frontend/src/app/page.tsx
import { Header } from "@/components/customer/header";
import { Footer } from "@/components/customer/footer";
import { CartDrawer } from "@/components/customer/cart/cart-drawer";
import {
  Hero,
  TrustBadges,
  FeaturedProducts,
  NewArrivals,
  ServicesCTA,
  ShopByCategory,
  CatalogueCTA,
} from "./_components/home";

export default function HomePage() {
  return (
    <div>
      <Header />
      <Hero />
      <TrustBadges />
      <FeaturedProducts />
      <ShopByCategory />
      <CatalogueCTA />
      <NewArrivals />
      <ServicesCTA />
      <Footer />
      <CartDrawer />
    </div>
  );
}
