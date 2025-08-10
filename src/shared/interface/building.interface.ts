export type BuildingCategory = "resource" | "defense" | "army" | "core" | "decoration" | "logistic";

export interface BuildingTierData {
	cost: number; // Costo di costruzione/upgrade
	buildTime: number; // Tempo per costruire/upgradare (secondi)
	hitpoints: number; // HP massimi a questo tier
	capacity?: number; // Capacità (es: oro, truppe, energia)
	damage?: {
		type: string; // Tipo di danno (es: "melee", "ranged", ecc.)
		amount: number; // Quantità di danno (es: 10, 20, ecc.)
		time: number; // Tempo per attaccare (secondi)
		range: number; // Raggio di attacco
	};
	requiredTownHall?: number; // Livello minimo del Core/TownHall
	unlocksAtLevel?: number; // Livello Core in cui sblocchi questo tier
	resource?: {
		type: string; // Tipo di risorsa (es: "gold", "energy", ecc.)
		amount: number; // Quantità di risorsa prodotta
		time: number; // Tempo per produrre la risorsa (secondi)
	};
	requirements?: {
		id: string; // Id logico (es: "core", "gold_mine")
		tier: number; // Tier richiesto
	}[];
}

export interface BuildingDefinition {
	id: string; // Id logico (es: "core", "gold_mine")
	name: string; // Nome visualizzato
	category: BuildingCategory; // Tipo (resource, defense, ecc.)
	model: string; // Prefisso modello (es: "Core", "GoldMine")
	size: { x: number; y: number }; // Dimensione in celle (es: 2x2)
	maxTier: number; // Tier massimo raggiungibile
	tiers: { [tier: number]: BuildingTierData };
	description?: string; // Descrizione visuale
	limit?: number; // Limite massimo (es: 1 per giocatore)
	// Altri campi globali, es: se è unica, se può essere rimossa, ecc.
}
