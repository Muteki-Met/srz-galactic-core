import { ResourceDefinition, ResourceNode } from "@shared/interface/resource.interface";

export const DEFAULT_RESOURCE_NODES: ResourceNode[] = [
	// --- Giacimenti Iniziali (vicini al centro, accessibili subito) ---
	{ id: "ferronoxite_1", resourceType: "ferronoxite", position: { x: 8, y: 2 }, size: { x: 2, y: 2 } },
	{ id: "voltherium_1", resourceType: "voltherium", position: { x: -10, y: -8 }, size: { x: 2, y: 2 } },

	// --- Giacimenti a Media Distanza (richiedono una piccola espansione) ---
	{ id: "ferronoxite_2", resourceType: "ferronoxite", position: { x: 12, y: -14 }, size: { x: 3, y: 3 } },
	{ id: "voltherium_2", resourceType: "voltherium", position: { x: -15, y: 13 }, size: { x: 3, y: 3 } },

	// --- Giacimenti Lontani (ricompensano l'esplorazione) ---
	{ id: "ferronoxite_3", resourceType: "ferronoxite", position: { x: -5, y: 18 }, size: { x: 4, y: 4 } },
	{ id: "voltherium_3", resourceType: "voltherium", position: { x: 17, y: 16 }, size: { x: 4, y: 4 } },
];

// Il nostro array "master" delle risorse
export const RESOURCES: ResourceDefinition[] = [
	{
		id: "ferronoxite", // <-- Nuovo ID
		name: "Ferronoxite", // <-- Nuovo nome
		iconAssetId: "rbxassetid://85316971666004", // L'icona della roccia
	},
	{
		id: "voltherium", // <-- Nuovo ID
		name: "Voltherium", // <-- Nuovo nome
		iconAssetId: "rbxassetid://85316971666004", // L'icona del gas/energia
	},
	{
		id: "silphite", // <-- Nuovo ID
		name: "Silphite", // <-- Nuovo nome
		iconAssetId: "rbxassetid://85316971666004", // L'icona del circuito
	},
];
