/**
 * Type declarations for Vite's ?raw import syntax
 */

declare module '*.md?raw' {
  const content: string;
  export default content;
}
