export interface ResourceNode {
	id: string;
	resourceType: ResourceId; // Per ora, poi potremo aggiungerne altri
	position: { x: number; y: number };
	size: { x: number; y: number };
}

export type ResourceId = "ferronoxite" | "voltherium" | "silphite";

export interface ResourceDefinition {
	id: ResourceId;
	name: string;
	iconAssetId: string; // L'ID dell'icona che hai caricato su Roblox
}
