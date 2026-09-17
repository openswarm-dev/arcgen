'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { cn } from '@/lib/utils';

export function AnimatedListItem({ children }) {
  const animations = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 350, damping: 40 },
  };

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  );
}

export const AnimatedList = React.memo(
  ({ children, className, delay = 1000, loop = false, maxVisible = 5, ...props }) => {
    const childrenArray = useMemo(() => React.Children.toArray(children), [children]);
    const [index, setIndex] = useState(0);
    const counterRef = useRef(0);
    const [loopItems, setLoopItems] = useState([]);

    useEffect(() => {
      if (!loop || childrenArray.length === 0) {
        return;
      }

      if (loopItems.length === 0) {
        setLoopItems([{ child: childrenArray[0], id: 0 }]);
        return;
      }

      const timeout = setTimeout(() => {
        counterRef.current += 1;
        const sourceIndex = counterRef.current % childrenArray.length;

        setLoopItems((prev) => {
          const next = [{ child: childrenArray[sourceIndex], id: counterRef.current }, ...prev];
          return next.slice(0, maxVisible);
        });
      }, delay);

      return () => clearTimeout(timeout);
    }, [loop, loopItems, delay, childrenArray, maxVisible]);

    useEffect(() => {
      if (loop || childrenArray.length === 0) {
        return;
      }

      let timeout = null;

      if (index < childrenArray.length - 1) {
        timeout = setTimeout(() => {
          setIndex((prevIndex) => prevIndex + 1);
        }, delay);
      }

      return () => {
        if (timeout !== null) {
          clearTimeout(timeout);
        }
      };
    }, [index, delay, childrenArray.length, loop]);

    const itemsToShow = useMemo(() => {
      if (loop) {
        return loopItems;
      }

      return childrenArray.slice(0, index + 1).reverse().map((child, itemIndex) => ({
        child,
        id: itemIndex,
      }));
    }, [loop, loopItems, index, childrenArray]);

    return (
      <div className={cn('flex flex-col items-center gap-4', className)} {...props}>
        <AnimatePresence>
          {itemsToShow.map((item) => (
            <AnimatedListItem key={item.id}>{item.child}</AnimatedListItem>
          ))}
        </AnimatePresence>
      </div>
    );
  }
);

AnimatedList.displayName = 'AnimatedList';
