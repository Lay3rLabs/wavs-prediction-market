import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevation?: 1 | 2;
  interactive?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = "",
  elevation = 2,
  interactive = false,
}) => {
  const baseClasses = elevation === 1 ? "card-elevation-1" : "card-elevation-2";
  const interactiveClasses = interactive ? "interactive-hover" : "";

  return (
    <div className={`${baseClasses} ${interactiveClasses} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
