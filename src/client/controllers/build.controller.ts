import { Controller, OnStart } from "@flamework/core";
import { ReplicatedStorage, RunService, UserInputService, Workspace } from "@rbxts/services";
import { BUILDINGS } from "@shared/constants/building.conf";
import { PlacementService } from "@client/services/placement.service";
import { BuildingDefinition } from "@shared/interface/building.interface";
import { ClientEvents, ClientFunctions } from "@client/network";
import { PlayerDataController } from "@client/controllers/player-data.controller";
import { BuildModeController } from "@client/controllers/build-mode.controller";
import { GridUtils } from "@shared/utils/grid.utils";

@Controller({})
export class BuildController implements OnStart {
	// Stato del controller
	private hologram?: Model;
	private currentBuildingDef?: BuildingDefinition;
	private lastCheckedPosition?: Vector2;
	private isLastPositionValid = false;

	// Connessioni agli eventi che dobbiamo poter disconnettere
	private renderSteppedConnection?: RBXScriptConnection;
	private mouseClickConnection?: RBXScriptConnection;

	private readonly modelFolder = ReplicatedStorage.FindFirstChild("Models");

	constructor(
		private readonly placementService: PlacementService,
		private readonly playerDataController: PlayerDataController,
		private readonly buildModeController: BuildModeController,
	) {}

	public onStart(): void {
		print("[BuildController] Started.");
		// Per ora, la UI o altri sistemi chiameranno `startPlacement`
		// Per testare, possiamo aggiungerlo qui:
		task.wait(3);
		this.startPlacement("gold_mine");
	}

	/**
	 * Punto di ingresso principale. Chiamato dalla UI quando si seleziona un edificio.
	 * @param buildingId L'ID dell'edificio da piazzare.
	 */
	public startPlacement(buildingId: string): void {
		// Se stiamo già piazzando qualcosa, fermiamo prima il processo precedente.
		if (this.hologram) {
			this.stopPlacement();
		}

		this.currentBuildingDef = BUILDINGS.find((b) => b.id === buildingId);
		if (!this.currentBuildingDef) {
			warn(`[BuildController] Tentativo di piazzare un edificio non valido: ${buildingId}`);
			return;
		}

		this.buildModeController.enterBuildMode(); // 1. Entra in modalità costruzione
		this.createHologram(); // 2. Crea il modello fantasma
		this.connectUpdateLoop(); // 3. Inizia ad aggiornare la posizione dell'ologramma
		this.connectPlacementInput(); // 4. Mettiti in ascolto del click per piazzare
	}

	/**
	 * Pulisce tutto e esce dalla modalità di piazzamento.
	 */
	private stopPlacement(): void {
		this.renderSteppedConnection?.Disconnect();
		this.mouseClickConnection?.Disconnect();
		this.destroyHologram();

		this.currentBuildingDef = undefined;
		this.lastCheckedPosition = undefined;
		this.isLastPositionValid = false;

		this.buildModeController.exitBuildMode();
	}

	/**
	 * Gestisce la logica di piazzamento effettivo.
	 */
	private placeBuilding(): void {
		if (!this.currentBuildingDef || !this.lastCheckedPosition || !this.isLastPositionValid) return;

		print(
			`[BuildController] Richiesta di piazzamento per ${this.currentBuildingDef.id} a ${this.lastCheckedPosition}`,
		);
		ClientEvents.PlaceBuilding.fire(this.currentBuildingDef.id, this.lastCheckedPosition);

		// Dopo aver inviato la richiesta, usciamo dalla modalità di piazzamento.
		this.stopPlacement();
	}

	// --- Metodi Helper Privati ---

	private connectUpdateLoop(): void {
		this.renderSteppedConnection = RunService.RenderStepped.Connect(() => this.updateHologramPosition());
	}

	private connectPlacementInput(): void {
		this.mouseClickConnection = UserInputService.InputBegan.Connect((input, gameProcessed) => {
			if (gameProcessed) return;
			if (input.UserInputType === Enum.UserInputType.MouseButton1) {
				this.placeBuilding();
			}
		});
	}

	private createHologram(): void {
		if (!this.currentBuildingDef) return;
		const modelRef = this.modelFolder?.FindFirstChild(this.currentBuildingDef.model);

		if (modelRef && modelRef.IsA("Model")) {
			this.hologram = modelRef.Clone();
			this.hologram.Parent = Workspace;
			for (const descendant of this.hologram.GetDescendants()) {
				if (descendant.IsA("BasePart")) {
					descendant.CanCollide = false;
					descendant.Material = Enum.Material.ForceField;
				}
			}
			this.placementService.addInstanceToIgnoreList(this.hologram);
		} else {
			warn(`[BuildController] Modello non trovato: ${this.currentBuildingDef.model}`);
		}
	}

	private destroyHologram(): void {
		if (this.hologram) {
			this.placementService.removeInstanceFromIgnoreList(this.hologram);
			this.hologram.Destroy();
			this.hologram = undefined;
		}
	}

	private updateHologramPosition(): void {
		if (!this.hologram || !this.currentBuildingDef) return;

		const placementInfo = this.placementService.getPlacementInfo();
		if (!placementInfo) return;

		const gridPos = placementInfo.gridPosition;
		const profile = this.playerDataController.getProfile();
		if (!profile) return;

		const gridCenter = GridUtils.getGridCenter(profile);
		if (!gridCenter) return;

		// Sposta l'ologramma ogni frame
		const buildingSize = new Vector2(this.currentBuildingDef.size.x, this.currentBuildingDef.size.y);
		const finalWorldCFrame = GridUtils.gridToWorldCFrame(gridPos, buildingSize, gridCenter);
		this.hologram.PivotTo(finalWorldCFrame);

		// Controlla la validità solo se la cella è cambiata
		if (
			!this.lastCheckedPosition ||
			this.lastCheckedPosition.X !== gridPos.X ||
			this.lastCheckedPosition.Y !== gridPos.Y
		) {
			this.lastCheckedPosition = gridPos;
			ClientFunctions.ValidatePlacement.invoke(this.currentBuildingDef.id, gridPos).then((isValid) => {
				this.isLastPositionValid = isValid;
				this.setHologramColor(isValid);
			});
		}
	}

	private setHologramColor(isValid: boolean): void {
		if (!this.hologram) return;
		const color = isValid ? Color3.fromRGB(0, 255, 127) : Color3.fromRGB(255, 50, 50);
		for (const part of this.hologram.GetDescendants()) {
			if (part.IsA("BasePart")) {
				part.Color = color;
			}
		}
	}
}
