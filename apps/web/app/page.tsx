'use client';

import { motion } from "motion/react";
import { Shield, BookOpen, GraduationCap, Building2 } from "lucide-react";
import Link from "next/link";

const portals = [
  {
    title: "System Admin",
    description: "Manage system-wide settings and configurations.",
    href: "/system-admin",
    icon: Shield,
    color: "from-zinc-500/10 to-zinc-500/5",
    border: "group-hover:border-primary/50",
    text: "group-hover:text-primary",
  },
  {
    title: "Institute Admin",
    description: "Oversee institute operations and staff management.",
    href: "/institute-admin",
    icon: Building2,
    color: "from-zinc-500/10 to-zinc-500/5",
    border: "group-hover:border-primary/50",
    text: "group-hover:text-primary",
  },
  {
    title: "Instructor",
    description: "Manage courses, assignments, and student grades.",
    href: "/instructor",
    icon: BookOpen,
    color: "from-zinc-500/10 to-zinc-500/5",
    border: "group-hover:border-primary/50",
    text: "group-hover:text-primary",
  },
  {
    title: "Student",
    description: "Access course materials and track your progress.",
    href: "/student",
    icon: GraduationCap,
    color: "from-zinc-500/10 to-zinc-500/5",
    border: "group-hover:border-primary/50",
    text: "group-hover:text-primary",
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-4 font-sans dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl"
          >
            Welcome to <span className="text-primary">Gradeloop</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-lg text-zinc-600 dark:text-zinc-400"
          >
            Select your portal to get started
          </motion.p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-6 sm:grid-cols-2"
        >
          {portals.map((portal) => (
            <Link key={portal.title} href={portal.href} className="group block">
              <motion.div
                variants={item}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative overflow-hidden border border-zinc-200 bg-white p-8 transition-all dark:border-zinc-800 dark:bg-zinc-900/50 ${portal.border}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${portal.color}`} />

                <div className="relative z-10 flex flex-col gap-4">
                  <div className={`w-fit bg-zinc-100 p-3 transition-colors dark:bg-zinc-800 ${portal.text}`}>
                    <portal.icon className="h-6 w-6" />
                  </div>

                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                      {portal.title}
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {portal.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
