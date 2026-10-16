import React from "react";

interface VerifiedBadgeProps {
  size?: number;
  className?: string;
  title?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 20,
  className = "",
  title = "Tasdiqlangan VIP obunachi",
}) => {
  return (
    <span
      className={`inline-flex items-center justify-center select-none align-middle ${className}`}
      title={title}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="filter drop-shadow-[0_2px_6px_rgba(234,179,8,0.45)] hover:scale-110 transition-transform duration-200"
      >
        <defs>
          {/* Rich golden gradient for 8-point badge */}
          <linearGradient id="vipGoldGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="28%" stopColor="#EAB308" />
            <stop offset="65%" stopColor="#CA8A04" />
            <stop offset="100%" stopColor="#A16207" />
          </linearGradient>

          {/* Golden inner border highlight */}
          <linearGradient id="vipStrokeGrad" x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#78350F" stopOpacity="0.6" />
          </linearGradient>

          {/* Translucent diagonal ribbon sheen */}
          <linearGradient id="vipSheenGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="65%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 8-pointed star / rosette */}
        <path
          d="M12 2.2L14.7 4.55L18.25 4.3L19.5 7.6L22.65 9.25L21.75 12.7L23.1 16.05L19.8 17.4L18.25 20.65L14.7 20.25L12 22.45L9.3 20.25L5.75 20.65L4.2 17.4L0.9 16.05L2.25 12.7L1.35 9.25L4.5 7.6L5.75 4.3L9.3 4.55L12 2.2Z"
          fill="url(#vipGoldGrad)"
          stroke="url(#vipStrokeGrad)"
          strokeWidth="0.8"
        />

        {/* Translucent sheen across badge */}
        <path
          d="M12 2.2L14.7 4.55L18.25 4.3L19.5 7.6L22.65 9.25L21.75 12.7L23.1 16.05L19.8 17.4L18.25 20.65L14.7 20.25L12 22.45L9.3 20.25L5.75 20.65L4.2 17.4L0.9 16.05L2.25 12.7L1.35 9.25L4.5 7.6L5.75 4.3L9.3 4.55L12 2.2Z"
          fill="url(#vipSheenGrad)"
        />

        {/* Bold black rounded checkmark in center */}
        <path
          d="M8.2 12.4L10.8 15.1L16.2 9.5"
          stroke="#111827"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* 4-point sparkle on top-left */}
        <g transform="translate(1.5, 0.5)">
          <path
            d="M5 1.5 C5 2.8 4 3.8 2.8 4 C4 4.2 5 5.2 5 6.5 C5 5.2 6 4.2 7.2 4 C6 3.8 5 2.8 5 1.5 Z"
            fill="#FFFFFF"
            filter="drop-shadow(0 0 2px #FEF08A)"
          />
        </g>
      </svg>
    </span>
  );
};
