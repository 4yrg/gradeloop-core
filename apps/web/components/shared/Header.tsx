import React from 'react';

export const Header = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        <h1 className="text-xl font-bold">gradeloop</h1>
      </div>
    </header>
  );
};
