# Animation System Documentation

This document explains the animations used in the landing page and how to use them in other parts of the application.

## Animation Components

### `MotionSection`

This component provides a simple way to animate sections as they come into view during scrolling.

```tsx
import { MotionSection } from "@/components/magicui/motion-section";

// Basic usage
<MotionSection>
  <p>This content will fade in when scrolled into view</p>
</MotionSection>

// With customization
<MotionSection 
  delay={0.3}           // Delay animation start by 0.3s
  duration={0.8}        // Animation plays over 0.8s
  type="slide"          // Use slide animation (options: "fade", "slide", "scale", "none")
  yOffset={50}          // When sliding, start 50px offset
  opacity={[0, 1]}      // Fade from 0 to 1 opacity
  once={true}           // Only animate once (true) or every time in view (false)
>
  <p>Customized animation</p>
</MotionSection>
```

### `MotionStagger`

This component staggers the animations of its children, creating a sequential animation effect.

```tsx
import { MotionStagger } from "@/components/magicui/motion-section";

<MotionStagger 
  staggerChildren={0.1}  // Delay between each child animation
  delay={0.2}            // Initial delay before the first animation
  duration={0.5}         // Duration of each child animation
  type="slide"           // Animation type for children
>
  <div>First item</div>
  <div>Second item</div>
  <div>Third item</div>
</MotionStagger>
```

## Direct Framer Motion Usage

For more complex animations, we use Framer Motion directly:

```tsx
import { motion } from "framer-motion";

// Simple hover animation
<motion.div
  whileHover={{ scale: 1.05 }}
  transition={{ duration: 0.2 }}
>
  Hover me
</motion.div>

// Animation sequence
<motion.div
  animate={{
    y: [0, -10, 0],
    opacity: [1, 0.8, 1] 
  }}
  transition={{
    repeat: Infinity,
    duration: 3,
    ease: "easeInOut"
  }}
>
  Floating element
</motion.div>
```

## Animation Principles Used

1. **Scroll-triggered animations**: Elements animate as they enter the viewport
2. **Subtle effects**: Animations are gentle and enhance rather than distract
3. **Staggered timing**: Related elements animate sequentially
4. **Consistent timing**: 300-500ms durations with ease-out curves
5. **Purposeful motion**: Animations direct attention to important content

## Performance Considerations

- We use `LazyMotion` from Framer Motion to defer loading animation code
- Animations are optimized for 60fps performance
- Most animations only happen once per element
- Heavy animations avoid properties that trigger layout (prefer transform/opacity)

## Adding New Animations

When adding new animations:

1. Use the existing components when possible
2. Maintain subtle, consistent timing (300-500ms)
3. Use the same easing curve for cohesion
4. Consider both desktop and mobile experiences
5. Test performance with the dev tools 