import React, { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  onClick?: () => void;
}
const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = "md",
  hover = false,
  onClick,
}) => {
  const paddingStyles = {
    none: "",
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
  };
  const hoverStyle = hover
    ? "hover:shadow-lg transition-shadow duration-200 cursor-pointer"
    : "";
  const clickableStyle = onClick ? "cursor-pointer" : "";
  return (
    <div
      className={`
        bg-transparent rounded-lg shadow-md border border-gray-700
        ${paddingStyles[padding]}
        ${hoverStyle}
        ${clickableStyle}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
