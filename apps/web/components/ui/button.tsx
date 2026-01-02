import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

const Button: React.FC<ButtonProps> = ({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none';

  const variantClasses = {
    primary: 'bg-gradeloop-primary text-gradeloop-light hover:opacity-90',
    secondary: 'bg-gradeloop-secondary text-gradeloop-dark hover:opacity-90',
    destructive: 'bg-feedback-error text-gradeloop-light hover:opacity-90',
    outline: 'border border-gradeloop-primary text-gradeloop-primary hover:bg-gradeloop-primary hover:text-gradeloop-light',
    ghost: 'hover:bg-gradeloop-light/50',
    link: 'text-gradeloop-primary underline-offset-4 hover:underline',
  };

  const sizeClasses = {
    sm: 'h-8 px-3',
    md: 'h-9 px-4 py-2',
    lg: 'h-10 px-6',
    icon: 'size-9',
  };

  const finalClassName = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button className={finalClassName} {...props} />;
};

export { Button };
