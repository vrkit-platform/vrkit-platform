import { domMax, LazyMotion } from 'framer-motion';
import React from "react"

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export function MotionLazy({ children }: Props) {
  return (
    <LazyMotion strict features={domMax}>
      {children}
    </LazyMotion>
  );
}
