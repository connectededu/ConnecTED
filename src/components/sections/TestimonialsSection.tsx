import { Star, Quote } from "lucide-react";

const TestimonialsSection = () => {
  const testimonials = [
    {
      quote: "ConnecTED has transformed how we communicate with parents. No more chasing WhatsApp messages or wondering if notices reached home.",
      author: "Sarah Mitchell",
      role: "5th Grade Teacher",
      school: "Lincoln Elementary",
      rating: 5,
    },
    {
      quote: "I finally feel connected to my son's school life. Getting instant updates about his progress and homework has made such a difference.",
      author: "Michael Chen",
      role: "Parent",
      school: "Oakwood Academy",
      rating: 5,
    },
    {
      quote: "The analytics dashboard gives me insights I never had before. I can see engagement trends and ensure no family gets left behind.",
      author: "Dr. Emily Rodriguez",
      role: "Principal",
      school: "Westside High School",
      rating: 5,
    },
    {
      quote: "Parent-teacher meeting scheduling used to be a nightmare. Now it's seamless with automatic reminders and easy rescheduling.",
      author: "James Wilson",
      role: "Vice Principal",
      school: "Riverside Middle School",
      rating: 5,
    },
    {
      quote: "As a working parent, I love getting push notifications about school events. I've never missed an RSVP since we started using ConnecTED.",
      author: "Amanda Foster",
      role: "Parent",
      school: "St. Mary's School",
      rating: 5,
    },
    {
      quote: "The attendance alerts are a game-changer. Parents are notified instantly when their child is marked absent, reducing confusion.",
      author: "Robert Kim",
      role: "Administrator",
      school: "Harbor View Academy",
      rating: 5,
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute inset-0 pattern-dots opacity-30" />

      <div className="section-container relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Testimonials
          </span>
          <h2 className="heading-section mb-4">
            Loved by Schools{" "}
            <span className="text-gradient">Everywhere</span>
          </h2>
          <p className="text-body-large">
            Join thousands of schools that have transformed their communication with ConnecTED.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, i) => (
            <div
              key={testimonial.author}
              className="relative rounded-2xl bg-card border border-border/50 p-6 transition-all duration-500 hover:shadow-medium hover:-translate-y-1"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/10" />

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-foreground/90 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground font-semibold">
                  {testimonial.author.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-sm">{testimonial.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {testimonial.role} • {testimonial.school}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
