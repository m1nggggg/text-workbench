import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/classNames';

export const Kbd = ({ className, ...props }: HTMLAttributes<HTMLElement>) => (
  <kbd className={cn('inline-flex min-w-5 items-center justify-center rounded border border-border/80 bg-muted px-1.5 font-mono text-[0.62rem] font-medium text-muted-foreground shadow-[0_1px_0_rgba(255,255,255,0.06)]', className)} {...props} />
);
