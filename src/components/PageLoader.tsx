export default function PageLoader() {
  return (
    <div role="status" className="pointer-events-none fixed inset-0 z-40 grid place-items-center">
      <span className="sr-only">Loading</span>
      <div aria-hidden="true" className="grid grid-cols-2 gap-1 rounded-md border border-black/15 bg-white p-2">
        {[0, 1, 3, 2].map(step => (
          <span key={step} className="h-2 w-2 rounded-[1px] bg-brand motion-safe:animate-pulse"
            style={{ animationDelay: `-${step * 180}ms`, animationDuration: "1s" }} />
        ))}
      </div>
    </div>
  );
}
