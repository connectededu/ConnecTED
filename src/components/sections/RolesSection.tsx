import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Heart, 
  BookOpen, 
  Settings,
  Eye,
  MessageCircle,
  Calendar,
  ClipboardList,
  Users,
  PieChart,
  Bell,
  FileText
} from "lucide-react";

const RolesSection = () => {
  const roles = [
    {
      id: "parents",
      title: "For Parents",
      description: "Stay connected with your child's education journey. Get real-time updates, communicate with teachers, and never miss an important announcement.",
      icon: Heart,
      color: "from-primary to-accent",
      features: [
        { icon: Eye, text: "View grades, attendance & homework" },
        { icon: MessageCircle, text: "Direct messaging with teachers" },
        { icon: Calendar, text: "School calendar & event RSVPs" },
        { icon: FileText, text: "Access report cards & documents" },
      ],
    },
    {
      id: "teachers",
      title: "For Teachers",
      description: "Streamline your communication with parents. Post updates instantly, mark attendance, and share student progress with ease.",
      icon: BookOpen,
      color: "from-accent to-primary",
      features: [
        { icon: ClipboardList, text: "Post grades & homework updates" },
        { icon: Users, text: "Mark attendance with parent alerts" },
        { icon: MessageCircle, text: "Class-wide announcements" },
        { icon: Bell, text: "Instant parent notifications" },
      ],
    },
    {
      id: "admins",
      title: "For Administrators",
      description: "Manage your entire school community from one dashboard. Broadcast messages, analyze engagement, and ensure smooth operations.",
      icon: Settings,
      color: "from-primary via-accent to-primary",
      features: [
        { icon: Users, text: "Manage users, classes & roles" },
        { icon: PieChart, text: "Analytics & engagement insights" },
        { icon: Bell, text: "School-wide announcements" },
        { icon: FileText, text: "Surveys & feedback collection" },
      ],
    },
  ];

  return (
    <section className="py-24 relative overflow-hidden bg-muted/30">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      <div className="section-container relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Built for Everyone
          </span>
          <h2 className="heading-section mb-4">
            One Platform,{" "}
            <span className="text-gradient">Three Perspectives</span>
          </h2>
          <p className="text-body-large">
            ConnecTED adapts to each user's needs, providing tailored experiences 
            for parents, teachers, and administrators.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid lg:grid-cols-3 gap-8">
          {roles.map((role, i) => (
            <div
              key={role.id}
              id={role.id}
              className="group relative rounded-2xl bg-card border border-border/50 overflow-hidden transition-all duration-500 hover:shadow-large hover:-translate-y-1"
            >
              {/* Gradient Header */}
              <div className={`h-2 bg-gradient-to-r ${role.color}`} />

              <div className="p-8">
                {/* Icon & Title */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${role.color} shadow-medium`}>
                    <role.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold">{role.title}</h3>
                </div>

                {/* Description */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {role.description}
                </p>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  {role.features.map((feature) => (
                    <div key={feature.text} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <feature.icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Button variant="outline" className="w-full group/btn">
                  Learn More
                  <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RolesSection;
