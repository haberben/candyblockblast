import React from "react";
import type { CandyId } from "@/lib/game";

export const Candy = React.memo(function Candy({
  id,
  size,
  className = "",
  style,
}: {
  id: CandyId;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`candy-base candy-shine c${id} ${className}`}
      style={{ width: size, height: size, ...style }}
      aria-hidden="true"
    >
      <span className="cpat" />
    </div>
  );
});
