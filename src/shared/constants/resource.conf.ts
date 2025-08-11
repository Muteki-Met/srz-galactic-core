import { ResourceDefinition, ResourceNode } from "@shared/interface/resource.interface";

export const DEFAULT_RESOURCE_NODES: ResourceNode[] = [
	// --- Giacimenti Iniziali (2x2) ---
	{ id: "ferronoxite_1", resourceType: "ferronoxite", position: { x: 18, y: 0 }, size: { x: 2, y: 2 } },
	{ id: "voltherium_1", resourceType: "voltherium", position: { x: -14, y: -10 }, size: { x: 2, y: 2 } },

	// --- Giacimenti a Media Distanza (3x3, offrono più flessibilità) ---
	{ id: "ferronoxite_2", resourceType: "ferronoxite", position: { x: 20, y: -22 }, size: { x: 3, y: 3 } },
	{ id: "voltherium_2", resourceType: "voltherium", position: { x: -25, y: 20 }, size: { x: 3, y: 3 } },

	// --- Giacimenti Lontani (4x4, ricchi e strategici) ---
	{ id: "ferronoxite_3", resourceType: "ferronoxite", position: { x: -5, y: 30 }, size: { x: 4, y: 4 } },
	{ id: "voltherium_3", resourceType: "voltherium", position: { x: 28, y: 28 }, size: { x: 4, y: 4 } },

	// --- [NUOVI] Giacimenti "Epici" (molto lontani e grandi) ---
	{ id: "ferronoxite_4", resourceType: "ferronoxite", position: { x: 50, y: -50 }, size: { x: 5, y: 5 } },
	{ id: "voltherium_4", resourceType: "voltherium", position: { x: -50, y: 50 }, size: { x: 5, y: 5 } },
];

// Il nostro array "master" delle risorse
export const RESOURCES: ResourceDefinition[] = [
	{
		id: "ferronoxite", // <-- Nuovo ID
		name: "Ferronoxite", // <-- Nuovo nome
		iconAssetId: "rbxassetid://...", // L'icona della roccia
	},
	{
		id: "voltherium", // <-- Nuovo ID
		name: "Voltherium", // <-- Nuovo nome
		iconAssetId: "rbxassetid://...", // L'icona del gas/energia
	},
	{
		id: "silphite", // <-- Nuovo ID
		name: "Silphite", // <-- Nuovo nome
		iconAssetId: "rbxassetid://...", // L'icona del circuito
	},
];
