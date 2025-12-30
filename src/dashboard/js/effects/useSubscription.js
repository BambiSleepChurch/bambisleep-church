/**
 * BambiSleep™ Church MCP Control Tower
 * useSubscription Effect - State subscription manager
 */

import { AppState } from '../state/store.js';

/**
 * Subscribe to state changes with automatic rendering
 * @param {Function} selector - State selector function
 * @param {Function} handler - Handler called with (newValue, oldValue)
 * @returns {Function} Unsubscribe function
 */
export function useSubscription(selector, handler) {
  let prevValue = selector(AppState.getState());
  
  const unsubscribe = AppState.subscribe((state, prevState) => {
    const newValue = selector(state);
    const oldValue = selector(prevState);
    
    // Only call handler if value changed (shallow compare)
    if (newValue !== oldValue) {
      handler(newValue, oldValue);
      prevValue = newValue;
    }
  });
  
  return unsubscribe;
}

/**
 * Subscribe to multiple selectors
 * @param {Array<{selector: Function, handler: Function}>} subscriptions
 * @returns {Function} Unsubscribe all function
 */
export function useMultiSubscription(subscriptions) {
  const unsubscribers = subscriptions.map(({ selector, handler }) => 
    useSubscription(selector, handler)
  );
  
  return () => unsubscribers.forEach(unsub => unsub());
}

/**
 * One-time subscription that auto-unsubscribes after first call
 * @param {Function} selector - State selector function
 * @param {Function} handler - Handler called once
 */
export function useOnce(selector, handler) {
  const unsubscribe = useSubscription(selector, (newValue, oldValue) => {
    handler(newValue, oldValue);
    unsubscribe();
  });
  
  return unsubscribe;
}
