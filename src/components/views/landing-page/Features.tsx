import { Trophy, Users, Clock, Calendar, Award, ChartBar } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { ShineBorder } from "@/components/magicui/shine-border";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";

const features = [
  {
    id: "tournament-management",
    icon: Trophy,
    title: "Tournament Management",
    description:
      "Create and manage pool tournaments with customizable formats and rules.",
  },
  {
    id: "player-profiles",
    icon: Users,
    title: "Player Profiles",
    description:
      "Track player statistics, rankings, and performance history over time.",
  },
  {
    id: "real-time-scoring",
    icon: Clock,
    title: "Real-Time Scoring",
    description:
      "Update game scores in real-time and instantly share results with participants.",
  },
  {
    id: "event-scheduling",
    icon: Calendar,
    title: "Event Scheduling",
    description:
      "Schedule games and tournaments with integrated notifications and reminders.",
  },
  {
    id: "leaderboards",
    icon: Award,
    title: "Leaderboards",
    description:
      "Showcase top players with dynamic leaderboards and achievement badges.",
  },
  {
    id: "analytics",
    icon: ChartBar,
    title: "Performance Analytics",
    description:
      "Gain insights into player and tournament statistics with detailed analytics.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="relative py-28 bg-gray-50 overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-20 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl -z-0" />
      <div className="absolute bottom-40 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-0" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <BlurFade>
            <AnimatedShinyText>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything you need
              </h2>
            </AnimatedShinyText>
            <p className="text-lg text-gray-600">
              Comprehensive tools to manage your pool games and tournaments with
              ease
            </p>
          </BlurFade>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {features.map((feature, i) => (
            <BlurFade key={feature.id} delay={i * 0.1} className="group">
              <ShineBorder
                className="h-full bg-white rounded-xl hover:shadow-lg transition-all duration-300"
                color="rgba(var(--primary), 0.3)"
                borderWidth={1}
              >
                <div className="flex flex-col p-8">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-lg bg-primary/10 text-primary mb-6 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-7 w-7" />
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </ShineBorder>
            </BlurFade>
          ))}
        </div>
      </div>

      {/* Bottom wave divider */}
      <div className="absolute bottom-0 left-0 right-0 h-16 overflow-hidden">
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className="absolute bottom-0 w-full h-full transform translate-y-1/2"
          fill="white"
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.11,130.83,141.14,213.2,141.14c67.6,0,124.85-16.73,180.19-39.9a396.42,396.42,0,0,1,40.5-19.18Z" />
        </svg>
      </div>
    </section>
  );
}
