/// <reference types="react" />
/// <reference types="react-dom" />

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

declare module 'xlsx';
declare module 'papaparse';
declare module 'lucide-react';
declare module 'recharts';