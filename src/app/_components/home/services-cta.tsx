import Link from "next/link";

export function ServicesCTA() {
  return (
    <section className="bg-gradient-to-r from-brand-800 to-brand-700 rounded-3xl mx-4 lg:mx-0 my-16 overflow-hidden">
      <div className="container py-12">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-display text-2xl lg:text-3xl font-bold text-white mb-3">
              Need a Custom Quote?
            </h2>
            <p className="text-brand-200 mb-6">
              For bulk orders and wholesale inquiries, request a personalized
              quotation from our team.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/quotation"
                className="px-6 py-3 bg-gold-500 text-white font-semibold rounded-xl hover:bg-gold-600 transition-colors"
              >
                Request Quotation
              </Link>
              <Link
                href="/consultation"
                className="px-6 py-3 bg-white/15 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/25 transition-colors"
              >
                Book a Consultation
              </Link>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              {[
                "Bulk Orders",
                "Corporate Packages",
                "Expert Advice",
                "Custom Solutions",
              ].map((item) => (
                <div
                  key={item}
                  className="bg-white/10 rounded-xl p-4 text-center"
                >
                  <p className="text-white font-medium text-sm">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
