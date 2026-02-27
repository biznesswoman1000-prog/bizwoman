"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiGet } from "@/lib/api";

interface MediaItem {
  url: string;
  type: "image" | "video";
}
interface HeroSlide {
  heading?: string;
  text?: string;
  buttonText?: string;
  buttonUrl?: string;
  image?: string;
  videoUrl?: string;
  media?: MediaItem[];
  animation?: "fade" | "slide" | "zoom" | "none";
}
interface HeroBanner {
  heading?: string;
  text?: string;
  buttonText?: string;
  buttonUrl?: string;
  image?: string;
  media?: MediaItem[];
}

// ── Root export (page.tsx uses <Hero /> with no props) ────────────────────────
export function Hero() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    apiGet<any>("/settings")
      .then((res) => {
        const s = res.data?.settings ?? res.data ?? {};

        // Normalise: support both new { media:[] } and old { image:"" } shapes
        const normSlide = (slide: any): HeroSlide => ({
          ...slide,
          media: slide.media?.length
            ? slide.media
            : slide.image
              ? [{ url: slide.image, type: "image" as const }]
              : slide.videoUrl
                ? [{ url: slide.videoUrl, type: "video" as const }]
                : [],
          animation: slide.animation || "fade",
        });
        const normBanner = (b: any): HeroBanner => ({
          ...b,
          media: b.media?.length
            ? b.media
            : b.image
              ? [{ url: b.image, type: "image" as const }]
              : [],
        });

        setSlides((s.heroSlides || []).map(normSlide));
        setBanners((s.heroBanners || []).map(normBanner));
      })
      .catch(() => {
        /* fall through to defaults */
      })
      .finally(() => setLoaded(true));
  }, []);

  return <HeroInner slides={slides} banners={banners} loaded={loaded} />;
}

// ── Inner slider ──────────────────────────────────────────────────────────────
function HeroInner({
  slides,
  banners,
  loaded,
}: {
  slides: HeroSlide[];
  banners: HeroBanner[];
  loaded: boolean;
}) {
  const [cur, setCur] = useState(0);
  const [transitioning, setTr] = useState(false);
  // ✅ FIX: useRef<HTMLVideoElement | null>(null) → MutableRefObject<HTMLVideoElement | null>
  //    The old code typed videoRef as RefObject<HTMLVideoElement> (non-null) which
  //    React 19 rejects because useRef(null) always produces | null.
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(next, 7000);
    return () => clearInterval(id);
  }, [slides.length, cur]);

  useEffect(() => setCur(0), [slides.length]);

  const go = (cb: () => void) => {
    if (transitioning) return;
    setTr(true);
    cb();
    setTimeout(() => setTr(false), 600);
  };
  const count = Math.max(slides.length, 1);
  const next = () => go(() => setCur((p) => (p + 1) % count));
  const prev = () => go(() => setCur((p) => (p - 1 + count) % count));
  const goTo = (i: number) => {
    if (i !== cur) go(() => setCur(i));
  };

  // Defaults shown when DB is empty
  const defaultSlides: HeroSlide[] = [
    {
      heading: "Empowering the Modern Business Woman",
      text: "Premium equipment and business tools tailored for ambitious businesses across Nigeria.",
      buttonText: "Shop Now",
      buttonUrl: "/products",
      animation: "fade",
    },
  ];
  const defaultBanners: HeroBanner[] = [
    {
      heading: "New Arrivals",
      text: "Fresh stock just landed",
      buttonText: "Shop Now",
      buttonUrl: "/products",
    },
    {
      heading: "Special Offers",
      text: "Limited time deals",
      buttonText: "View Deals",
      buttonUrl: "/products",
    },
  ];

  const ds = slides.length > 0 ? slides : defaultSlides;
  const db = banners.length > 0 ? banners : defaultBanners;
  const slide = ds[cur] ?? ds[0];
  const media = getMedia(slide);
  const anim = !transitioning
    ? ""
    : slide.animation === "slide"
      ? "animate-slide-in"
      : slide.animation === "zoom"
        ? "animate-zoom-in"
        : "animate-fade-in";

  if (!loaded) return <HeroSkeleton />;

  return (
    <section className="bg-gray-50">
      <div className="container py-6">
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Main slider */}
          <div className="lg:col-span-2 relative bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 rounded-2xl overflow-hidden h-[400px] lg:h-[500px]">
            <div className={`absolute inset-0 ${anim}`}>
              {media.type === "video" ? (
                <VideoBackground url={media.url} videoRef={videoRef} />
              ) : media.url ? (
                <Image
                  src={media.url}
                  alt={slide.heading || "Hero"}
                  fill
                  className="object-cover"
                  priority={cur === 0}
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />
            </div>

            <div className="relative h-full flex items-center">
              <div className="px-8 lg:px-12 max-w-xl">
                {slide.heading && (
                  <h1 className="font-display text-3xl lg:text-5xl font-bold text-white leading-tight mb-4">
                    {slide.heading}
                  </h1>
                )}
                {slide.text && (
                  <p className="text-lg text-white/90 mb-6 leading-relaxed">
                    {slide.text}
                  </p>
                )}
                {slide.buttonText && slide.buttonUrl && (
                  <Link
                    href={slide.buttonUrl}
                    className="inline-block px-7 py-3.5 bg-gold-500 text-white font-semibold rounded-xl hover:bg-gold-600 transition-colors"
                  >
                    {slide.buttonText}
                  </Link>
                )}
              </div>
            </div>

            {ds.length > 1 && (
              <>
                <button
                  onClick={prev}
                  disabled={transitioning}
                  aria-label="Previous"
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-50"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={next}
                  disabled={transitioning}
                  aria-label="Next"
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center text-white disabled:opacity-50"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {ds.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      disabled={transitioning}
                      className={`h-2 rounded-full transition-all ${i === cur ? "bg-white w-8" : "bg-white/50 w-2"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Side banners */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            {db.slice(0, 2).map((banner, i) => (
              <BannerCard key={i} banner={banner} gradientIndex={i} />
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideIn {
          from {
            transform: translateX(40px);
            opacity: 0;
          }
          to {
            transform: none;
            opacity: 1;
          }
        }
        @keyframes zoomIn {
          from {
            transform: scale(1.08);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }
        .animate-slide-in {
          animation: slideIn 0.6s ease-out;
        }
        .animate-zoom-in {
          animation: zoomIn 0.6s ease-out;
        }
      `}</style>
    </section>
  );
}

// ── VideoBackground ───────────────────────────────────────────────────────────
// ✅ Accepts MutableRefObject<HTMLVideoElement | null> — matches useRef<…|null>(null)
function VideoBackground({
  url,
  videoRef,
}: {
  url: string;
  videoRef: React.MutableRefObject<HTMLVideoElement | null>;
}) {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const m = url.match(/(?:youtu\.be\/|v\/|watch\?v=|embed\/)([^#&?]{11})/);
    const id = m?.[1];
    if (id)
      return (
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&modestbranding=1`}
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          style={{ pointerEvents: "none" }}
        />
      );
  }
  if (url.includes("vimeo.com")) {
    const m = url.match(/vimeo.*\/(\d+)/i);
    const id = m?.[1];
    if (id)
      return (
        <iframe
          src={`https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&background=1&controls=0`}
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          style={{ pointerEvents: "none" }}
        />
      );
  }
  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      className="w-full h-full object-cover"
    >
      <source src={url} type="video/mp4" />
    </video>
  );
}

// ── BannerCard ────────────────────────────────────────────────────────────────
const GRADIENTS = [
  "from-brand-800 to-brand-600",
  "from-gold-600 to-orange-500",
];

function BannerCard({
  banner,
  gradientIndex,
}: {
  banner: HeroBanner;
  gradientIndex: number;
}) {
  const imageUrl = banner.media?.[0]?.url || (banner as any).image || "";
  return (
    <div
      className={`relative rounded-2xl overflow-hidden h-[190px] lg:h-[243px] group ${imageUrl ? "bg-gray-900" : `bg-gradient-to-br ${GRADIENTS[gradientIndex % 2]}`}`}
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={banner.heading || "Banner"}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="relative h-full flex flex-col justify-end p-6">
        {banner.heading && (
          <h3 className="font-display text-xl font-bold text-white mb-1">
            {banner.heading}
          </h3>
        )}
        {banner.text && (
          <p className="text-sm text-white/80 mb-3">{banner.text}</p>
        )}
        {banner.buttonText && banner.buttonUrl && (
          <Link
            href={banner.buttonUrl}
            className="inline-block self-start px-4 py-2 bg-gold-500 text-white text-sm font-semibold rounded-lg hover:bg-gold-600 transition-colors"
          >
            {banner.buttonText}
          </Link>
        )}
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getMedia(s: HeroSlide | HeroBanner): {
  url: string;
  type: "image" | "video";
} {
  if (s.media?.length) return s.media[0];
  if ((s as HeroSlide).videoUrl)
    return { url: (s as HeroSlide).videoUrl!, type: "video" };
  return { url: (s as any).image || "", type: "image" };
}

function HeroSkeleton() {
  return (
    <section className="bg-gray-50">
      <div className="container py-6">
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-[400px] lg:h-[500px] rounded-2xl bg-gray-200 animate-pulse" />
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            <div className="h-[190px] lg:h-[243px] rounded-2xl bg-gray-200 animate-pulse" />
            <div className="h-[190px] lg:h-[243px] rounded-2xl bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
