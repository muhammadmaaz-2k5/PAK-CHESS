interface LoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export const Loader = ({
  message = 'Loading Chess...',
  fullScreen = true,
}: LoaderProps) => {
  return (
    <div
      className={`loader ${
        fullScreen ? 'fixed inset-0 z-50' : 'w-full py-16'
      } flex flex-col items-center justify-center bg-bgMain`}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="loader__main">
          <div className="loader__dot"></div>
          <div className="loader__dot"></div>
          <div className="loader__dot"></div>
        </div>
        {message && (
          <p className="text-sm font-semibold text-textSecondary tracking-wide animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Loader;
