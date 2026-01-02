import React from 'react';

export const Header = () => {
  return (
    <header className="flex items-center justify-between p-4 bg-gradeloop-light border-b border-gradeloop-border-light">
      <div className="flex items-center space-x-4">
        <div className="w-8 h-8 bg-gradeloop-primary rounded-full"></div>
        <h1 className="text-xl font-bold text-gradeloop-text-dark">gradeloop</h1>
      </div>
    </header>
  );
};
