import { OnStart, Service } from "@flamework/core";
import { BUILDINGS } from "@shared/constants/building.conf";
import { CORE_TIERS } from "@shared/constants/grid.conf";
import { BuildingDefinition } from "@shared/interface/building.interface";
import { PlacedBuilding, PlayerProfile } from "@shared/interface/player.interface";
import { ServerEvents, ServerFunctions } from "@server/network";
import { BuildingService } from "@server/services/building.service";
import { PlayerDataService } from "@server/services/player-data.service";
import { GridUtils } from "@shared/utils/grid.utils";
import { ResourceNodeService } from "@server/services/resource-node.service";

/**
 * A service for managing grid logic such as placing and validating building positions.
 * This service is server-side and authoritative.
 */
@Service({})
export class GridService implements OnStart {
	constructor(
		private readonly buildingService: BuildingService,
		private readonly playerDataService: PlayerDataService,
		private readonly resourceNodeService: ResourceNodeService,
	) {}

	onStart(): void {
		// Dentro onStart()
		ServerFunctions.ValidatePlacement.setCallback((player, buildingId, position) => {
			const playerData = this.playerDataService.getPlayerData(player);
			if (!playerData) return false;

			const gridPosition = { x: position.X, y: position.Y };
			return this.isAreaAvailable(playerData, buildingId, gridPosition);
		});
		ServerEvents.PlaceBuilding.connect((player, buildingId, position) => {
			print(`[Server] Ricevuta richiesta di PIAZZAMENTO da ${player.Name}`);

			const playerData = this.playerDataService.getPlayerData(player);
			if (!playerData) return;

			const gridPosition = { x: position.X, y: position.Y };
			if (this.isAreaAvailable(playerData, buildingId, gridPosition)) {
				print("Piazzamento valido! Aggiorno i dati...");
				// ---> INIZIA LA NUOVA LOGICA <---
				const playerData = this.playerDataService.getPlayerData(player);
				if (!playerData) return;

				const gridCenter = GridUtils.getGridCenter(playerData);
				if (!gridCenter) return;
				this.buildingService.createBuildingModel(buildingId, position, gridCenter);
				// QUI, in futuro, modificheremo l'array playerData.placedBuildings
				// ---> INIZIA LA NUOVA LOGICA QUI <---
				const newBuilding: PlacedBuilding = {
					instanceId: `${buildingId}_${os.time()}`, // Un ID unico temporaneo
					buildingId: buildingId,
					tier: 1,
					position: gridPosition,
					status: "built",
				};
				playerData.placedBuildings.push(newBuilding);
				print(`Dati aggiornati per ${player.Name}. Edifici totali: ${playerData.placedBuildings.size()}`);
			} else {
				warn("Piazzamento non valido! Il client potrebbe essere desincronizzato.");
			}
		});
	}

	/**
	 * Retrieves the configuration for a specific building by its ID.
	 * @param buildingId The ID of the building.
	 * @returns The building definition or undefined if not found.
	 */
	public getBuildingDefinition(buildingId: string): BuildingDefinition | undefined {
		return BUILDINGS.find((b) => b.id === buildingId);
	}

	/**
	 * Checks if a given rectangular area is available for placing a new building.
	 * It checks for out-of-bounds and collisions with other buildings.
	 *
	 * @param playerData The player's data containing placed buildings and core tier.
	 * @param newBuildingId The ID of the new building to be placed.
	 * @param newPosition The desired top-left position for the new building.
	 * @returns `true` if the area is available, `false` otherwise.
	 */
	public isAreaAvailable(
		playerData: PlayerProfile,
		newBuildingId: string,
		newPosition: { x: number; y: number },
	): boolean {
		const buildingDef = this.getBuildingDefinition(newBuildingId);
		if (!buildingDef) {
			warn(`[GridService] Attempted to check placement for invalid buildingId: ${newBuildingId}`);
			return false;
		}

		if (buildingDef.requiresResourceType) {
			// Questo è un estrattore, ha bisogno di un nodo risorsa.
			const targetNode = this.resourceNodeService.getNodeAtPosition(newPosition);

			// Regola 1: Deve essere piazzato su un nodo.
			if (!targetNode) {
				print("Validazione fallita: Deve essere piazzato su un giacimento.");
				return false;
			}

			// Regola 2: Il tipo di risorsa deve corrispondere.
			if (targetNode.resourceType !== buildingDef.requiresResourceType) {
				print(
					`Validazione fallita: Tipo di risorsa errato. Richiesto ${buildingDef.requiresResourceType}, trovato ${targetNode.resourceType}.`,
				);
				return false;
			}

			// Regola 3: L'estrattore deve entrare completamente nel giacimento.
			if (
				newPosition.x < targetNode.position.x ||
				newPosition.y < targetNode.position.y ||
				newPosition.x + buildingDef.size.x > targetNode.position.x + targetNode.size.x ||
				newPosition.y + buildingDef.size.y > targetNode.position.y + targetNode.size.y
			) {
				print("Validazione fallita: L'estrattore non entra nel giacimento.");
				return false;
			}

			// Se tutte le regole per le risorse sono passate,
			// dobbiamo comunque controllare che non ci siano ALTRI edifici sopra.
			// La logica di collisione esistente qui sotto farà proprio questo.
		} else {
			// Se l'edificio NON richiede una risorsa, non può essere piazzato su un nodo.
			const targetNode = this.resourceNodeService.getNodeAtPosition(newPosition);
			if (targetNode) {
				print("Validazione fallita: Non puoi costruire edifici normali sui giacimenti.");
				return false;
			}
		}

		const coreTierInfo = CORE_TIERS.find((t) => t.tier === playerData.coreTier);
		const maxGridSize = coreTierInfo ? coreTierInfo.gridSize : 0;
		const newBuildingSize = buildingDef.size;

		// 1. Boundary Check: Ensure the building is within the player's grid limits.
		if (
			newPosition.x < 0 ||
			newPosition.y < 0 ||
			newPosition.x + newBuildingSize.x > maxGridSize ||
			newPosition.y + newBuildingSize.y > maxGridSize
		) {
			return false; // Out of bounds
		}

		// 2. Collision Check: Ensure it doesn't overlap with existing buildings.
		const newRect = {
			minX: newPosition.x,
			minY: newPosition.y,
			maxX: newPosition.x + newBuildingSize.x,
			maxY: newPosition.y + newBuildingSize.y,
		};

		for (const placed of playerData.placedBuildings) {
			const placedDef = this.getBuildingDefinition(placed.buildingId);
			if (!placedDef) continue; // Should not happen with clean data

			const placedRect = {
				minX: placed.position.x,
				minY: placed.position.y,
				maxX: placed.position.x + placedDef.size.x,
				maxY: placed.position.y + placedDef.size.y,
			};

			// AABB collision detection
			if (
				newRect.minX < placedRect.maxX &&
				newRect.maxX > placedRect.minX &&
				newRect.minY < placedRect.maxY &&
				newRect.maxY > placedRect.minY
			) {
				return false; // Collision detected
			}
		}

		return true; // Area is available
	}
}
