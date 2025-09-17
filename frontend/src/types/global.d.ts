/// <reference types="react" />
/// <reference types="react-dom" />

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  import * as React from 'react';
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  export interface LucideProps extends Omit<SVGProps<SVGSVGElement>, 'ref'> {
    size?: string | number;
    color?: string;
  }
  export const Search: FC<LucideProps>;
  export const Plus: FC<LucideProps>;
  export const Edit: FC<LucideProps>;
  export const Trash2: FC<LucideProps>;
  export const Download: FC<LucideProps>;
  export const Filter: FC<LucideProps>;
  export const Calendar: FC<LucideProps>;
  export const User: FC<LucideProps>;
  export const Car: FC<LucideProps>;
  export const CheckCircle: FC<LucideProps>;
  export const AlertCircle: FC<LucideProps>;
  export const XCircle: FC<LucideProps>;
  export const Clock: FC<LucideProps>;
  export const BarChart3: FC<LucideProps>;
  export const PieChart: FC<LucideProps>;
  export const TrendingUp: FC<LucideProps>;
  export const Settings: FC<LucideProps>;
  export const LogOut: FC<LucideProps>;
  export const Home: FC<LucideProps>;
  export const FileText: FC<LucideProps>;
  export const Activity: FC<LucideProps>;
  export const Users: FC<LucideProps>;
  export const AlertTriangle: FC<LucideProps>;
  export const ArrowLeft: FC<LucideProps>;
  export const Menu: FC<LucideProps>;
  export const X: FC<LucideProps>;
  export const ChevronDown: FC<LucideProps>;
  export const ChevronUp: FC<LucideProps>;
  export const ExternalLink: FC<LucideProps>;
  export const Wrench: FC<LucideProps>;
  export const Shield: FC<LucideProps>;
  export const Zap: FC<LucideProps>;
  export const Target: FC<LucideProps>;
  export const Eye: FC<LucideProps>;
}

// Global environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    REACT_APP_API_URL?: string;
    REACT_APP_VERSION?: string;
  }
}

// Window global enhancements
declare global {
  interface Window {
    // Add any global window properties here
    __DEV__?: boolean;
  }
}

export {};