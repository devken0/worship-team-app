/**
 * The church logo mark. Renders /logo.png (a trimmed, transparent-background
 * copy of the church logo) at the requested pixel size, preserving aspect.
 * Plain <img> on purpose: keeps the build green even if the asset is swapped
 * out, and the file is tiny so optimization buys little.
 */
export default function Logo({
  size = 28,
  className = "",
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Church logo"
      width={size}
      height={size}
      // The source is taller than wide; contain it within a square footprint.
      style={{ height: size, width: "auto" }}
      className={className}
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
