"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, MessageCircle, PenTool, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";

const MotionLink = motion(Link);

import { HeroHighlight, Highlight } from "@/components/ui/hero-highlight";
import SiteHeader from "@/components/SiteHeader";

export function HeroHighlightDemo() {
  return (
    <HeroHighlight>
      <motion.h1
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: [20, -5, 0],
        }}
        transition={{
          duration: 0.5,
          ease: [0.4, 0.0, 0.2, 1],
        }}
        className="text-2xl px-4 md:text-4xl lg:text-5xl font-bold text-neutral-700 dark:text-white max-w-4xl leading-relaxed lg:leading-snug text-center mx-auto "
      >
        With insomnia, nothing&apos;s real. Everything is far away. Everything
        is a{" "}
        <Highlight className="text-black dark:text-white">
          copy, of a copy, of a copy.
        </Highlight>
      </motion.h1>
    </HeroHighlight>
  );
}

export default function Component() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const scrollRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end start"],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  };

  return (
    <div
      className={
        "flex flex-col min-h-screen dark:bg-background dark:text-white bg-white text-black"
      }
      ref={scrollRef}
    >
      <SiteHeader />
      <main className="flex-1">
        <HeroHighlightDemo />
        <section className="relative w-full py-24 md:py-32 lg:py-48 overflow-hidden">
          <motion.div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: "url('/placeholder.svg?height=1080&width=1920')",
              backgroundPosition: "center",
              backgroundSize: "cover",
              y: backgroundY,
            }}
          />
          <div
            className={
              "absolute inset-0 dark:bg-background bg-white bg-opacity-75 z-10"
            }
          ></div>
          <motion.div
            className="container px-4 md:px-6 relative z-20"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter mb-4"
              variants={itemVariants}
            >
              Welcome to DebateMUN Society
            </motion.h1>
            <motion.p
              className="max-w-[600px] text-lg md:text-xl mb-8"
              variants={itemVariants}
            >
              Engage in thought-provoking debates, share your ideas, and test
              your knowledge.
            </motion.p>
            <motion.div className="space-x-4" variants={itemVariants}>
              <Button className="bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                Join Now
              </Button>
              <Button
                variant="outline"
                className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors"
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </section>

        <section className={`w-full py-24 dark:bg-background bg-gray-100`}>
          <motion.div
            className="container relative px-4 md:px-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold tracking-tighter text-center mb-12"
              variants={itemVariants}
            >
              Our Features
            </motion.h2>
            <motion.div
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
            >
              {[
                {
                  title: "Debating",
                  icon: MessageCircle,
                  description:
                    "Participate in exciting debates on various topics.",
                },
                {
                  title: "Blogging Platform",
                  icon: PenTool,
                  description:
                    "Share your thoughts and ideas with our community.",
                },
                {
                  title: "Quizzes",
                  icon: BookOpen,
                  description: "Test your knowledge on various subjects.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card
                    className={`dark:bg-background dark:border-gray-700
                        bg-white border-gray-200 hover:border-blue-500 transition-colors duration-300`}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center text-xl  dark:text-gray-400 text-gray-600 font-semibold">
                        <feature.icon className="w-6 h-6 mr-2 text-blue-400" />
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription
                        className={`dark:text-gray-400 text-gray-600`}
                      >
                        {feature.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        <section className={`w-full py-24 dark:bg-background bg-white`}>
          <motion.div
            className="container px-4 md:px-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold tracking-tighter text-center mb-12"
              variants={itemVariants}
            >
              About Us
            </motion.h2>
            <motion.div className="max-w-3xl mx-auto text-center">
              <p className={`dark:text-gray-300 text-gray-600 mb-4`}>
                DelTech MUN and Debating society, the oldest debating society in
                DTU, is a collection of discussing enthusiasts spread out across
                both verticals of the University, the Main Campus, and the
                University School of Management & Entrepreneurship (East
                Campus).
              </p>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{
                  opacity: isAboutExpanded ? 1 : 0,
                  height: isAboutExpanded ? "auto" : 0,
                }}
                transition={{ duration: 0.5 }}
              >
                <p className={`dark:text-gray-300 text-gray-600 mb-4`}>
                  The society organizes an array of events over the year, the
                  main event being the DelTech Model United Nations Conference,
                  which is one of the most eminent conferences in the Delhi
                  circuit. Other events include weekly charchas, &apos;Youth ki
                  Awaaz, &apos; mock MUNs, group discussions, and intra-MUN.
                </p>
              </motion.div>
              <Button
                variant="ghost"
                className={`mt-4 flex items-center justify-center mx-auto dark:text-blue-400 dark:hover:text-blue-300 text-blue-600 hover:text-blue-500`}
                onClick={() => setIsAboutExpanded(!isAboutExpanded)}
              >
                <motion.div
                  className=""
                  animate={{ rotate: isAboutExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="h-4 w-4" />
                </motion.div>
              </Button>
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
