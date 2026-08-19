import React from 'react';

export const Button = ({
  onClick,
  children,
  className = '',
}: {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <button
      onClick={onClick}
      className={`px-8 py-3.5 text-xl bg-green-600 hover:bg-green-500 active:scale-[0.98] transition-all text-white font-bold rounded-lg shadow-lg hover:shadow-green-600/30 ${className}`}
    >
      {children}
    </button>
  );
};
