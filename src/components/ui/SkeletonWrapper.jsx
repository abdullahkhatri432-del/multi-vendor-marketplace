export default function SkeletonWrapper({ isLoading, skeleton, children }) {
  return (
    <div className="relative">
      {isLoading ? (
        <div className="animate-fade-in" aria-busy="true" aria-live="polite">
          {skeleton}
        </div>
      ) : (
        <div className="animate-fade-in">{children}</div>
      )}
    </div>
  );
}
