import React, { ButtonHTMLAttributes } from 'react';

export const Button = ({
    variant,
    className,
    ...props
}: {
    variant: 'primary' | 'success' | 'active';
    className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>) => {
    const base = `h-9 rounded-md px-3 text-sm transition-colors disabled:pointer-events-none disabled:cursor-not-allowed`;
    const variants = {
        primary:
            'bg-foreground text-background hover:bg-foreground/90 disabled:bg-foreground/50',
        active: 'bg-background/70 text-foreground',
        success:
            'bg-green-300 text-green-900 hover:bg-green-300/90 disabled:bg-green-300/50',
    } as const;

    return (
        <button
            className={`${base} ${variants[variant]} ${className}`}
            {...props}
        />
    );
};
