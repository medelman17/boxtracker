"use client";

import React, { forwardRef, createContext, useContext, useId } from "react";
import { cva, type VariantProps } from "class-variance-authority";

// Input style variants
const inputVariants = cva(
  "w-full rounded border bg-background-0 px-3 text-typography-900 transition-colors placeholder:text-typography-400 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        outline:
          "border-background-300 focus:border-primary-500 focus:ring-primary-500/20",
        filled:
          "border-transparent bg-background-100 focus:bg-background-0 focus:border-primary-500 focus:ring-primary-500/20",
        underlined:
          "rounded-none border-x-0 border-t-0 border-b-background-300 px-0 focus:border-b-primary-500 focus:ring-0",
      },
      size: {
        sm: "h-8 text-sm",
        md: "h-10 text-base",
        lg: "h-12 text-lg",
        xl: "h-14 text-xl",
      },
      isInvalid: {
        true: "border-error-500 focus:border-error-500 focus:ring-error-500/20",
      },
      isDisabled: {
        true: "cursor-not-allowed opacity-50",
      },
      isReadOnly: {
        true: "cursor-default bg-background-50",
      },
    },
    defaultVariants: {
      variant: "outline",
      size: "md",
    },
  }
);

// FormControl context
type FormControlContextType = {
  inputId?: string;
  isInvalid?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
};

const FormControlContext = createContext<FormControlContextType>({});

// FormControl component (wrapper)
export type FormControlProps = React.HTMLAttributes<HTMLDivElement> & {
  isInvalid?: boolean;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
};

const FormControl = forwardRef<HTMLDivElement, FormControlProps>(
  (
    { className, isInvalid, isDisabled, isReadOnly, isRequired, children, ...props },
    ref
  ) => {
    const inputId = useId();

    return (
      <FormControlContext.Provider
        value={{ inputId, isInvalid, isDisabled, isReadOnly, isRequired }}
      >
        <div ref={ref} className={`space-y-1.5 ${className || ""}`} {...props}>
          {children}
        </div>
      </FormControlContext.Provider>
    );
  }
);

FormControl.displayName = "FormControl";

// FormControlLabel component
export type FormControlLabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

const FormControlLabel = forwardRef<HTMLLabelElement, FormControlLabelProps>(
  ({ className, children, ...props }, ref) => {
    const { inputId, isRequired } = useContext(FormControlContext);

    return (
      <label
        ref={ref}
        htmlFor={inputId}
        className={`block text-sm font-medium text-typography-700 ${className || ""}`}
        {...props}
      >
        {children}
        {isRequired && <span className="ml-1 text-error-500">*</span>}
      </label>
    );
  }
);

FormControlLabel.displayName = "FormControlLabel";

// FormControlLabelText component
export type FormControlLabelTextProps = React.HTMLAttributes<HTMLSpanElement>;

const FormControlLabelText = forwardRef<HTMLSpanElement, FormControlLabelTextProps>(
  ({ className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={`text-typography-700 ${className || ""}`}
        {...props}
      />
    );
  }
);

FormControlLabelText.displayName = "FormControlLabelText";

// Input component
export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> &
  VariantProps<typeof inputVariants>;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, size, isInvalid: isInvalidProp, ...props }, ref) => {
    const {
      inputId,
      isInvalid: isInvalidContext,
      isDisabled,
      isReadOnly,
    } = useContext(FormControlContext);

    const isInvalid = isInvalidProp ?? isInvalidContext;

    return (
      <input
        ref={ref}
        id={inputId}
        className={inputVariants({
          variant,
          size,
          isInvalid,
          isDisabled,
          isReadOnly,
          className,
        })}
        disabled={isDisabled}
        readOnly={isReadOnly}
        aria-invalid={isInvalid}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

// InputField - alias for Input (for API compatibility with mobile)
const InputField = Input;
InputField.displayName = "InputField";

// FormControlHelper component
export type FormControlHelperProps = React.HTMLAttributes<HTMLParagraphElement>;

const FormControlHelper = forwardRef<HTMLParagraphElement, FormControlHelperProps>(
  ({ className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={`text-sm text-typography-500 ${className || ""}`}
        {...props}
      />
    );
  }
);

FormControlHelper.displayName = "FormControlHelper";

// FormControlHelperText component
export type FormControlHelperTextProps = React.HTMLAttributes<HTMLSpanElement>;

const FormControlHelperText = forwardRef<HTMLSpanElement, FormControlHelperTextProps>(
  ({ className, ...props }, ref) => {
    return (
      <span ref={ref} className={`${className || ""}`} {...props} />
    );
  }
);

FormControlHelperText.displayName = "FormControlHelperText";

// FormControlError component
export type FormControlErrorProps = React.HTMLAttributes<HTMLParagraphElement>;

const FormControlError = forwardRef<HTMLParagraphElement, FormControlErrorProps>(
  ({ className, ...props }, ref) => {
    const { isInvalid } = useContext(FormControlContext);

    if (!isInvalid) return null;

    return (
      <p
        ref={ref}
        className={`text-sm text-error-500 ${className || ""}`}
        role="alert"
        {...props}
      />
    );
  }
);

FormControlError.displayName = "FormControlError";

// FormControlErrorText component
export type FormControlErrorTextProps = React.HTMLAttributes<HTMLSpanElement>;

const FormControlErrorText = forwardRef<HTMLSpanElement, FormControlErrorTextProps>(
  ({ className, ...props }, ref) => {
    return <span ref={ref} className={`${className || ""}`} {...props} />;
  }
);

FormControlErrorText.displayName = "FormControlErrorText";

export {
  Input,
  InputField,
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlHelper,
  FormControlHelperText,
  FormControlError,
  FormControlErrorText,
  inputVariants,
};
