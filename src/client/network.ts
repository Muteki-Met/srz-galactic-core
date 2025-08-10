// in src/client/network.ts

import { events, functions } from "@shared/network";

// Creiamo ed esportiamo solo la parte client.
export const ClientFunctions = functions.createClient({});
export const ClientEvents = events.createClient({});
