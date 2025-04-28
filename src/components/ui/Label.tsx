import React from "react";
import { useTranslation } from "react-i18next";

export interface LabelProps {
  id: string;
  fallback: string;
  className?: string;
  htmlFor: string;
  children?: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({
  id,
  fallback,
  className = "",
  htmlFor,
  children,
}) => {
  const { t } = useTranslation();
  const content = t(id, { fallback });

  return (
    <label className={className} htmlFor={htmlFor}>
      {content}
      {children}
    </label>
  );
};

export default Label;
