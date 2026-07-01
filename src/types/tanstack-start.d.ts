/**
 * Pulls TanStack Start's server-route type augmentations into the program so
 * file routes can declare a `server: { handlers: { ... } }` option. Without
 * this, only the client route options are visible to TypeScript.
 */
import "@tanstack/react-start";
