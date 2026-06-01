import type { CSSProperties, ReactNode, MouseEventHandler } from 'react';

interface IconifyIconElement {
  icon?: string;
  width?: string | number;
  height?: string | number;
  'stroke-width'?: string | number;
  inline?: string;
  className?: string;
  style?: CSSProperties;
  title?: string;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLElement>;
}

// React 19 / react-jsx transform
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': IconifyIconElement;
    }
  }
}

// Legacy global JSX check (used by some Next.js type resolution paths)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'iconify-icon': IconifyIconElement;
    }
  }
}
