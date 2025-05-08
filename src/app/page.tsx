"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import Header from "@/components/views/landing-page/Header";
import Hero from "@/components/views/landing-page/Hero";
import SocialProof from "@/components/views/landing-page/SocialProof";
import Features from "@/components/views/landing-page/Features";
import Testimonials from "@/components/views/landing-page/Testimonials";
import CTA from "@/components/views/landing-page/CTA";
import Footer from "@/components/views/landing-page/Footer";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Home() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };
    
    checkSession();
  }, [router, supabase]);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Head>
        <title>Billar - Pool Games Management</title>
        <meta
          name="description"
          content="Billar - A modern platform for managing pool games and tournaments."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header />

      <main className="flex-grow">
        <Hero />
        <SocialProof />
        <Features />
        <Testimonials />
        <CTA />
      </main>

      <Footer />
    </div>
  );
}
