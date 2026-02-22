/**
 * SVG path "d" for a single pie slice (wedge from center).
 * Used by portfolio pie/donut in chat page.
 * Single-holding (100%) => angle 360°; SVG arc draws at most 180°, so we use two arcs for full circle.
 */
export function getPieSlicePathD(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  angleDeg: number
): string {
  const startRad = ((startAngleDeg - 90) * Math.PI) / 180;
  const endAngleDeg = startAngleDeg + angleDeg;
  const endRad = ((endAngleDeg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const largeArc = angleDeg > 180 ? 1 : 0;

  if (angleDeg >= 359.5) {
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${x1} ${y1} Z`;
  }
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}
