// in src/server/network.ts

import { events, functions } from "@shared/network";

// Creiamo la vista del server sulla rete.
const serverNetwork = events.createServer({});

// Esportiamo la parte per ascoltare gli eventi dal client.
export const ServerEvents = serverNetwork;

// Esportiamo ANCHE la parte per inviare eventi al client.
// È lo stesso oggetto, ma lo esportiamo con il nome corretto
// per chiarezza e coerenza.
export const ClientEvents = serverNetwork;

// Facciamo lo stesso per le funzioni.
export const ServerFunctions = functions.createServer({});
