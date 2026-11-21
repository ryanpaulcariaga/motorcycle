import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'gold' | 'black' | 'grey';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-button text-white hover:bg-brand-sidebar active:bg-brand-button-active',
  gold: 'bg-brand-gold text-black hover:bg-brand-button hover:text-white active:bg-brand-button-active active:text-white',
  black:
    'bg-brand-black text-white hover:bg-brand-button active:bg-brand-button-active',
  grey: 'bg-brand-grey text-white hover:bg-brand-button active:bg-brand-button-active',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export default function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`px-3 py-2 text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}
