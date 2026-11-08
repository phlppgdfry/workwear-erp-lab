"use client";
export default function Error({ reset }: { reset: () => void }) {
  return <main><h1>The exception queue is unavailable.</h1><p>Check the Business Central connection and company configuration, then try again.</p><button onClick={reset}>Try again</button></main>;
}
