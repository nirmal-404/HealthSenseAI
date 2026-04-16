declare module 'lucide-react' {
  import { ComponentType } from 'react';

  export interface IconProps {
    className?: string;
    size?: number | string;
    strokeWidth?: number | string;
  }

  export const Bell: ComponentType<IconProps>;
  export const Check: ComponentType<IconProps>;
  export const AlertCircle: ComponentType<IconProps>;
  export const Info: ComponentType<IconProps>;
  export const X: ComponentType<IconProps>;
}
