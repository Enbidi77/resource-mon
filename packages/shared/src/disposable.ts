/**
 * TypeScript Explicit Resource Management (Disposable) Utilities
 * Provides standardized wrappers, guards, and subscription adapters
 * conforming to ECMAScript Explicit Resource Management (Symbol.dispose / Symbol.asyncDispose).
 */

/**
 * Combined callable function and Disposable interface.
 * Allows consumers to unsubscribe either via direct invocation `unsub()`
 * or via standard TypeScript `using unsub = ...` declarations.
 */
export type SubscriptionDisposable = (() => void) & Disposable;

/**
 * Creates an idempotent synchronous Disposable from a cleanup function.
 * Guaranteed to execute the cleanup callback at most once.
 */
export function toDisposable(cleanup: () => void): Disposable {
  let isDisposed = false;
  return {
    [Symbol.dispose](): void {
      if (isDisposed) return;
      isDisposed = true;
      cleanup();
    },
  };
}

/**
 * Creates an idempotent asynchronous AsyncDisposable from an async cleanup function.
 * Guaranteed to execute the cleanup callback at most once.
 */
export function toAsyncDisposable(
  cleanup: () => PromiseLike<void> | void,
): AsyncDisposable {
  let isDisposed = false;
  let disposePromise: Promise<void> | null = null;

  return {
    async [Symbol.asyncDispose](): Promise<void> {
      if (isDisposed) {
        if (disposePromise) await disposePromise;
        return;
      }
      isDisposed = true;
      disposePromise = Promise.resolve(cleanup());
      await disposePromise;
    },
  };
}

/**
 * Creates a hybrid subscription object that is both directly callable:
 * `const unsubscribe = observable.subscribe(...); unsubscribe();`
 * and conforms to the Disposable protocol:
 * `using subscription = observable.subscribe(...);`
 */
export function createSubscriptionDisposable(
  cleanup: () => void,
): SubscriptionDisposable {
  let isDisposed = false;

  const performCleanup = () => {
    if (isDisposed) return;
    isDisposed = true;
    cleanup();
  };

  const fn = (() => {
    performCleanup();
  }) as SubscriptionDisposable;

  fn[Symbol.dispose] = performCleanup;

  return fn;
}

/**
 * Type guard checking if an object implements synchronous Disposable.
 */
export function isDisposable(obj: unknown): obj is Disposable {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as any)[Symbol.dispose] === "function"
  );
}

/**
 * Type guard checking if an object implements asynchronous AsyncDisposable.
 */
export function isAsyncDisposable(obj: unknown): obj is AsyncDisposable {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as any)[Symbol.asyncDispose] === "function"
  );
}

/**
 * Safely disposes a resource synchronously, trying Symbol.dispose, dispose(), close(), or destroy().
 * Never throws an unhandled exception.
 */
export function disposeSafely(
  resource: unknown,
  onError?: (err: unknown) => void,
): void {
  if (
    !resource ||
    (typeof resource !== "object" && typeof resource !== "function")
  ) {
    return;
  }

  try {
    const res = resource as any;
    if (typeof res[Symbol.dispose] === "function") {
      res[Symbol.dispose]();
    } else if (typeof res.dispose === "function") {
      res.dispose();
    } else if (typeof res.close === "function") {
      res.close();
    } else if (typeof res.destroy === "function") {
      res.destroy();
    }
  } catch (err) {
    if (onError) {
      onError(err);
    }
  }
}

/**
 * Safely disposes a resource asynchronously, prioritizing Symbol.asyncDispose,
 * followed by Symbol.dispose, dispose(), close(), or destroy().
 * Never throws an unhandled exception.
 */
export async function disposeSafelyAsync(
  resource: unknown,
  onError?: (err: unknown) => void,
): Promise<void> {
  if (
    !resource ||
    (typeof resource !== "object" && typeof resource !== "function")
  ) {
    return;
  }

  try {
    const res = resource as any;
    if (typeof res[Symbol.asyncDispose] === "function") {
      await res[Symbol.asyncDispose]();
    } else if (typeof res[Symbol.dispose] === "function") {
      res[Symbol.dispose]();
    } else if (typeof res.dispose === "function") {
      const ret = res.dispose();
      if (ret && typeof ret.then === "function") await ret;
    } else if (typeof res.close === "function") {
      const ret = res.close();
      if (ret && typeof ret.then === "function") await ret;
    } else if (typeof res.destroy === "function") {
      const ret = res.destroy();
      if (ret && typeof ret.then === "function") await ret;
    }
  } catch (err) {
    if (onError) {
      onError(err);
    }
  }
}
