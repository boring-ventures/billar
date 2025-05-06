import { Star, Quote } from "lucide-react";
import { BlurFade } from "@/components/magicui/blur-fade";
import { ShineBorder } from "@/components/magicui/shine-border";
import { AnimatedShinyText } from "@/components/magicui/animated-shiny-text";

const testimonials = [
  {
    id: "t1",
    quote:
      "Billar has made organizing our weekly tournament nights so much easier. The scoring system is flawless!",
    author: "Sarah J.",
    position: "Pool Hall Owner",
    rating: 5,
  },
  {
    id: "t2",
    quote:
      "As the president of our local pool league, I can say Billar has revolutionized how we track player statistics.",
    author: "Michael R.",
    position: "League President",
    rating: 5,
  },
  {
    id: "t3",
    quote:
      "I've tried other tournament apps, but Billar stands out with its user-friendly interface and powerful features.",
    author: "Emily L.",
    position: "Professional Player",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-28 bg-white relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <BlurFade>
            <AnimatedShinyText>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What Our Users Say
              </h2>
            </AnimatedShinyText>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              See how Billar is transforming pool game management for players
              and organizers
            </p>
          </BlurFade>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <BlurFade key={testimonial.id} delay={i * 0.1}>
              <ShineBorder
                className="h-full bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-all duration-300"
                color="rgba(var(--primary), 0.2)"
                borderWidth={1}
              >
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={`${testimonial.id}-star-${i}`}
                      className="h-5 w-5 text-primary fill-current"
                    />
                  ))}
                </div>

                <div className="mb-6 text-gray-400">
                  <Quote className="h-8 w-8 opacity-20" />
                </div>

                <p className="text-gray-700 mb-6 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>

                <div className="mt-auto">
                  <p className="text-gray-900 font-semibold">
                    {testimonial.author}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {testimonial.position}
                  </p>
                </div>
              </ShineBorder>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
