import React from 'react';
import { useTranslation } from 'react-i18next';

export interface TextProps {
  id: string;
  fallback: string;
  className?: string;
  htmlFor?: string;
  values?: Record<string, any>;
  children?: React.ReactNode;
}

export const Text: React.FC<TextProps> = ({
  id,
  fallback,
  className = '',
  htmlFor,
  values,
  children,
}) => {
  const { t } = useTranslation();
  const content = t(id, { fallback, ...values });

  if (htmlFor) {
    return (
      <label className={className} htmlFor={htmlFor}>
        {content}
        {children}
      </label>
    );
  }

  return (
    <span className={className}>
      {content}
      {children}
    </span>
  );
};

export default Text;