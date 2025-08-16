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
import { ResourceId } from "@shared/interface/resource.interface";
import { HttpService, Workspace } from "@rbxts/services";

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

			// 1. Ottieni il profilo e la definizione dell'edificio
			const profile = this.playerDataService.getPlayerData(player); // Usa getProfile, non getPlayerData
			if (!profile) return;

			const inventoryItem = profile.inventory.find((item) => item.buildingId === buildingId);

			// Se non troviamo l'oggetto nell'inventario O se la quantità è zero, il piazzamento non è valido.
			if (!inventoryItem || inventoryItem.count <= 0) {
				print(`[GridService] Piazzamento fallito: ${player.Name} non ha un ${buildingId} nel suo inventario.`);
				// Magari invia una notifica al giocatore
				return;
			}

			const buildingDefinition = BUILDINGS.find((b) => b.id === buildingId);
			if (!buildingDefinition) return;

			if (buildingDefinition.category === "core") {
				// Controlla se il giocatore ha già un Core piazzato
				const hasCore = profile.placedBuildings.some(
					(placed) => this.getBuildingDefinition(placed.buildingId)?.category === "core",
				);

				if (hasCore) {
					warn(`[GridService] ${player.Name} ha tentato di piazzare un secondo Core. Richiesta rifiutata.`);
					return; // Rifiuta il piazzamento
				}
			}

			// 2. Ottieni i dati del tier 1
			const tierData = buildingDefinition.tiers[0];
			if (!tierData || !tierData.cost) {
				warn(`[GridService] Dati di costo non trovati per ${buildingId}`);
				return;
			}

			// 3. Controlla le risorse

			// 4. Controlla se l'area è disponibile (spostato prima della deduzione delle risorse)
			const gridPosition = { x: position.X, y: position.Y };
			if (!this.isAreaAvailable(profile, buildingId, gridPosition)) {
				warn("Piazzamento non valido! Il client potrebbe essere desincronizzato.");
				return;
			}

			// 5. Se tutti i controlli sono superati, SOTTRAI le risorse
			print(`[GridService] Risorse sufficienti. Sottraggo il costo per ${player.Name}`);
			for (const [resourceId, requiredAmount] of pairs(tierData.cost)) {
				profile.resources[resourceId as ResourceId] -= requiredAmount;
			}

			// 6. Aggiungi l'edificio al profilo
			const newBuilding: PlacedBuilding = {
				instanceId: HttpService.GenerateGUID(false),
				buildingId: buildingId,
				tier: 1,
				position: gridPosition,
				status: "built",
			};
			profile.placedBuildings.push(newBuilding);
			print(`Dati aggiornati per ${player.Name}. Edifici totali: ${profile.placedBuildings.size()}`);

			// 7. Crea il modello fisico
			const gridCenter = GridUtils.getGridCenter(profile);
			if (!gridCenter) return;
			this.buildingService.createBuildingModel(
				player,
				newBuilding.instanceId,
				buildingId,
				position, // La posizione (Vector2) che arriva dall'evento
				gridCenter,
			);

			inventoryItem.count -= 1;

			print(`[GridService] ${buildingId} piazzato. Quantità rimanente: ${inventoryItem.count}`);

			this.playerDataService.updateAndNotifyClient(player, profile);
		});

		ServerEvents.SalvageBuilding.connect((player, instanceId) => {
			print(`[Server] Ricevuta richiesta di recupero da ${player.Name} per ${instanceId}`);

			const profile = this.playerDataService.getPlayerData(player);
			if (!profile) return;

			// Trova l'indice dell'edificio da rimuovere
			const buildingIndex = profile.placedBuildings.findIndex((b) => b.instanceId === instanceId);
			if (buildingIndex === -1) {
				return;
			}

			// Rimuovi l'edificio dall'array e tienine una copia
			const removedBuilding = profile.placedBuildings.remove(buildingIndex);
			if (!removedBuilding) return;

			// Aggiungi l'edificio all'inventario
			const inventoryItem = profile.inventory.find((i) => i.buildingId === removedBuilding.buildingId);
			if (inventoryItem) {
				inventoryItem.count += 1;
			} else {
				// Se per qualche motivo non c'era, lo aggiungiamo
				profile.inventory.push({ buildingId: removedBuilding.buildingId, count: 1 });
			}

			// Distruggi il modello 3D
			const buildingModel = Workspace.FindFirstChild(instanceId); // Assumendo che il modello abbia questo nome
			if (buildingModel) {
				buildingModel.Destroy();
			} else {
				// Se non lo troviamo per nome, dobbiamo trovare un altro modo...
				// Per ora, questo dovrebbe funzionare se il nome del modello è l'instanceId
			}

			// Notifica il client
			this.playerDataService.updateAndNotifyClient(player, profile);
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
			// Se l'edificio NON richiede una risorsa...
			const targetNode = this.resourceNodeService.getNodeAtPosition(newPosition);
			if (targetNode) {
				print("Validazione fallita: Non puoi costruire edifici normali sui giacimenti.");
				return false;
			}

			// --- NUOVO CONTROLLO: BUFFER ZONE ---
			const BUFFER_SIZE = 1; // Definisci una zona cuscinetto di 2 caselle

			// Per ogni nodo risorsa sulla mappa...
			for (const node of this.resourceNodeService.getAllNodes()) {
				// ...crea un rettangolo "gonfiato" che include la buffer zone.
				const bufferedNodeRect = {
					minX: node.position.x - BUFFER_SIZE,
					minY: node.position.y - BUFFER_SIZE,
					maxX: node.position.x + node.size.x + BUFFER_SIZE,
					maxY: node.position.y + node.size.y + BUFFER_SIZE,
				};

				// Crea il rettangolo del nuovo edificio (questo codice esiste già più sotto, lo anticipiamo qui)
				const newBuildingRect = {
					minX: newPosition.x,
					minY: newPosition.y,
					maxX: newPosition.x + buildingDef.size.x,
					maxY: newPosition.y + buildingDef.size.y,
				};

				// Controlla se il nuovo edificio si scontra con l'area bufferizzata del nodo.
				if (
					newBuildingRect.minX < bufferedNodeRect.maxX &&
					newBuildingRect.maxX > bufferedNodeRect.minX &&
					newBuildingRect.minY < bufferedNodeRect.maxY &&
					newBuildingRect.maxY > bufferedNodeRect.minY
				) {
					print(`Validazione fallita: Troppo vicino al giacimento ${node.id}.`);
					return false; // Collisione con la buffer zone
				}
			}
			// --- FINE DEL NUOVO CONTROLLO ---
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
