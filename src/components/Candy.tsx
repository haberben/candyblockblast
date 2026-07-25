import React from "react";
import { cn } from "@/lib/utils";
import { type CandyId } from "@/lib/game";

type CandyProps = {
  id: CandyId;
  className?: string;
  style?: React.CSSProperties;
};

export function Candy({ id, className, style }: CandyProps) {
  return (
    <div
      className={cn("candy-base candy-shine w-full h-full", `c${id}`, className)}
      style={style}
    />
  );
}
