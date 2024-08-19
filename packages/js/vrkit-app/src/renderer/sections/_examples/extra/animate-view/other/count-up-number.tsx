import { AnimateCountUp } from 'vrkit-app-renderer/components/animate';

// ----------------------------------------------------------------------

export function AnimateCountUpNumber() {
  return (
    <>
      <AnimateCountUp component="h6" variant="h1" to={500} unit="+" />

      <AnimateCountUp component="h6" variant="h1" from={200} to={500.14} toFixed={2} unit="k" />
    </>
  );
}
