// in src/server/network.ts

import { events, functions } from "@shared/network";

// Creiamo ed esportiamo solo la parte server.
export const ServerFunctions = functions.createServer({});
export const ServerEvents = events.createServer({});
