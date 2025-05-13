import { Metadata } from "next";
import Header from "@/components/views/landing-page/Header";
import Hero from "@/components/views/landing-page/Hero";
import Features from "@/components/views/landing-page/Features";
import About from "@/components/views/landing-page/About";
import PricingCTA from "@/components/views/landing-page/CTA";
import Footer from "@/components/views/landing-page/Footer";

export const metadata: Metadata = {
  title: "BILLAR - Billiard Parlour Management App",
  description:
    "Comprehensive management app for billiard parlours. Manage tables, inventory, reservations, and payments for just $20/month.",
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-[#191919]">
      <Header />

      <main className="flex-grow pt-16">
        <Hero />
        <Features />
        <About />
        <PricingCTA />
      </main>

      <Footer />
    </div>
  );
}
