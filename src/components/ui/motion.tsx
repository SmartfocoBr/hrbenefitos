import { motion, HTMLMotionProps } from "framer-motion";
import { forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Motion Card with hover and tap effects
interface MotionCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  hoverScale?: number;
  tapScale?: number;
  hoverY?: number;
  glowOnHover?: boolean;
}

export const MotionCard = forwardRef<HTMLDivElement, MotionCardProps>(
  (
    {
      children,
      className,
      hoverScale = 1.02,
      tapScale = 0.98,
      hoverY = -4,
      glowOnHover = false,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        whileHover={{
          scale: hoverScale,
          y: hoverY,
          transition: { type: "spring", stiffness: 400, damping: 25 },
        }}
        whileTap={{
          scale: tapScale,
          transition: { type: "spring", stiffness: 400, damping: 25 },
        }}
        className={cn(
          "transition-shadow duration-300",
          glowOnHover && "hover:shadow-lg hover:shadow-accent/20",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
MotionCard.displayName = "MotionCard";

// Motion Button with ripple-like press effect
interface MotionButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  className?: string;
  variant?: "default" | "subtle" | "bounce";
}

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ children, className, variant = "default", ...props }, ref) => {
    const variants = {
      default: {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
      },
      subtle: {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 },
      },
      bounce: {
        whileHover: { scale: 1.1, y: -2 },
        whileTap: { scale: 0.9 },
      },
    };

    return (
      <motion.button
        ref={ref}
        whileHover={variants[variant].whileHover}
        whileTap={variants[variant].whileTap}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className={className}
        {...props}
      >
        {children}
      </motion.button>
    );
  }
);
MotionButton.displayName = "MotionButton";

// Staggered container for animating children in sequence
interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const StaggerContainer = ({
  children,
  className,
  staggerDelay = 0.1,
}: StaggerContainerProps) => {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Stagger item to be used inside StaggerContainer
interface StaggerItemProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
}

export const StaggerItem = ({ children, className, ...props }: StaggerItemProps) => {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 300, damping: 24 },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Hover reveal for showing additional content on hover
interface HoverRevealProps {
  children: ReactNode;
  revealContent: ReactNode;
  className?: string;
}

export const HoverReveal = ({ children, revealContent, className }: HoverRevealProps) => {
  return (
    <motion.div className={cn("relative overflow-hidden", className)} whileHover="hover">
      {children}
      <motion.div
        className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        variants={{
          hover: { opacity: 1 },
        }}
        transition={{ duration: 0.2 }}
      >
        {revealContent}
      </motion.div>
    </motion.div>
  );
};

// Pulse animation for notifications or highlights
interface PulseProps {
  children: ReactNode;
  className?: string;
  color?: string;
}

export const Pulse = ({ children, className, color = "accent" }: PulseProps) => {
  return (
    <motion.div
      className={cn("relative", className)}
      animate={{
        boxShadow: [
          `0 0 0 0 hsl(var(--${color}) / 0.4)`,
          `0 0 0 10px hsl(var(--${color}) / 0)`,
        ],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
};

// Icon with rotation on hover
interface RotateIconProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  degrees?: number;
}

export const RotateIcon = ({ children, className, degrees = 180, ...props }: RotateIconProps) => {
  return (
    <motion.div
      whileHover={{ rotate: degrees }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
};

// Float animation for decorative elements
interface FloatProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  distance?: number;
}

export const Float = ({ children, className, duration = 3, distance = 10 }: FloatProps) => {
  return (
    <motion.div
      animate={{
        y: [-distance / 2, distance / 2, -distance / 2],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
