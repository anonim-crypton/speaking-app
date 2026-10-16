import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SmartImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Applied to the gradient placeholder when the image cannot load. */
  fallbackClassName?: string;
}

/**
 * An <img> that degrades gracefully: if the remote image fails to load it
 * renders a themed gradient block instead of a broken-image icon.
 */
export default function SmartImage({
  className,
  fallbackClassName,
  alt = "",
  loading = "lazy",
  ...rest
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "bg-gradient-to-br from-violet-600/50 via-purple-700/40 to-fuchsia-500/40",
          className,
          fallbackClassName
        )}
      />
    );
  }

  return (
    <img
      alt={alt}
      loading={loading}
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}
