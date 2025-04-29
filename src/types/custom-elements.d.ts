/**
 * Custom elements declaration file for TalkGhana
 * This file adds type definitions for our custom web components
 */

import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'localized-text': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          'data-i18n'?: string;
          'data-format'?: 'uppercase' | 'lowercase' | 'capitalize';
        },
        HTMLElement
      >;
      'theme-toggle': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}