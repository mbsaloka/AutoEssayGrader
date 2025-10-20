import React, { ButtonHTMLAttributes } from "react";
import { CircleNotch } from "phosphor-react";

export type ButtonVariant = "primary" | "secondary" | "outline" | "danger";
export type ButtonSize = "sm" | "md" | "lg";
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}
const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  fullWidth = false,
  disabled,
  className = "",
  children,
  ...props
}) => {
  const baseStyles =
    "font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center";
  const variantStyles = {
    primary:
      "bg-yellow-400 dark:bg-yellow-500 text-black dark:text-black hover:bg-yellow-500 dark:hover:bg-yellow-600 focus:ring-yellow-500 shadow-md hover:shadow-lg",
    secondary:
      "bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 focus:ring-gray-500",
    outline:
      "border-2 border-gray-600 dark:border-gray-500 text-gray-900 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-500 bg-transparent",
    danger:
      "bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-500 focus:ring-red-500",
  };
  const sizeStyles = {
    sm: "px-6 py-2 text-sm",
    md: "px-8 py-2.5 text-base",
    lg: "px-10 py-3 text-lg",
  };
  const widthStyle = fullWidth ? "w-full" : "";
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <CircleNotch
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
            weight="bold"
          />
          Memuat...
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
