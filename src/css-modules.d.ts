/**
 * Type declarations for CSS Modules.
 * Allows TypeScript to understand `.module.css` imports.
 */
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
