// in src/shared/network.ts

import { Networking } from "@flamework/networking";
import { PlayerProfile } from "@shared/interface/player.interface";
import { ResourceNode } from "@shared/interface/resource.interface";

interface ServerFunctions {
	ValidatePlacement: (buildingId: string, position: Vector2) => boolean;

	GetResourceNodes(): ResourceNode[];
}

interface ClientFunctions {}

// Esportiamo solo l'oggetto base.
export const functions = Networking.createFunction<ServerFunctions, ClientFunctions>();

interface ServerEvents {
	PlaceBuilding(buildingId: string, position: Vector2): void;

	SalvageBuilding(instanceId: string): void;
}

interface ClientEvents {
	UpdatePlayerData: (data: PlayerProfile) => void;
}

export const events = Networking.createEvent<ServerEvents, ClientEvents>();
