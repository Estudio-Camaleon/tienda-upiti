"use client";

import { useCallback, useMemo } from "react";
import { getOptimizedImageUrl } from "../lib/image";
export default function ProtectedImage({
  src,
  alt,
  className = "",
  imgClassName = "",
  width,
  height,
  ...props
}) {
  const prevent = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const optimizedSrc = useMemo(
    () => getOptimizedImageUrl(src, { width, height }),
    [src, width, height],
  );

  return (
    <div
      className={`overflow-hidden ${className}`}
      onContextMenu={prevent}
      onCopy={prevent}
      onCut={prevent}
    >
      <img
        src={optimizedSrc}
        alt={alt}
        className={`block w-full h-full select-none ${imgClassName}`}
        draggable={false}
        onDragStart={prevent}
        loading="lazy"
        decoding="async"
        style={{
          WebkitUserDrag: "none",
          WebkitTouchCallout: "none",
          pointerEvents: "none",
        }}
        {...props}
      />
      <div
        className="absolute inset-0"
        style={{ zIndex: 1, pointerEvents: "none" }}
        aria-hidden="true"
      />
    </div>
  );
}
