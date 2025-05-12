import Link from "next/link"
import Image from "next/image"
import { ArrowRight, BarChart3, Calendar, Clock, Shield, Users, Zap, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import Logo from "@/components/landing-v0/logo"
import DynamicBackground from "@/components/landing-v0/dynamic-background"
import BorderAccent from "@/components/landing-v0/border-accent"
import AnimatedGrid from "@/components/landing-v0/animated-grid"
import AnimatedGradient from "@/components/landing-v0/animated-gradient"
import RefinedBorder from "@/components/landing-v0/refined-border"
import ParallaxSection from "@/components/landing-v0/parallax-section"
import InteractiveCard from "@/components/landing-v0/interactive-card"
import ScrollReveal from "@/components/landing-v0/scroll-reveal"
import RefinedTableAnimation from "@/components/landing-v0/animations/refined-table-animation"
import RefinedCustomerAnimation from "@/components/landing-v0/animations/refined-customer-animation"
import RefinedAnalyticsAnimation from "@/components/landing-v0/animations/refined-analytics-animation"

export default function Home() {
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
            >
              Log In
            </Button>
            <Button className="bg-red-600 text-white hover:bg-red-500 transition-all duration-300">Get Started</Button>
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
                >
                  Start Free Trial
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
                        <span>Customer profiles with play history and preferences</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Loyalty program with points and rewards system</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Automated notifications for promotions and events</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Customer feedback and satisfaction tracking</span>
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
                    <h3 className="text-2xl font-bold mb-4">Comprehensive Analytics</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Real-time revenue tracking and financial insights</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Table utilization and peak hour analysis</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Customer behavior and preferences analytics</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle2 className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span>Customizable reports and data export options</span>
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
    </div>
  )
}
