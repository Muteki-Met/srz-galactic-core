export interface PlayerData {
	coreTier: number;
	grid: Array<{
		x: number;
		y: number;
		state: "locked" | "unlocked" | "occupied";
		building?: string; // id struttura piazzata
	}>;
	inventory: Array<{
		building: string;
		count: number;
	}>;
	resources: {
		gold: number;
		energy: number;
		// altri tipi...
	};
}
