"use client";

import React, { forwardRef, createContext, useContext } from "react";
import { cva, type VariantProps } from "class-variance-authority";

// Button style variants using cva (similar to tva pattern)
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      action: {
        primary:
          "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-primary-500",
        secondary:
          "bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 focus-visible:ring-secondary-500",
        positive:
          "bg-success-500 text-white hover:bg-success-600 active:bg-success-700 focus-visible:ring-success-500",
        negative:
          "bg-error-500 text-white hover:bg-error-600 active:bg-error-700 focus-visible:ring-error-500",
        default:
          "bg-transparent hover:bg-background-50 active:bg-transparent",
      },
      variant: {
        solid: "",
        outline:
          "bg-transparent border border-current hover:bg-background-50 active:bg-transparent",
        link: "bg-transparent px-0 hover:underline",
      },
      size: {
        xs: "h-8 px-3.5 text-xs",
        sm: "h-9 px-4 text-sm",
        md: "h-10 px-5 text-base",
        lg: "h-11 px-6 text-lg",
        xl: "h-12 px-7 text-xl",
      },
    },
    compoundVariants: [
      // Outline variants with proper text colors
      {
        action: "primary",
        variant: "outline",
        className: "text-primary-500 border-primary-500",
      },
      {
        action: "secondary",
        variant: "outline",
        className: "text-secondary-500 border-secondary-500",
      },
      {
        action: "positive",
        variant: "outline",
        className: "text-success-500 border-success-500",
      },
      {
        action: "negative",
        variant: "outline",
        className: "text-error-500 border-error-500",
      },
      // Link variants
      {
        action: "primary",
        variant: "link",
        className: "text-primary-500",
      },
      {
        action: "secondary",
        variant: "link",
        className: "text-secondary-500",
      },
      {
        action: "positive",
        variant: "link",
        className: "text-success-500",
      },
      {
        action: "negative",
        variant: "link",
        className: "text-error-500",
      },
    ],
    defaultVariants: {
      action: "primary",
      variant: "solid",
      size: "md",
    },
  }
);

const buttonTextVariants = cva("", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
      xl: "text-xl",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

// Context for sharing variant props with child components
type ButtonContextType = VariantProps<typeof buttonVariants>;
const ButtonContext = createContext<ButtonContextType>({});

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    isLoading?: boolean;
  };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      action = "primary",
      variant = "solid",
      size = "md",
      isLoading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <ButtonContext.Provider value={{ action, variant, size }}>
        <button
          ref={ref}
          className={buttonVariants({ action, variant, size, className })}
          disabled={disabled || isLoading}
          {...props}
        >
          {isLoading && <ButtonSpinner />}
          {children}
        </button>
      </ButtonContext.Provider>
    );
  }
);

Button.displayName = "Button";

// ButtonText component for text content
export type ButtonTextProps = React.HTMLAttributes<HTMLSpanElement>;

const ButtonText = forwardRef<HTMLSpanElement, ButtonTextProps>(
  ({ className, children, ...props }, ref) => {
    const { size } = useContext(ButtonContext);
    return (
      <span
        ref={ref}
        className={buttonTextVariants({ size, className })}
        {...props}
      >
        {children}
      </span>
    );
  }
);

ButtonText.displayName = "ButtonText";

// ButtonSpinner component for loading state
const ButtonSpinner = () => (
  <svg
    className="h-4 w-4 animate-spin"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// ButtonIcon component for icons
export type ButtonIconProps = React.SVGAttributes<SVGElement> & {
  as?: React.ElementType;
};

const ButtonIcon = forwardRef<SVGSVGElement, ButtonIconProps>(
  ({ as: Icon, className, ...props }, ref) => {
    const { size } = useContext(ButtonContext);
    const sizeClasses = {
      xs: "h-3.5 w-3.5",
      sm: "h-4 w-4",
      md: "h-[18px] w-[18px]",
      lg: "h-[18px] w-[18px]",
      xl: "h-5 w-5",
    };
    const sizeClass = sizeClasses[size || "md"];

    if (Icon) {
      return <Icon ref={ref} className={`${sizeClass} ${className || ""}`} {...props} />;
    }
    return null;
  }
);

ButtonIcon.displayName = "ButtonIcon";

// ButtonGroup component
export type ButtonGroupProps = React.HTMLAttributes<HTMLDivElement> & {
  space?: "xs" | "sm" | "md" | "lg" | "xl";
  isAttached?: boolean;
  flexDirection?: "row" | "column";
};

const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  (
    {
      className,
      space = "md",
      isAttached = false,
      flexDirection = "row",
      ...props
    },
    ref
  ) => {
    const spaceClasses = {
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
      xl: "gap-5",
    };
    const directionClasses = {
      row: "flex-row",
      column: "flex-col",
    };

    return (
      <div
        ref={ref}
        className={`flex ${directionClasses[flexDirection]} ${
          isAttached ? "gap-0" : spaceClasses[space]
        } ${className || ""}`}
        {...props}
      />
    );
  }
);

ButtonGroup.displayName = "ButtonGroup";

export { Button, ButtonText, ButtonSpinner, ButtonIcon, ButtonGroup, buttonVariants };
