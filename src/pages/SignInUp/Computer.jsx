import React, { useState, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

const SpringComputer = ({ computer }) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);

  // Spring physics configuration
  const springConfig = {
    stiffness: 150,
    damping: 15,
    mass: 0.5,
  };

  // Create spring values for mouse position
  const mouseX = useSpring(0, springConfig);
  const mouseY = useSpring(0, springConfig);

  // Transform mouse position to rotation values
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-10, 10]);

  const handleMouseMove = (event) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normalize mouse position relative to center (-0.5 to 0.5)
    const normalizedX = (event.clientX - centerX) / rect.width;
    const normalizedY = (event.clientY - centerY) / rect.height;

    mouseX.set(normalizedX);
    mouseY.set(normalizedY);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="md:w-1/2 lg:w-1/2 mb-12 md:mb-6">
      <motion.div
        ref={ref}
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: 1000,
          transformStyle: "preserve-3d",
        }}
      >
        <motion.img
          className="rounded-xl w-full md:max-w-[700px] cursor-pointer"
          src={computer}
          alt="Computer illustration"
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          animate={{
            scale: isHovered ? 1.02 : 1,
            z: isHovered ? 50 : 0,
          }}
          transition={{
            scale: {
              type: "spring",
              stiffness: 200,
              damping: 20,
              mass: 0.8,
            },
          }}
          whileTap={{
            scale: 0.95,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 10,
            },
          }}
        />

        {/* Optional: Add a subtle shadow that responds to tilt */}
        <motion.div
          className="absolute inset-0 -z-10 rounded-xl"
          style={{
            background:
              "radial-gradient(circle at center, rgba(0,0,0,0.2) 0%, transparent 70%)",
            filter: "blur(20px)",
            transform: "translateY(20px) scale(0.9)",
            rotateX,
            rotateY,
          }}
          animate={{
            opacity: isHovered ? 0.6 : 0.3,
            scale: isHovered ? 0.95 : 0.9,
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
          }}
        />
      </motion.div>
    </div>
  );
};

// Alternative version using react-spring (if you prefer react-spring over framer-motion)
import { useSpring as useReactSpring, animated } from "react-spring";

const SpringComputerReactSpring = ({ computer }) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);

  // Spring animation with damping
  const [{ xys }, api] = useReactSpring(() => ({
    xys: [0, 0, 1],
    config: {
      mass: 5,
      tension: 350,
      friction: 40, // This creates the damping effect
    },
  }));

  const handleMouseMove = (event) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    api.start({
      xys: [
        -(y - 0.5) * 20, // rotateX
        (x - 0.5) * 20, // rotateY
        1.05, // scale
      ],
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    api.start({
      xys: [0, 0, 1],
    });
  };

  return (
    <div className="md:w-1/2 lg:w-1/2 mb-12 md:mb-6">
      <animated.div
        ref={ref}
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: xys.to(
            (x, y, s) =>
              `perspective(1000px) rotateX(${x}deg) rotateY(${y}deg) scale(${s})`
          ),
          transformStyle: "preserve-3d",
        }}
      >
        <img
          className="rounded-xl w-full md:max-w-[700px] cursor-pointer"
          src={computer}
          alt="Computer illustration"
        />
      </animated.div>
    </div>
  );
};

// Export the component you prefer
export default SpringComputer;

// Usage example:
// <SpringComputer computer={yourComputerImage} />
// or
// <SpringComputerReactSpring computer={yourComputerImage} />
