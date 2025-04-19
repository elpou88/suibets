import * as React from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
}

export function CopyButton({
  value,
  className,
  variant = 'ghost',
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    // Reset the copied state after 2 seconds
    if (hasCopied) {
      const timer = setTimeout(() => {
        setHasCopied(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [hasCopied]);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setHasCopied(true);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [value]);

  return (
    <Button
      size="sm"
      variant={variant}
      className={className}
      onClick={handleCopy}
      {...props}
    >
      {hasCopied ? (
        <CheckIcon className="h-3 w-3" />
      ) : (
        <CopyIcon className="h-3 w-3" />
      )}
      <span className="sr-only">Copy</span>
    </Button>
  );
}