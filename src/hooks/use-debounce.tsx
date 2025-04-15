import { useState, useEffect } from 'react';

// Define the type for the value being debounced. This makes the hook generic
// so it can be used with any type of value, not just strings.
type ValueType<T> = T;

function useDebounce<T>(value: ValueType<T>, delay: number): ValueType<T> {
  // State and setters for debounced value
  const [debouncedValue, setDebouncedValue] = useState<ValueType<T>>(value);

  useEffect(
    () => {
      // Update debounced value after delay
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Cancel the timeout if value changes (also on delay change or unmount)
      // This is how we prevent debounced value from updating if value is changed ...
      // .. before the delay is over.
      return () => {
        clearTimeout(handler);
      };
    },
    [value, delay] // Only re-call effect if value or delay changes
  );

  return debouncedValue;
}

export { useDebounce };
