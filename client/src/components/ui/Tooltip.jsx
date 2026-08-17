import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip = ({ children, content, side = 'top', align = 'center', delayDuration = 300 }) => {
  if (!content) return children;

  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>
        {children}
      </TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={5}
          className="z-[100] rounded-md bg-surface-950 border border-surface-800 px-2.5 py-1.5 text-xs font-medium text-surface-200 shadow-xl shadow-black/20"
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
};
