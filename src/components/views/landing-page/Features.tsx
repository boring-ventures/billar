import {
  LayoutDashboard,
  Calendar,
  DollarSign,
  ShoppingCart,
  BarChart2,
  Users,
  Clock,
  ClipboardList,
} from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { TickingCounter } from "@/components/magicui/ticking-counter";

export default function Features() {
  const features = [
    {
      icon: LayoutDashboard,
      title: "Table Management",
      description:
        "Monitor and manage all your billiard tables in real-time. Track table status, availability, and efficiently handle maintenance schedules.",
      color: "bg-red-500/10 text-red-500",
    },
    {
      icon: Calendar,
      title: "Reservation System",
      description:
        "Allow customers to book tables in advance. Manage reservations with an intuitive calendar interface and prevent double bookings.",
      color: "bg-green-500/10 text-green-500",
    },
    {
      icon: Clock,
      title: "Time Tracking",
      description:
        "Automatically track table usage time with precise hourly rates. End sessions with a click and generate accurate bills.",
      color: "bg-red-500/10 text-red-500",
    },
    {
      icon: ShoppingCart,
      title: "POS & Inventory",
      description:
        "Sell food, drinks, and equipment with the built-in point of sale system. Track inventory levels and get low stock alerts.",
      color: "bg-green-500/20 text-green-500",
    },
    {
      icon: DollarSign,
      title: "Payment Processing",
      description:
        "Accept multiple payment methods including cash, credit cards, and QR payments. Easily manage unpaid bills and payment status.",
      color: "bg-red-500/20 text-red-500",
    },
    {
      icon: BarChart2,
      title: "Financial Reports",
      description:
        "Generate comprehensive financial reports with breakdowns of income from table rentals, food and beverages, and other revenue streams.",
      color: "bg-green-500/10 text-green-500",
    },
    {
      icon: Users,
      title: "Customer Management",
      description:
        "Build a database of your regular customers. Track preferences, reservation history, and create loyalty programs.",
      color: "bg-pink-500/10 text-pink-500",
    },
    {
      icon: ClipboardList,
      title: "Staff Management",
      description:
        "Manage employee accounts with different access levels. Track staff performance and table session assignments.",
      color: "bg-teal-500/10 text-teal-500",
    },
  ];

  return (
    <section
      id="features"
      className="py-24 bg-[#191919] relative overflow-hidden"
    >
      {/* Subtle diagonal pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#252525_1px,transparent_1px),linear-gradient(to_bottom,#252525_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_60%,transparent_100%)]"></div>

      {/* Colored glow effects */}
      <div className="absolute top-20 left-20 w-1/3 h-1/3 bg-red-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-20 right-20 w-1/3 h-1/3 bg-green-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-red-500 font-medium mb-2">Powerful Features</p>
          <h2 className="text-4xl font-bold tracking-tight mb-4 text-white">
            Everything You Need For Your Pool Hall
          </h2>
          <p className="text-xl text-gray-400">
            Our platform combines all essential tools into one unified system
          </p>

          <div className="flex justify-center gap-10 mt-8">
            <div className="text-center">
              <TickingCounter
                className="text-3xl font-bold text-red-500"
                from={0}
                to={40}
                duration={2.5}
              />
              <p className="text-sm text-gray-500">Fewer hours on admin work</p>
            </div>
            <div className="text-center">
              <TickingCounter
                className="text-3xl font-bold text-green-500"
                from={0}
                to={30}
                duration={2.5}
                suffix="%"
              />
              <p className="text-sm text-gray-500">Increase in revenues</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {features.map((feature, i) => (
            <BlurFade key={feature.title} delay={i * 0.1}>
              <div className="relative group">
                <div className="flex flex-col h-full p-6 bg-gray-900 rounded-2xl shadow-md border border-gray-800 hover:border-red-500/50 dark:hover:border-green-500/50 transition-all duration-300">
                  {/* Subtle color accent in the corner */}
                  <div
                    className={`absolute -top-1 -right-1 w-16 h-16 rounded-full opacity-20 ${i % 2 === 0 ? "bg-red-500/30" : "bg-green-500/30"} blur-xl -z-0`}
                  ></div>

                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-5 ${feature.color}`}
                  >
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 flex-grow">
                    {feature.description}
                  </p>

                  {/* Subtle accent line at the bottom */}
                  <div
                    className={`h-1 w-12 mt-4 rounded-full ${i % 2 === 0 ? "bg-red-500/50" : "bg-green-500/50"}`}
                  ></div>
                </div>
              </div>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
