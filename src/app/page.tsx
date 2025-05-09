"use client";

import Header from "@/components/views/landing-page/Header";
import Hero from "@/components/views/landing-page/Hero";
import Features from "@/components/views/landing-page/Features";
import Testimonials from "@/components/views/landing-page/Testimonials";
import About from "@/components/views/landing-page/About";
import CTA from "@/components/views/landing-page/CTA";
import SocialProof from "@/components/views/landing-page/SocialProof";
import Footer from "@/components/views/landing-page/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <SocialProof />
        <Features />
        <About />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
