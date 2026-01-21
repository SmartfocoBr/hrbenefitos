import { motion, Transition, Variants } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
  },
};

const pageTransition: Transition = {
  type: "tween",
  ease: [0.4, 0, 0.2, 1],
  duration: 0.3,
};

export const PageTransition = ({ children, className = "" }: PageTransitionProps) => {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Fade-only transition for simpler pages
export const FadeTransition = ({ children, className = "" }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Slide-in transition for sidebars and panels
export const SlideTransition = ({ children, className = "" }: PageTransitionProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
