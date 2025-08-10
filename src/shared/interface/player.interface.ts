export interface PlayerProfile {
	coreTier: number;
	// NEW: Un array che contiene solo gli edifici piazzati sulla griglia.
	placedBuildings: PlacedBuilding[];
	inventory: Array<{
		buildingId: string; // Cambiato da 'building' per coerenza
		count: number;
	}>;
	resources: {
		gold: number;
		energy: number;
		// altri tipi...
	};
}

export interface PlacedBuilding {
	// NEW: Un ID unico per questa specifica istanza di edificio.
	// Fondamentale per poterlo identificare (es. per fare un upgrade).
	instanceId: string;
	buildingId: string; // es: "gold_mine"
	tier: number;
	// NEW: La posizione dell'angolo in alto a sinistra dell'edificio sulla griglia.
	position: { x: number; y: number };
	status: "placed" | "upgrading" | "construction" | "built";
	startedAt?: number;
	finishedAt?: number;
}
