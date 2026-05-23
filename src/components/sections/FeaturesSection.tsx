import { 
  MessageSquare, 
  Bell, 
  Calendar, 
  FileText, 
  Users, 
  BarChart3, 
  Shield, 
  Smartphone 
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Real-time Messaging",
      description: "Private, secure messaging between parents and teachers. Class-wide announcements with read receipts.",
    },
    {
      icon: Bell,
      title: "Instant Notifications",
      description: "Push, email, and SMS notifications ensure nothing important gets missed. Customizable alert preferences.",
    },
    {
      icon: Calendar,
      title: "Event Management",
      description: "School calendar with event RSVPs, parent-teacher meeting scheduling, and automatic reminders.",
    },
    {
      icon: FileText,
      title: "Digital Documents",
      description: "Share circulars, worksheets, report cards, and photos securely. No more lost papers.",
    },
    {
      icon: Users,
      title: "Student Profiles",
      description: "Complete view of attendance, grades, homework, behavior notes, and teacher remarks in one place.",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Administrators get insights on engagement, attendance trends, and communication metrics.",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Role-based access control, encrypted data, and GDPR compliant. Your data stays protected.",
    },
    {
      icon: Smartphone,
      title: "Mobile Responsive",
      description: "Access everything from any device. Beautiful experience on desktop, tablet, and mobile.",
    },
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pattern-grid opacity-30" />
      
      <div className="section-container relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Features
          </span>
          <h2 className="heading-section mb-4">
            Everything You Need for{" "}
            <span className="text-gradient">Seamless Communication</span>
          </h2>
          <p className="text-body-large">
            A comprehensive platform designed to keep everyone in the loop. 
            From instant messaging to detailed analytics, ConnecTED has it all.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="card-feature group"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Icon */}
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl gradient-primary mb-5 group-hover:shadow-glow transition-all duration-500">
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
