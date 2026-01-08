"use client";

import React, {
  forwardRef,
  createContext,
  useContext,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { cva, type VariantProps } from "class-variance-authority";

// Modal context
type ModalContextType = {
  isOpen: boolean;
  onClose: () => void;
};

const ModalContext = createContext<ModalContextType>({
  isOpen: false,
  onClose: () => {},
});

// Modal backdrop variants
const backdropVariants = cva(
  "fixed inset-0 z-50 bg-black/50 transition-opacity",
  {
    variants: {
      isOpen: {
        true: "opacity-100",
        false: "opacity-0 pointer-events-none",
      },
    },
    defaultVariants: {
      isOpen: false,
    },
  }
);

// Modal content variants
const contentVariants = cva(
  "relative bg-background-0 rounded-lg shadow-xl transition-all max-h-[90vh] overflow-auto",
  {
    variants: {
      size: {
        xs: "w-full max-w-xs",
        sm: "w-full max-w-sm",
        md: "w-full max-w-md",
        lg: "w-full max-w-lg",
        xl: "w-full max-w-xl",
        full: "w-full max-w-[90vw] h-[90vh]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

// Modal component
export type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  closeOnOverlayClick?: boolean;
  children: React.ReactNode;
};

const Modal = ({
  isOpen,
  onClose,
  closeOnOverlayClick = true,
  children,
}: ModalProps) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <ModalContext.Provider value={{ isOpen, onClose }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className={backdropVariants({ isOpen })}
          onClick={closeOnOverlayClick ? onClose : undefined}
          aria-hidden="true"
        />
        {/* Content */}
        {children}
      </div>
    </ModalContext.Provider>,
    document.body
  );
};

Modal.displayName = "Modal";

// ModalBackdrop component (for custom backdrop styling)
export type ModalBackdropProps = React.HTMLAttributes<HTMLDivElement>;

const ModalBackdrop = forwardRef<HTMLDivElement, ModalBackdropProps>(
  ({ className, ...props }, ref) => {
    const { onClose } = useContext(ModalContext);

    return (
      <div
        ref={ref}
        className={`fixed inset-0 bg-black/50 ${className || ""}`}
        onClick={onClose}
        aria-hidden="true"
        {...props}
      />
    );
  }
);

ModalBackdrop.displayName = "ModalBackdrop";

// ModalContent component
export type ModalContentProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof contentVariants>;

const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(
  ({ className, size, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        className={contentVariants({ size, className })}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ModalContent.displayName = "ModalContent";

// ModalHeader component
export type ModalHeaderProps = React.HTMLAttributes<HTMLDivElement>;

const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-between p-4 border-b border-background-200 ${className || ""}`}
        {...props}
      />
    );
  }
);

ModalHeader.displayName = "ModalHeader";

// ModalBody component
export type ModalBodyProps = React.HTMLAttributes<HTMLDivElement>;

const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ className, ...props }, ref) => {
    return (
      <div ref={ref} className={`p-4 ${className || ""}`} {...props} />
    );
  }
);

ModalBody.displayName = "ModalBody";

// ModalFooter component
export type ModalFooterProps = React.HTMLAttributes<HTMLDivElement>;

const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`flex items-center justify-end gap-3 p-4 border-t border-background-200 ${className || ""}`}
        {...props}
      />
    );
  }
);

ModalFooter.displayName = "ModalFooter";

// ModalCloseButton component
export type ModalCloseButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const ModalCloseButton = forwardRef<HTMLButtonElement, ModalCloseButtonProps>(
  ({ className, children, ...props }, ref) => {
    const { onClose } = useContext(ModalContext);

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClose}
        className={`rounded-full p-1 text-typography-500 hover:bg-background-100 hover:text-typography-700 transition-colors ${className || ""}`}
        aria-label="Close"
        {...props}
      >
        {children || (
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        )}
      </button>
    );
  }
);

ModalCloseButton.displayName = "ModalCloseButton";

// Heading component for modal titles
export type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> & {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
};

const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, size = "lg", ...props }, ref) => {
    const sizeClasses = {
      xs: "text-xs font-semibold",
      sm: "text-sm font-semibold",
      md: "text-base font-semibold",
      lg: "text-lg font-semibold",
      xl: "text-xl font-semibold",
      "2xl": "text-2xl font-bold",
    };

    return (
      <h2
        ref={ref}
        className={`text-typography-900 ${sizeClasses[size]} ${className || ""}`}
        {...props}
      />
    );
  }
);

Heading.displayName = "Heading";

export {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Heading,
  contentVariants,
};
