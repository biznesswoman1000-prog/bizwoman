import ConsultationForm from "@/app/_components/consultation-form";

export const metadata = {
  title: "Book a Consultation",
};

export default function ConsultationPage() {
  return (
    <div className="container py-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-gray-900">
          Book a Consultation
        </h1>
        <p className="mt-2 text-gray-500">
          Get expert advice from our team on business solutions, products, and
          strategies tailored to your needs.
        </p>
      </div>
      <ConsultationForm />
    </div>
  );
}
