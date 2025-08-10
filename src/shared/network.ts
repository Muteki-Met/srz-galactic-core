// in src/shared/network.ts

import { Networking } from "@flamework/networking";

// Funzioni che il CLIENT chiama e il SERVER gestisce
interface ServerFunctions {
	ValidatePlacement: (buildingId: string, position: Vector2) => boolean;
}

// Funzioni che il SERVER chiama e il CLIENT gestisce (per ora vuota)
interface ClientFunctions {}

// Il resto rimane quasi uguale, ma usiamo i nomi corretti per chiarezza
const functions = Networking.createFunction<ServerFunctions, ClientFunctions>();

export const ClientFunctions = functions.createClient({});
export const ServerFunctions = functions.createServer({});
