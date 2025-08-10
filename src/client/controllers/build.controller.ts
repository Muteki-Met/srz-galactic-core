import { Controller, OnStart } from "@flamework/core";
import { ReplicatedStorage, RunService, UserInputService, Workspace } from "@rbxts/services";
import { BUILDINGS } from "@shared/constants/building.conf";
import { PlacementService } from "@client/services/placement.service";
import { BuildingDefinition } from "@shared/interface/building.interface";
import { GridUtils } from "@shared/utils/grid.utils";
import { ClientFunctions } from "@shared/network";

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

	constructor(private readonly placementService: PlacementService) {}

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
					descendant.Transparency = 0.5;
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
		// TODO: Implementare la logica di raycasting per trovare la posizione
		// sulla griglia e aggiornare il CFrame dell'ologramma.
		// Qui useremo il futuro PlacementService.
		// Controlla di avere un ologramma
		if (!this.hologram || !this.buildingRef) return;

		// Chiedi al PlacementService la posizione
		const placementInfo = this.placementService.getPlacementInfo();
		const gridPos = placementInfo?.gridPosition;

		// Controlla se la nuova posizione è DIVERSA dall'ultima che abbiamo controllato
		if (
			!this.lastCheckedPosition ||
			this.lastCheckedPosition.X !== gridPos?.X ||
			this.lastCheckedPosition.Y !== gridPos?.Y
		) {
			// È una nuova cella! Memorizzala.
			this.lastCheckedPosition = gridPos;

			// ORA, e solo ora, chiama il server.
			// GlobalFunctions.ValidatePlacement.invokeServer(...) è una Promise
			// 1. Ottieni la funzione specifica che vuoi chiamare.
			ClientFunctions.ValidatePlacement.invoke(this.buildingRef.id, gridPos!).then((isValid: boolean) => {
				this.isLastPositionValid = isValid;
				this.setHologramColor(isValid);
			});
		}
		// Se abbiamo una posizione valida...
		if (placementInfo) {
			// ...calcola il CFrame del mondo usando GridUtils
			const gridPos = placementInfo.gridPosition;
			const buildingSize = new Vector2(this.buildingRef.size.x, this.buildingRef.size.y);
			const worldCFrame = GridUtils.gridToWorldCFrame(gridPos, buildingSize);

			// Sposta l'ologramma
			this.hologram.PivotTo(worldCFrame);
		}
	}

	private handlePlacementRequest(): void {
		if (!this.isBuildModeActive || !this.selectedBuildingId) return;

		print("Placement requested by player.");
		// TODO: Calcolare la posizione finale della griglia
		// TODO: Inviare la richiesta al server tramite un RemoteEvent

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
