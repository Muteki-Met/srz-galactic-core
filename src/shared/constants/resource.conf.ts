import { ResourceNode } from "@shared/interface/resource.interface";

export const DEFAULT_RESOURCE_NODES: ResourceNode[] = [
	// Nodi vicini (Tier 1-3)
	{ id: "gold_1", resourceType: "gold", position: { x: 12, y: 8 }, size: { x: 2, y: 2 } },
	{ id: "energy_1", resourceType: "energy", position: { x: -14, y: -10 }, size: { x: 2, y: 2 } },

	// Nodi a media distanza (Tier 4-7)
	{ id: "gold_2", resourceType: "gold", position: { x: 20, y: -22 }, size: { x: 3, y: 3 } },
	{ id: "energy_2", resourceType: "energy", position: { x: -25, y: 20 }, size: { x: 2, y: 2 } },

	// Nodi lontani (Tier 8+)
	{ id: "gold_3", resourceType: "gold", position: { x: -5, y: 30 }, size: { x: 4, y: 4 } },
	{ id: "energy_3", resourceType: "energy", position: { x: 28, y: 28 }, size: { x: 3, y: 3 } },
];
