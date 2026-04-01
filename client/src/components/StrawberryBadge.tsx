/**
 * StrawberryBadge — a small inline SVG strawberry icon used to mark Premium members.
 * Using SVG instead of emoji ensures identical rendering across all browsers, OS versions,
 * and devices (including Android phones and systems that block or replace emoji glyphs).
 */
export function StrawberryBadge({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Premium member"
      role="img"
      style={{ display: "inline-block", flexShrink: 0, verticalAlign: "middle" }}
    >
      {/* Leaves */}
      <path
        d="M12 3 C10 1 7 2 7 5 C7 5 9 4 12 6 C15 4 17 5 17 5 C17 2 14 1 12 3Z"
        fill="#4ade80"
      />
      {/* Berry body */}
      <path
        d="M7 8 C5 10 5 14 7 17 C9 20 15 20 17 17 C19 14 19 10 17 8 C15 6 9 6 7 8Z"
        fill="#f43f5e"
      />
      {/* Seeds */}
      <circle cx="10" cy="12" r="0.8" fill="#fda4af" />
      <circle cx="13" cy="11" r="0.8" fill="#fda4af" />
      <circle cx="12" cy="14.5" r="0.8" fill="#fda4af" />
      <circle cx="9.5" cy="15.5" r="0.7" fill="#fda4af" />
      <circle cx="14.5" cy="14" r="0.7" fill="#fda4af" />
    </svg>
  );
}
