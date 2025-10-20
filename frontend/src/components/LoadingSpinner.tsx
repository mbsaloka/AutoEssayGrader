import React from "react";
import { CircleNotch } from "phosphor-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "blue" | "white" | "gray";
  text?: string;
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  color = "blue",
  text,
  fullScreen = false,
}) => {
  const sizeStyles = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  const colorStyles = {
    blue: "text-blue-600 dark:text-yellow-400",
    white: "text-white",
    gray: "text-gray-600 dark:text-gray-400",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <CircleNotch
        className={`${sizeStyles[size]} ${colorStyles[color]} animate-spin`}
        weight="bold"
      />
      {text && (
        <p className={`text-sm font-medium ${colorStyles[color]}`}>{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 bg-opacity-90 dark:bg-opacity-90 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
