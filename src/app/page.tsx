import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BarChart3, Calendar, Clock, Gift, MessageSquare, Shield, Star, Users, Zap, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import Logo from "@/components/logo"
import DynamicBackground from "@/components/dynamic-background"
import BorderAccent from "@/components/border-accent"
import AnimatedGrid from "@/components/animated-grid"
import AnimatedGradient from "@/components/animated-gradient"
import RefinedBorder from "@/components/refined-border"
import ParallaxSection from "@/components/parallax-section"
import InteractiveCard from "@/components/interactive-card"
import ScrollReveal from "@/components/scroll-reveal"
import RefinedTableAnimation from "@/components/animations/refined-table-animation"
import RefinedCustomerAnimation from "@/components/animations/refined-customer-animation"
import RefinedAnalyticsAnimation from "@/components/animations/refined-analytics-animation"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-black text-white relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <DynamicBackground />
      <AnimatedGrid />
      <AnimatedGradient opacity={0.05} speed={0.3} />

      {/* Border Accents */}
      <BorderAccent position="top-right" />
      <BorderAccent position="bottom-left" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-sm border-b border-zinc-800">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 relative">
          <BorderAccent position="top-left" className="opacity-30 scale-75" />
          <div className="flex items-center gap-2">
            <Logo size={40} />
            <span className="text-xl font-bold">8ball</span>
          </div>
          <nav className="hidden space-x-6 md:flex">
            <Link href="#features" className="text-sm hover:text-red-400 transition-colors duration-300">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm hover:text-red-400 transition-colors duration-300">
              How It Works
            </Link>
            <Link href="#pricing" className="text-sm hover:text-red-400 transition-colors duration-300">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="hidden border-green-500 text-green-500 hover:bg-green-950 hover:text-green-400 md:inline-flex transition-all duration-300"
              asChild
            >
              <Link href="/auth/login">Log In</Link>
            </Button>
            <Button className="bg-red-600 text-white hover:bg-red-500 transition-all duration-300" asChild>
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 relative z-10">
        <BorderAccent position="bottom-right" className="opacity-40 scale-150" />
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <ScrollReveal direction="left" delay={0.2}>
            <div className="flex flex-col justify-center space-y-6">
              <h1 className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                Manage Your Billiard Hall Like A <span className="text-green-500">Pro</span>
              </h1>
              <p className="max-w-md text-lg text-gray-400">
                The all-in-one management system designed specifically for billiard hall owners to streamline operations
                and boost revenue.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  className="bg-green-600 text-white hover:bg-green-500 transition-all duration-300 transform hover:scale-105"
                  size="lg"
                  asChild
                >
                  <Link href="/auth/register">Start Free Trial</Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-red-500 text-red-500 hover:bg-red-950 hover:text-red-400 transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  Watch Demo
                </Button>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" delay={0.4}>
            <ParallaxSection speed={0.1} direction="left">
              <div className="relative h-[300px] overflow-hidden rounded-xl md:h-[400px]">
                <Image
                  src="/images/billiard-player.png"
                  alt="Professional billiard player aiming at pool table"
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
              </div>
            </ParallaxSection>
          </ScrollReveal>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-zinc-900/80 py-20 relative">
        <BorderAccent position="top-left" className="opacity-30 scale-125" />
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="up" delay={0.1}>
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Powerful Features for Billiard Hall Owners</h2>
              <p className="mx-auto max-w-2xl text-gray-400">
                Everything you need to manage tables, track revenue, and keep your customers coming back.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <ScrollReveal direction="up" delay={0.2}>
              <InteractiveCard color="green" className="h-full">
                <div className="rounded-lg bg-zinc-800/90 backdrop-blur-sm p-6 h-full">
                  <div className="mb-4 inline-flex rounded-full bg-green-900/30 p-3">
                    <Calendar className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Table Booking</h3>
                  <p className="text-gray-400">
                    Streamline reservations and maximize table usage with our intuitive booking system.
                  </p>
                </div>
              </InteractiveCard>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3}>
              <InteractiveCard color="red" className="h-full">
                <div className="rounded-lg bg-zinc-800/90 backdrop-blur-sm p-6 h-full">
                  <div className="mb-4 inline-flex rounded-full bg-red-900/30 p-3">
                    <Clock className="h-6 w-6 text-red-500" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Time Tracking</h3>
                  <p className="text-gray-400">
                    Automatically track table usage time and calculate charges with precision.
                  </p>
                </div>
              </InteractiveCard>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.4}>
              <InteractiveCard color="red" className="h-full">
                <div className="rounded-lg bg-zinc-800/90 backdrop-blur-sm p-6 h-full">
                  <div className="mb-4 inline-flex rounded-full bg-red-900/30 p-3">
                    <Users className="h-6 w-6 text-red-500" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Customer Management</h3>
                  <p className="text-gray-400">
                    Build customer loyalty with profiles, history, and personalized promotions.
                  </p>
                </div>
              </InteractiveCard>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.5}>
              <InteractiveCard color="green" className="h-full">
                <div className="rounded-lg bg-zinc-800/90 backdrop-blur-sm p-6 h-full">
                  <div className="mb-4 inline-flex rounded-full bg-green-900/30 p-3">
                    <BarChart3 className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">Analytics</h3>
                  <p className="text-gray-400">
                    Gain insights into your business with detailed reports and performance metrics.
                  </p>
                </div>
              </InteractiveCard>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Enhanced How It Works */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/50 to-black pointer-events-none"></div>
        <BorderAccent position="bottom-right" className="opacity-30 scale-125" />
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="up">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">How 8ball Works</h2>
              <p className="mx-auto max-w-2xl text-gray-400">
                Our sophisticated system streamlines every aspect of billiard hall management
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-16 md:grid-cols-2 items-center mb-20">
            <div className="order-2 md:order-1">
              <ScrollReveal direction="left">
                <RefinedBorder color="green" thickness={2} glowIntensity={0.3}>
                  <div className="bg-zinc-900/90 backdrop-blur-sm p-6 rounded-lg h-full">
                    <h3 className="text-2xl font-bold mb-4">Intelligent Table Management</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Real-time table availability dashboard with visual indicators</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Automated time tracking with customizable rate structures</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Maintenance scheduling and history for each table</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Utilization analytics to optimize table placement and pricing</span>
                      </li>
                    </ul>
                  </div>
                </RefinedBorder>
              </ScrollReveal>
            </div>
            <div className="order-1 md:order-2">
              <ScrollReveal direction="right">
                <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden transform transition-all duration-700 hover:shadow-xl hover:shadow-red-500/20">
                  <RefinedTableAnimation />
                </div>
              </ScrollReveal>
            </div>
          </div>

          <div className="grid gap-16 md:grid-cols-2 items-center mb-20">
            <div>
              <ScrollReveal direction="left">
                <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden transform transition-all duration-700 hover:shadow-xl hover:shadow-green-500/20">
                  <RefinedCustomerAnimation />
                </div>
              </ScrollReveal>
            </div>
            <div>
              <ScrollReveal direction="right">
                <RefinedBorder color="red" thickness={2} glowIntensity={0.3}>
                  <div className="bg-zinc-900/90 backdrop-blur-sm p-6 rounded-lg h-full">
                    <h3 className="text-2xl font-bold mb-4">Advanced Customer Engagement</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Comprehensive customer profiles with play history and preferences</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Automated loyalty program with tiered rewards</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Targeted promotions based on customer behavior</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Integrated communication tools for notifications and marketing</span>
                      </li>
                    </ul>
                  </div>
                </RefinedBorder>
              </ScrollReveal>
            </div>
          </div>

          <div className="grid gap-16 md:grid-cols-2 items-center">
            <div className="order-2 md:order-1">
              <ScrollReveal direction="left">
                <RefinedBorder color="green" thickness={2} glowIntensity={0.3}>
                  <div className="bg-zinc-900/90 backdrop-blur-sm p-6 rounded-lg h-full">
                    <h3 className="text-2xl font-bold mb-4">Business Intelligence</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Comprehensive financial reporting and forecasting</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Peak hour analysis to optimize staffing and promotions</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Inventory management for food, beverages, and equipment</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Customizable dashboards with key performance indicators</span>
                      </li>
                    </ul>
                  </div>
                </RefinedBorder>
              </ScrollReveal>
            </div>
            <div className="order-1 md:order-2">
              <ScrollReveal direction="right">
                <div className="relative h-[300px] md:h-[400px] rounded-xl overflow-hidden transform transition-all duration-700 hover:shadow-xl hover:shadow-red-500/20">
                  <RefinedAnalyticsAnimation />
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Recognition Section (Replacing Testimonial) */}
      <section className="bg-zinc-900/80 py-20 relative">
        <BorderAccent position="top-right" className="opacity-30 scale-125" />
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="up">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Why 8ball Stands Apart</h2>
              <p className="mx-auto max-w-2xl text-gray-400">
                The premium choice for billiard hall owners who demand excellence
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-8 md:grid-cols-3">
            <ScrollReveal direction="up" delay={0.2}>
              <InteractiveCard color="green" className="h-full">
                <div className="bg-zinc-800/90 backdrop-blur-sm rounded-xl p-8 h-full">
                  <div className="mb-6 inline-flex rounded-full bg-green-900/30 p-4">
                    <Shield className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Industry-Leading Security</h3>
                  <p className="text-gray-400">
                    Enterprise-grade security protocols protect your business data and customer information with
                    bank-level encryption and regular security audits.
                  </p>
                </div>
              </InteractiveCard>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3}>
              <InteractiveCard color="red" className="h-full">
                <div className="bg-zinc-800/90 backdrop-blur-sm rounded-xl p-8 h-full">
                  <div className="mb-6 inline-flex rounded-full bg-red-900/30 p-4">
                    <Zap className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Unmatched Performance</h3>
                  <p className="text-gray-400">
                    Our system processes transactions in milliseconds, handles peak loads effortlessly, and maintains
                    99.9% uptime for reliable operation around the clock.
                  </p>
                </div>
              </InteractiveCard>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.4}>
              <InteractiveCard color="green" className="h-full">
                <div className="bg-zinc-800/90 backdrop-blur-sm rounded-xl p-8 h-full">
                  <div className="mb-6 inline-flex rounded-full bg-green-900/30 p-4">
                    <Users className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Dedicated Support Team</h3>
                  <p className="text-gray-400">
                    Our specialized support team has deep industry knowledge and provides personalized assistance with
                    an average response time of under 2 hours.
                  </p>
                </div>
              </InteractiveCard>
            </ScrollReveal>
          </div>

          <ScrollReveal direction="up" delay={0.5}>
            <div className="mt-16 text-center">
              <RefinedBorder color="red" thickness={2} glowIntensity={0.3}>
                <div className="bg-zinc-900/90 backdrop-blur-sm px-8 py-6 rounded-lg">
                  <p className="text-xl font-medium mb-6">
                    "8ball has revolutionized the billiard hall management industry with its innovative approach and
                    attention to detail."
                  </p>
                  <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8">
                    <div className="h-12 w-32 bg-zinc-800/80 rounded flex items-center justify-center">
                      <span className="text-gray-400">BilliardsMag</span>
                    </div>
                    <div className="h-12 w-32 bg-zinc-800/80 rounded flex items-center justify-center">
                      <span className="text-gray-400">PoolTech</span>
                    </div>
                    <div className="h-12 w-32 bg-zinc-800/80 rounded flex items-center justify-center">
                      <span className="text-gray-400">HospitalityPro</span>
                    </div>
                  </div>
                </div>
              </RefinedBorder>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 relative">
        <BorderAccent position="top-left" className="opacity-30 scale-75" />
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="up">
            <div className="mb-16 text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Simple, Transparent Pricing</h2>
              <p className="mx-auto max-w-2xl text-gray-400">
                Choose the plan that fits your billiard hall size and needs. No hidden fees, cancel anytime.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid gap-8 md:grid-cols-3">
            <ScrollReveal direction="up" delay={0.2}>
              <div className="rounded-xl border border-zinc-800 p-8 backdrop-blur-sm transition-all duration-300 hover:border-green-700/50 hover:shadow-lg hover:shadow-green-700/10">
                <div className="mb-6">
                  <h3 className="text-xl font-bold">Starter</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold">$49</span>
                    <span className="ml-2 text-gray-400">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">For small billiard halls with up to 5 tables</p>
                </div>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                    <span>Table management & booking</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                    <span>Basic customer profiles</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                    <span>Basic reporting</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                    <span>Email support</span>
                  </li>
                </ul>
                <Button
                  variant="outline"
                  className="w-full border-green-500 text-green-500 hover:bg-green-950 hover:text-green-400 transition-all duration-300"
                  asChild
                >
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.3}>
              <div className="relative rounded-xl border border-red-600/50 bg-zinc-900/70 p-8 backdrop-blur-sm transition-all duration-300 hover:border-red-500 hover:shadow-lg hover:shadow-red-700/20">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-red-600 px-4 py-1 text-sm font-bold">
                  MOST POPULAR
                </div>
                <div className="mb-6">
                  <h3 className="text-xl font-bold">Professional</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold">$99</span>
                    <span className="ml-2 text-gray-400">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">For growing halls with 6-15 tables</p>
                </div>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-red-500" />
                    <span>Everything in Starter</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-red-500" />
                    <span>Advanced customer management</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-red-500" />
                    <span>Employee scheduling</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-red-500" />
                    <span>Inventory management</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-red-500" />
                    <span>Priority support</span>
                  </li>
                </ul>
                <Button className="w-full bg-red-600 text-white hover:bg-red-500 transition-all duration-300" asChild>
                  <Link href="/auth/register">Get Started</Link>
                </Button>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={0.4}>
              <div className="rounded-xl border border-zinc-800 p-8 backdrop-blur-sm transition-all duration-300 hover:border-green-700/50 hover:shadow-lg hover:shadow-green-700/10">
                <div className="mb-6">
                  <h3 className="text-xl font-bold">Enterprise</h3>
                  <div className="mt-4 flex items-baseline">
                    <span className="text-4xl font-bold">$199</span>
                    <span className="ml-2 text-gray-400">/month</span>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">For large venues with 16+ tables</p>
                </div>
                <ul className="mb-8 space-y-3">
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                    <span>Everything in Professional</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                    <span>Multi-location support</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                    <span>Advanced analytics & reporting</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                    <span>API access</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
                    <span>Dedicated account manager</span>
                  </li>
                </ul>
                <Button
                  variant="outline"
                  className="w-full border-green-500 text-green-500 hover:bg-green-950 hover:text-green-400 transition-all duration-300"
                  asChild
                >
                  <Link href="/auth/register">Contact Sales</Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-black py-12">
        <div className="container mx-auto px-4">
          <div className="mb-8 grid gap-12 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Logo size={32} />
                <span className="text-lg font-bold">8ball</span>
              </div>
              <p className="text-sm text-gray-400">
                The ultimate management solution for billiard halls. Streamline operations and boost your revenue.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#features" className="text-sm hover:text-red-400 transition-colors duration-300">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="text-sm hover:text-red-400 transition-colors duration-300">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm hover:text-red-400 transition-colors duration-300">
                    Testimonials
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm hover:text-red-400 transition-colors duration-300">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm hover:text-red-400 transition-colors duration-300">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm hover:text-red-400 transition-colors duration-300">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm hover:text-red-400 transition-colors duration-300">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm hover:text-red-400 transition-colors duration-300">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-400">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-sm hover:text-red-400 transition-colors duration-300">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm hover:text-red-400 transition-colors duration-300">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm hover:text-red-400 transition-colors duration-300">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-8 text-center">
            <p className="text-sm text-gray-500">© 2023 8ball. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
