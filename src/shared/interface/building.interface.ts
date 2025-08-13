/**
 * @file Definisce la struttura dati per tutti gli edifici del gioco.
 * @description La filosofia di questo file è separare i dati "statici" di un edificio
 * (come il suo nome, la dimensione, che non cambiano mai) dai dati che dipendono
 * dal suo livello o "tier" (come il costo, gli HP, la produzione).
 *
 * - [BuildingDefinition](cci:2://file:///D:/Git-Repos/Roblox/Galactic_Core/src/shared/interface/building.interface.ts:6:0-18:1): Contiene i dati statici e un array di [BuildingTierData](cci:2://file:///D:/Git-Repos/Roblox/Galactic_Core/src/shared/interface/building.interface.ts:4:0-16:63).
 * - [BuildingTierData](cci:2://file:///D:/Git-Repos/Roblox/Galactic_Core/src/shared/interface/building.interface.ts:4:0-16:63): Contiene i dati specifici per ogni singolo tier di un edificio.
 */

import { ResourceId } from "@shared/interface/resource.interface";

/**
 * Definisce le categorie principali a cui un edificio può appartenere.
 * Utile per filtrare o applicare logiche specifiche (es: "mostra solo edifici di difesa").
 */
export type BuildingCategory = "resource" | "defense" | "army" | "core" | "decoration" | "logistic";

/**
 * Rappresenta i dati specifici di un singolo livello (tier) di un edificio.
 * Ogni edificio avrà un array di queste interfacce, una per ogni suo livello.
 */
export interface BuildingTierData {
	/** Il livello numerico di questo tier (es: 1, 2, 3...). */
	tier: number;

	/**
	 * Il costo in risorse per costruire o fare l'upgrade a questo tier.
	 * È un oggetto dove le chiavi sono gli ID delle risorse (es: "iridium") e i valori sono la quantità.
	 * Esempio: `{ iridium: 500, plasma: 100 }`
	 */
	cost: { [key in ResourceId]?: number };

	/** Il tempo in secondi necessario per completare la costruzione o l'upgrade a questo tier. */
	buildTime: number;

	/** I punti vita massimi (HP) che l'edificio ha a questo tier. */
	hitpoints: number;

	/** (Opzionale) La capacità di immagazzinamento dell'edificio (es: quante risorse può contenere). */
	capacity?: number;

	/** (Opzionale) Se l'edificio è una struttura difensiva, definisce le sue statistiche di attacco. */
	damage?: {
		type: string; // Tipo di danno (es: "laser", "cinetico", "esplosivo")
		amount: number; // Danno per colpo
		time: number; // Tempo tra un attacco e l'altro (secondi)
		range: number; // Raggio d'azione in celle della griglia
	};

	/** (Opzionale) Il livello minimo del "Core" richiesto per poter fare l'upgrade a questo tier. */
	requiredTownHall?: number;

	/** (Opzionale) Il livello del giocatore (o del Core) a cui questo tier viene sbloccato nel menu di costruzione. */
	unlocksAtLevel?: number;

	/** (Opzionale) Se l'edificio produce una risorsa, questo campo ne definisce i dettagli. */
	resource?: {
		type: ResourceId; // Il tipo di risorsa prodotta (es: "iridium")
		amount: number; // La quantità prodotta per ciclo
		time: number; // La durata di un ciclo di produzione in secondi
	};

	/** (Opzionale) Se l'edificio consuma una risorsa per funzionare (es: una fabbrica). */
	consumes?: {
		type: ResourceId; // Il tipo di risorsa consumata (es: "plasma")
		amount: number; // La quantità consumata per ciclo
		time: number; // La durata di un ciclo di consumo in secondi
	};

	/** (Opzionale) Un array di altri edifici e del loro tier richiesto per poter costruire/upgradare a questo livello. */
	requirements?: {
		id: string; // L'ID dell'edificio richiesto
		tier: number; // Il tier minimo richiesto per quell'edificio
	}[];
}

/**
 * Definisce un tipo di edificio nel suo complesso, contenente tutte le sue proprietà
 * statiche e un array con i dati per ogni suo tier.
 */
export interface BuildingDefinition {
	/** L'ID unico e logico dell'edificio (es: "core", "iridium_drill"). Non deve cambiare. */
	id: string;

	/** Il nome dell'edificio visualizzato nella UI (es: "Iridium Drill"). */
	name: string;

	/** La categoria a cui appartiene l'edificio. */
	category: BuildingCategory;

	icon?: string;

	/**
	 * (Opzionale) Se l'edificio deve essere piazzato su un tipo specifico di giacimento di risorse.
	 * Se non è definito, l'edificio può essere piazzato su terreno normale.
	 * Esempio: "iridium" per un estrattore di iridio.
	 */
	requiresResourceType?: ResourceId;

	/** Il nome del modello 3D presente in ReplicatedStorage. */
	model: string;

	/** La dimensione dell'edificio in celle della griglia (es: { x: 2, y: 2 }). */
	size: { x: number; y: number };

	/** Il livello massimo che questo edificio può raggiungere. */
	maxTier: number;

	/** Un array contenente i dati specifici per ogni tier di questo edificio. */
	tiers: BuildingTierData[];

	/** (Opzionale) Una breve descrizione dell'edificio mostrata nella UI. */
	description?: string;

	/** (Opzionale) Il numero massimo di questo tipo di edificio che un giocatore può costruire. */
	limit?: number;
}
