import { Metadata } from "next";
import Header from "@/components/views/landing-page/Header";
import Hero from "@/components/views/landing-page/Hero";
import Features from "@/components/views/landing-page/Features";
import About from "@/components/views/landing-page/About";
import PricingCTA from "@/components/views/landing-page/CTA";
import Footer from "@/components/views/landing-page/Footer";

export const metadata: Metadata = {
  title:
    "BILLARPRO - Plataforma Completa de Gestión para Salones de Billar | 8+ Módulos Integrados",
  description:
    "La solución más completa para salones de billar. 8+ módulos integrados: Dashboard inteligente, gestión de mesas, inventario, POS, control de gastos, reportes financieros, usuarios y configuración. Todo por solo $20/mes.",
  keywords:
    "gestión salón billar, software billar, POS billar, inventario billar, reportes financieros billar, dashboard billar, control mesas billar",
  openGraph: {
    title: "BILLARPRO - Plataforma Completa para Salones de Billar",
    description:
      "8+ módulos integrados para gestionar cada aspecto de tu salón de billar. Dashboard, mesas, inventario, POS, gastos, reportes y más.",
    type: "website",
  },
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
