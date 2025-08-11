// in src/shared/constants/building.conf.ts
import { BuildingDefinition } from "@shared/interface/building.interface";

export const BUILDINGS: BuildingDefinition[] = [
	{
		id: "core",
		name: "Core",
		category: "core",
		model: "Core",
		size: { x: 5, y: 5 },
		maxTier: 5,
		description: "Il cuore della tua base. Ogni upgrade sblocca nuove strutture e aumenti dimensionali.",
		tiers: [
			{ tier: 1, cost: {}, buildTime: 0, hitpoints: 1000 },
			{ tier: 2, cost: { ferronoxite: 10000 }, buildTime: 1200, hitpoints: 3000, unlocksAtLevel: 2 },
			{ tier: 3, cost: { ferronoxite: 50000 }, buildTime: 3600, hitpoints: 6000, unlocksAtLevel: 3 },
			{ tier: 4, cost: { ferronoxite: 150000 }, buildTime: 7200, hitpoints: 12000, unlocksAtLevel: 4 },
			{ tier: 5, cost: { ferronoxite: 500000 }, buildTime: 14400, hitpoints: 25000, unlocksAtLevel: 5 },
		],
	},
	{
		id: "ferronoxite_extractor", // ID corretto
		name: "Ferronoxite Extractor", // Nome corretto
		category: "resource",
		requiresResourceType: "ferronoxite",
		model: "Drill",
		size: { x: 2, y: 2 },
		maxTier: 6,
		description: "Estrae Ferronoxite grezza, una lega metallica essenziale per tutte le costruzioni.",
		tiers: [
			{
				tier: 1,
				cost: { ferronoxite: 100 },
				buildTime: 30,
				hitpoints: 500,
				resource: { type: "ferronoxite", amount: 10, time: 5 },
			},
		],
	},
	{
		id: "voltherium_condenser", // ID corretto
		name: "Voltherium Condenser", // Nome corretto
		category: "resource",
		requiresResourceType: "voltherium", // Logica corretta: richiede un giacimento di Voltherium
		model: "Siphon",
		size: { x: 2, y: 2 },
		maxTier: 6,
		description: "Raccoglie e stabilizza Voltherium, un gas energetico necessario per la produzione avanzata.",
		tiers: [
			{
				tier: 1,
				cost: { ferronoxite: 150 },
				buildTime: 45,
				hitpoints: 600,
				resource: { type: "voltherium", amount: 5, time: 5 }, // Logica corretta: produce Voltherium
			},
		],
	},
	{
		id: "silphite_refinery", // ID corretto
		name: "Silphite Refinery", // Nome corretto
		category: "resource",
		model: "Foundry",
		size: { x: 3, y: 3 },
		maxTier: 4,
		description:
			"Utilizza Voltherium per raffinare cristalli di Silphite, usati nei microchip e nelle tecnologie avanzate.",
		tiers: [
			{
				tier: 1,
				// Costa Ferronoxite e Voltherium
				cost: { ferronoxite: 500, voltherium: 100 },
				buildTime: 120,
				hitpoints: 800,
				consumes: { type: "voltherium", amount: 2, time: 10 }, // Logica corretta: consuma Voltherium
				resource: { type: "silphite", amount: 1, time: 10 }, // Logica corretta: produce Silphite
			},
		],
	},
];

export const CORE_REF = BUILDINGS.find((b) => b.id === "core")!;
