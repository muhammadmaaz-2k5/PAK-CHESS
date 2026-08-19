import React from 'react';
import Sidebar from '../components/sidebar';
import Navbar from '../components/Navbar';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-bgMain text-textMain">
      <Navbar />
      <Sidebar />
      <main className="flex-1 pt-20 md:pt-6 pb-12 px-4 md:px-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};
