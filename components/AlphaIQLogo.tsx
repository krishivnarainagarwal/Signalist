import { cn } from "@/lib/utils";

const AlphaIQLogo = ({
    markOnly = false,
    className,
}: {
    markOnly?: boolean;
    className?: string;
}) => {
    if (markOnly) {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                fill="none"
                role="img"
                aria-label="AlphaIQ"
                className={cn("ticker-logo alphaiq-logo h-8 w-8", className)}
            >
                <title>AlphaIQ</title>
                <path d="M7 26L16 6l9 20" stroke="#E07A5F" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
                <path d="M11 18.5h10" stroke="#E07A5F" strokeWidth="2.3" strokeLinecap="square" />
                <path d="M22.5 11l3.5-4.5 3 2" stroke="#F4EDE4" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" />
            </svg>
        );
    }

    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 156 32"
            fill="none"
            role="img"
            aria-label="AlphaIQ"
            className={cn("ticker-logo alphaiq-logo", className)}
        >
            <title>AlphaIQ</title>
            <path d="M7 26L16 6l9 20" stroke="#E07A5F" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
            <path d="M11 18.5h10" stroke="#E07A5F" strokeWidth="2.3" strokeLinecap="square" />
            <path d="M22.5 11l3.5-4.5 3 2" stroke="#F4EDE4" strokeWidth="1.7" strokeLinecap="square" strokeLinejoin="miter" />
            <text
                x="38"
                y="22"
                fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
                fontSize="16"
                fontWeight="650"
                letterSpacing="0.6"
            >
                <tspan fill="#F4EDE4">Alpha</tspan>
                <tspan fill="#E07A5F">IQ</tspan>
            </text>
        </svg>
    );
};

export default AlphaIQLogo;
