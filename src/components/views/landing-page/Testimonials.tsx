import Image from "next/image";
import { Star } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { cn } from "@/lib/utils";

const testimonials = [
  {
    name: "James Wilson",
    role: "Owner, Downtown Billiards",
    image: "/testimonials/person1.jpg",
    content:
      "This system has completely transformed how we run our billiard parlour. We&apos;ve reduced wait times, eliminated double bookings, and increased our revenue by 35% in just three months.",
    rating: 5,
  },
  {
    name: "Sarah Chen",
    role: "Manager, Elite Pool Hall",
    image: "/testimonials/person2.jpg",
    content:
      "The financial reporting is outstanding. For the first time, I can see exactly where our revenue is coming from and where we can optimize. The inventory system has also saved us from countless stockouts.",
    rating: 5,
  },
  {
    name: "Michael Rodriguez",
    role: "Owner, The Cue Club",
    image: "/testimonials/person3.jpg",
    content:
      "The staff management features alone are worth the price. My team can now manage table sessions efficiently, and I can track everything. The $20/month is a no-brainer for the value we&apos;re getting.",
    rating: 5,
  },
  {
    name: "Lisa Johnson",
    role: "Operations Director, City Billiards",
    image: "/testimonials/person4.jpg",
    content:
      "We used to have a paper-based system that was a nightmare to manage. Now everything is digital, synced across devices, and just works. I can&apos;t imagine running our business without it now.",
    rating: 4,
  },
  {
    name: "Robert Thompson",
    role: "Owner, Classic Pool Lounge",
    image: "/testimonials/person5.jpg",
    content:
      "The reservation system has eliminated no-shows by 90%. The ability to take deposits and send automated reminders has been a game-changer for our weekend business.",
    rating: 5,
  },
  {
    name: "Emily Patel",
    role: "Manager, Uptown Billiards",
    image: "/testimonials/person6.jpg",
    content:
      "Customer service is exceptional. Whenever we&apos;ve had questions, the team responds quickly. The regular updates with new features show they&apos;re really listening to feedback.",
    rating: 5,
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1 mb-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
          )}
        />
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_60%,transparent_100%)]"></div>

      {/* Glow effects */}
      <div className="absolute top-0 right-0 w-1/2 h-1/3 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/3 bg-green-500/10 rounded-full blur-3xl -z-10"></div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-primary font-medium mb-2">Testimonials</p>
          <h2 className="text-4xl font-bold mb-4">
            Trusted by Billiard Parlour Owners
          </h2>
          <p className="text-xl text-slate-400">
            Don&apos;t just take our word for it. See what other billiard
            parlour owners and managers have to say.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <BlurFade key={testimonial.name} delay={i * 0.1}>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl h-full flex flex-col hover:border-primary/50 transition-colors">
                <StarRating rating={testimonial.rating} />
                <p className="text-slate-300 mb-6 flex-grow">
                  {testimonial.content}
                </p>
                <div className="flex items-center">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 bg-slate-700 flex items-center justify-center">
                    {testimonial.image ? (
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-semibold text-slate-500">
                        {testimonial.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-slate-400">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            </BlurFade>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-4xl font-bold text-white mb-4">4.9/5</p>
          <div className="flex justify-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-6 w-6 text-yellow-400 fill-yellow-400"
              />
            ))}
          </div>
          <p className="text-slate-400">
            Average customer rating based on 100+ reviews
          </p>
        </div>
      </div>
    </section>
  );
}
