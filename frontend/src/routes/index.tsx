import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";

const HomeComponent = () => {
  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-background" />
        <div className="absolute inset-0 opacity-30 animate-pulse" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4 sm:px-6 lg:px-8">
        <motion.h1
          className="text-5xl sm:text-7xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          astra.launch
        </motion.h1>
        <motion.p
          className="text-2xl sm:text-3xl font-light mb-8 text-muted-foreground max-w-2xl"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Effortless blockchain validators for everyone
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Button asChild size="lg" className="text-lg px-8 py-6">
            <Link to="/dashboard">Start Now</Link>
          </Button>
        </motion.div>
        <motion.p
          className="text-sm text-muted-foreground mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          No technical expertise required. Get set up in minutes.
        </motion.p>
      </section>
    </div>
  );
};

export const Route = createFileRoute("/")({
  component: HomeComponent,
});
