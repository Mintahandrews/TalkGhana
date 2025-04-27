import React, { ReactNode } from "react";
import { useLanguage } from "../context/LanguageContext";

interface TextProps {
  id: string; // Translation key
  fallback?: string; // Fallback text if translation is missing
  values?: Record<string, string | number>; // Values for interpolation
  className?: string; // Optional classname for styling
  as?: keyof JSX.IntrinsicElements; // HTML element to render as
  children?: ReactNode; // Children nodes (used as fallback if provided)
  emergency?: boolean; // Flag for emergency/important text
  highlight?: boolean; // Flag for highlighted text
}

/**
 * Text component that handles translations
 * Use this component for any text that should be translated
 */
const Text: React.FC<TextProps> = ({
  id,
  fallback,
  values = {},
  className = "",
  as: Component = "span",
  children,
  emergency = false,
  highlight = false,
}) => {
  const { t, currentLanguage } = useLanguage();

  // Get translated text
  let content = t(id, values);

  // If translation not found, use fallback or children or key
  if (content === id) {
    content = fallback || (children ? String(children) : id);
  }

  // Build class name
  const classNames = [
    className,
    "language-transition",
    emergency ? "emergency-text" : "",
    highlight ? "highlight-text" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component
      className={classNames}
      data-translation-key={id}
      lang={currentLanguage === "english" ? "en" : currentLanguage}
    >
      {content}
    </Component>
  );
};

// Specialized Text components for common use cases
export const Heading = (props: Omit<TextProps, "as">) => (
  <Text {...props} as="h2" />
);

export const Paragraph = (props: Omit<TextProps, "as">) => (
  <Text {...props} as="p" />
);

export const Label = (props: Omit<TextProps, "as">) => (
  <Text {...props} as="label" />
);

export const Button = (props: Omit<TextProps, "as">) => (
  <Text {...props} as="button" />
);

export default Text;
