import React, { useState, useRef } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

const SpringComputer = ({ computer }) => {
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef(null);

  // Spring physics configuration - slightly reduced stiffness for smoother motion
  const springConfig = {
    stiffness: 100, // Reduced from 150
    damping: 20, // Increased from 15 for more damping
    mass: 0.8, // Increased from 0.5 for less responsive motion
  };

  // Create spring values for mouse position
  const mouseX = useSpring(0, springConfig);
  const mouseY = useSpring(0, springConfig);

  // Transform mouse position to rotation values - REDUCED TO HALF
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [5, -5]); // Reduced from [10, -10]
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-5, 5]); // Reduced from [-10, 10]

  const handleMouseMove = (event) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normalize mouse position relative to center (-0.5 to 0.5)
    // REDUCED sensitivity by multiplying by 0.5
    const normalizedX = ((event.clientX - centerX) / rect.width) * 0.5;
    const normalizedY = ((event.clientY - centerY) / rect.height) * 0.5;

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
            scale: isHovered ? 1.005 : 1, // Further reduced from 1.01
            z: isHovered ? 25 : 0, // Reduced from 50
          }}
          transition={{
            scale: {
              type: "spring",
              stiffness: 150, // Reduced from 200
              damping: 25, // Increased from 20
              mass: 1.0, // Increased from 0.8
            },
          }}
          whileTap={{
            scale: 0.98, // Reduced from 0.95
            transition: {
              type: "spring",
              stiffness: 300, // Reduced from 400
              damping: 15, // Increased from 10
            },
          }}
        />

        {/* Optional: Add a subtle shadow that responds to tilt - REDUCED motion */}
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
            opacity: isHovered ? 0.3 : 0.15, // Further reduced from 0.4 : 0.2
            scale: isHovered ? 0.97 : 0.93, // Further reduced from 0.96 : 0.92
          }}
          transition={{
            type: "spring",
            stiffness: 150, // Reduced from 200
            damping: 25, // Increased from 20
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

  // Spring animation with damping - REDUCED motion
  const [{ xys }, api] = useReactSpring(() => ({
    xys: [0, 0, 1],
    config: {
      mass: 8, // Increased from 5 for slower motion
      tension: 250, // Reduced from 350
      friction: 60, // Increased from 40 for more damping
    },
  }));

  const handleMouseMove = (event) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    api.start({
      xys: [
        -(y - 0.5) * 10, // REDUCED from 20 to 10 (rotateX)
        (x - 0.5) * 10, // REDUCED from 20 to 10 (rotateY)
        1.005, // Further reduced from 1.025 (scale)
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
