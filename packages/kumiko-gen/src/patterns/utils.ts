import type { Point } from '../grid.js';

/** Round a number to 2 decimal places for SVG output */
export function r(n: number): string {
  return n.toFixed(2);
}

/** Generate an SVG line element */
export function line(from: Point, to: Point, sw: number): string {
  return `<line x1="${r(from.x)}" y1="${r(from.y)}" x2="${r(to.x)}" y2="${r(to.y)}" stroke-width="${sw}"/>`;
}

/** Calculate the midpoint between two points */
export function mid(p1: Point, p2: Point): Point {
  return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
}

/** Linear interpolation between two points */
export function lerp(from: Point, to: Point, t: number): Point {
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

/** Euclidean distance between two points */
export function dist(a: Point, b: Point): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Generate an SVG arc path element */
export function arc(from: Point, to: Point, radius: number, sw: number): string {
  return `<path d="M ${r(from.x)} ${r(from.y)} A ${r(radius)} ${r(radius)} 0 0 1 ${r(to.x)} ${r(to.y)}" fill="none" stroke-width="${sw}"/>`;
}

/** Generate an SVG quadratic bezier curve path element */
export function quad(from: Point, ctrl: Point, to: Point, sw: number): string {
  return `<path d="M ${r(from.x)} ${r(from.y)} Q ${r(ctrl.x)} ${r(ctrl.y)} ${r(to.x)} ${r(to.y)}" fill="none" stroke-width="${sw}"/>`;
}
