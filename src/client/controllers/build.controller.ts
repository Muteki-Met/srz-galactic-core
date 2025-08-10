import { Controller, OnStart } from "@flamework/core";
import { ReplicatedStorage, RunService, UserInputService, Workspace } from "@rbxts/services";
import { BUILDINGS } from "@shared/constants/building.conf";
import { PlacementService } from "@client/services/placement.service";
import { BuildingDefinition } from "@shared/interface/building.interface";
import { GridUtils } from "@shared/utils/grid.utils";
import { ClientEvents, ClientFunctions } from "@client/network";
import { PlayerDataController } from "@client/controllers/player-data.controller";

@Controller({})
export class BuildController implements OnStart {
	private isBuildModeActive = false;
	private selectedBuildingId?: string;
	private hologram?: Model;
	private buildingRef?: BuildingDefinition;
	private renderSteppedConnection?: RBXScriptConnection;

	private lastCheckedPosition?: Vector2;
	private isLastPositionValid = false; // Per ricordare se l'ultimo check era valido

	private readonly modelFolder = ReplicatedStorage.FindFirstChild("Models");

	constructor(
		private readonly placementService: PlacementService,
		private readonly playerDataController: PlayerDataController,
	) {}

	public onStart(): void {
		print("BuildController started");
		// Qui collegheremo gli eventi della UI per entrare in modalità costruzione
		// Aggiungi queste due righe per testare:
		task.wait(3); // Aspetta 3 secondi per dare tempo al gioco di caricarsi
		this.enterBuildMode("gold_mine"); // O qualsiasi altro ID di edificio
	}

	/**
	 * Activates build mode for a specific building type.
	 * @param buildingId The ID of the building to place.
	 */
	public enterBuildMode(buildingId: string): void {
		this.isBuildModeActive = true;
		this.selectedBuildingId = buildingId;
		print(`Entering build mode for: ${buildingId}`);

		// 1. Create the hologram model (logica da implementare)
		this.createHologram();

		// 2. Connect to RunService to update hologram position every frame (logica da implementare)
		this.renderSteppedConnection = RunService.RenderStepped.Connect(() => this.updateHologramPosition());
		// 3. Listen for player input to place the building (logica da implementare)
		UserInputService.InputBegan.Connect((input) => {
			if (
				input.UserInputType === Enum.UserInputType.MouseButton1 ||
				input.UserInputType === Enum.UserInputType.Touch
			) {
				this.handlePlacementRequest();
			}
		});
	}

	/**
	 * Deactivates build mode and cleans up.
	 */
	public exitBuildMode(): void {
		this.isBuildModeActive = false;
		this.selectedBuildingId = undefined;
		if (this.hologram) {
			this.hologram.Destroy();
			this.hologram = undefined;
		}
		this.renderSteppedConnection?.Disconnect();
		print("Exiting build mode");
	}

	private createHologram(): void {
		// TODO: Implementare la creazione di un modello "fantasma"
		// basato su this.selectedBuildingId. Dovrebbe essere semi-trasparente.

		this.buildingRef = BUILDINGS.find((b) => b.id === this.selectedBuildingId);
		if (!this.buildingRef) return;
		const modelRef = this.modelFolder?.FindFirstChild(this.buildingRef.model);

		// 3. Controlla se hai trovato un modello valido
		if (modelRef && modelRef.IsA("Model")) {
			// Trovato! Clona il modello.
			this.hologram = modelRef.Clone();

			this.hologram.Parent = Workspace;

			// Continua con la logica per:
			// - Impostare il Parent a Workspace
			// - Cambiare trasparenza, materiale, etc.
			// - Aggiungerlo alla ignore list del raycast
			// Cicla su tutti i discendenti del modello
			for (const descendant of this.hologram.GetDescendants()) {
				// Controlla se il discendente è una parte fisica (BasePart)
				if (descendant.IsA("BasePart")) {
					// Rendi la parte non-collidibile
					descendant.CanCollide = false;
					// Rendila semi-trasparente
					descendant.Transparency = 0.25;
					// Dagli un materiale "energetico"
					descendant.Material = Enum.Material.ForceField;
				}
			}
			this.placementService.addInstanceToIgnoreList(this.hologram);
		} else {
			// Non trovato. Stampa un avviso per il debug.
			warn(`ATTENZIONE: Modello '${this.buildingRef.model}' non trovato!`);
		}
	}

	private updateHologramPosition(): void {
		if (!this.hologram || !this.buildingRef) return;

		// 1. Ottieni le informazioni di piazzamento dal servizio
		const placementInfo = this.placementService.getPlacementInfo();
		if (!placementInfo) return; // Se non c'è una posizione, non fare nulla

		const gridPos = placementInfo.gridPosition;

		// 2. Controlla se ci siamo spostati in una nuova cella SOLO per la validazione del server
		if (
			!this.lastCheckedPosition ||
			this.lastCheckedPosition.X !== gridPos.X ||
			this.lastCheckedPosition.Y !== gridPos.Y
		) {
			this.lastCheckedPosition = gridPos;
			// Chiama il server per sapere se questa nuova cella è valida
			ClientFunctions.ValidatePlacement.invoke(this.buildingRef.id, gridPos).then((isValid: boolean) => {
				this.isLastPositionValid = isValid;
				this.setHologramColor(isValid);
			});
		}

		// 3. SPOSTA L'OLOGRAMMA OGNI FRAME, INDIPENDENTEMENTE DAL CONTROLLO PRECEDENTE

		const profile = this.playerDataController.getProfile();
		if (!profile) return;
		const coreBuilding = profile.placedBuildings.find((b) => b.buildingId === "core");
		if (!coreBuilding) return;

		const gridCenter = GridUtils.getGridCenter(profile);
		if (!gridCenter) return;

		const buildingSize = new Vector2(this.buildingRef.size.x, this.buildingRef.size.y);
		// Questa funzione ora calcola la posizione del mondo corretta,
		// tenendo già conto del centro della base.
		// Passa il gridCenter alla nostra nuova funzione
		const finalWorldCFrame = GridUtils.gridToWorldCFrame(gridPos, buildingSize, gridCenter);

		// Sposta l'ologramma direttamente al CFrame calcolato.
		this.hologram.PivotTo(finalWorldCFrame);
	}

	private handlePlacementRequest(): void {
		if (!this.isBuildModeActive || !this.buildingRef || !this.lastCheckedPosition || !this.isLastPositionValid)
			return;

		print(`Richiesta di piazzamento per ${this.buildingRef.id}`);
		// TODO: Calcolare la posizione finale della griglia
		// TODO: Inviare la richiesta al server tramite un RemoteEvent
		ClientEvents.PlaceBuilding.fire(this.buildingRef.id, this.lastCheckedPosition);
		this.exitBuildMode();
	}

	private setHologramColor(isValid: boolean): void {
		if (!this.hologram) return;

		// Scegli il colore in base alla validità
		const color = isValid ? new Color3(0, 1, 0.5) : new Color3(1, 0.2, 0.2);

		// Cicla sulle parti e applica il colore
		for (const part of this.hologram.GetDescendants()) {
			if (part.IsA("BasePart")) {
				part.Color = color;
			}
		}
	}
}
