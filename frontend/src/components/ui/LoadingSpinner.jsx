const sizes = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-[3px]',
};

export default function LoadingSpinner({ size = 'md', className = '', fullPage = false }) {
  const spinner = (
    <div
      className={`rounded-full border-gray-700 border-t-orange-500 animate-spin ${sizes[size]} ${className}`}
    />
  );

  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        {spinner}
        <span className="text-gray-500 text-sm">Loading…</span>
      </div>
    );
  }

  return spinner;
}
