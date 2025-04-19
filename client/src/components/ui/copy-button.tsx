import React, { useState } from 'react';
import { Button } from './button';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  text: string;
  className?: string;
  iconOnly?: boolean;
  label?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export const CopyButton = ({
  text,
  className,
  iconOnly = false,
  label = 'Copy',
  size = 'default',
  variant = 'outline',
}: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleCopy}
      className={cn('flex items-center gap-2', className)}
      type="button"
      disabled={copied}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {!iconOnly && (copied ? 'Copied!' : label)}
    </Button>
  );
};