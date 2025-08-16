import { Controller, OnStart } from "@flamework/core";
import { ReplicatedStorage, RunService, UserInputService, Workspace } from "@rbxts/services";
import { BUILDINGS } from "@shared/constants/building.conf";
import { PlacementService } from "@client/services/placement.service";
import { BuildingDefinition } from "@shared/interface/building.interface";
import { ClientEvents, ClientFunctions } from "@client/network";
import { PlayerDataController } from "@client/controllers/player-data.controller";
import { BuildModeController } from "@client/controllers/build-mode.controller";
import { GridUtils } from "@shared/utils/grid.utils";
import { ResourceId } from "@shared/interface/resource.interface";
import { CELL_SIZE } from "@shared/constants/grid.conf";

@Controller({})
export class BuildController implements OnStart {
	// Stato del controller
	private hologram?: Model;
	private currentBuildingDef?: BuildingDefinition;
	private lastCheckedPosition?: Vector2;
	private isLastPositionValid = false;

	private pendingPlacement = false;

	private isMoving = false;
	private movingInstanceId?: string;

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
		this.createHologram(buildingId); // 2. Crea il modello fantasma
		this.connectUpdateLoop(); // 3. Inizia ad aggiornare la posizione dell'ologramma
		this.connectPlacementInput(); // 4. Mettiti in ascolto del click per piazzare
	}

	/**
	 * Pulisce tutto e esce dalla modalità di piazzamento.
	 */
	public stopPlacement(): void {
		this.renderSteppedConnection?.Disconnect();
		this.mouseClickConnection?.Disconnect();
		this.destroyHologram();

		this.currentBuildingDef = undefined;
		this.lastCheckedPosition = undefined;
		this.isLastPositionValid = false;

		this.buildModeController.exitBuildMode();
	}

	public startMovingBuilding(buildingModel: Model) {
		// 1. Estrai le informazioni necessarie dal modello
		const buildingId = buildingModel.GetAttribute("BuildingId") as string;
		this.movingInstanceId = buildingModel.GetAttribute("InstanceId") as string;

		if (!buildingId || !this.movingInstanceId) {
			warn("Tentativo di spostare un edificio senza ID validi.");
			return;
		}

		// 2. Imposta lo stato del controller
		this.isMoving = true;
		this.currentBuildingDef = BUILDINGS.find((b) => b.id === buildingId);
		this.hologram = buildingModel; // <-- Il trucco magico! Usiamo il modello reale come ologramma.

		if (!this.currentBuildingDef) return;

		// 3. Applica un effetto "ologramma" per renderlo semi-trasparente
		this.setHologramTransparency(0.5); // Creeremo questa funzione tra poco

		// 4. Avvia il loop di aggiornamento che muove l'ologramma con il mouse
		this.connectUpdateLoop();
	}

	private setHologramTransparency(transparency: number) {
		if (!this.hologram) return;
		for (const child of this.hologram.GetDescendants()) {
			if (child.IsA("BasePart")) {
				child.Transparency = transparency;
			}
		}
	}

	/**
	 * Gestisce la logica di piazzamento effettivo.
	 */
	private placeBuilding(): void {
		if (!this.currentBuildingDef || !this.lastCheckedPosition || !this.isLastPositionValid || this.pendingPlacement)
			return;
	
		// --- INIZIA LA NUOVA LOGICA ---

		// 1. Ottieni i dati necessari
		const profile = this.playerDataController.getProfile();
		const buildingDefinition = BUILDINGS.find((b) => b.id === this.currentBuildingDef?.id);

		if (!profile || !buildingDefinition) return;

		// 2. Ottieni il costo dal tier 1
		const tierData = buildingDefinition.tiers[0];
		if (!tierData || !tierData.cost) return;

		// 3. Controlla se il giocatore ha abbastanza risorse

		this.resetHologramAppearance();

		// 4) Invia la richiesta al server
		this.pendingPlacement = true;
		ClientEvents.PlaceBuilding.fire(this.currentBuildingDef.id, this.lastCheckedPosition);
		print("[BuildController] Richiesta inviata. In attesa aggiornamento profilo...");

		// 5) Pulisci SOLO l’ologramma, resta in build mode per poter selezionare
		this.cleanupPlacementVisualsOnly();

		// 6) Attendi UNA VOLTA l'aggiornamento del profilo per sbloccare lo stato
		const disconnect = this.playerDataController.onProfileUpdated.Connect(() => {
			if (!this.pendingPlacement) return;
			this.pendingPlacement = false;
			disconnect.Disconnect();
			print("[BuildController] Profilo aggiornato: puoi selezionare e recuperare il nuovo edificio.");
		});
	}

	// --- Metodi Helper Privati ---

	private connectUpdateLoop(): void {
		this.renderSteppedConnection = RunService.RenderStepped.Connect(() => this.updateHologramPosition());
	}

	/**
	 * Mette in ascolto l'evento di click del mouse per piazzare l'edificio selezionato.
	 * Se il pulsante sinistro del mouse  stato cliccato, chiama `placeBuilding` per eseguire la logica di piazzamento effettivo.
	 */
	private connectPlacementInput(): void {
		this.mouseClickConnection = UserInputService.InputBegan.Connect((input, gameProcessed) => {
			if (gameProcessed) return;
			if (input.UserInputType === Enum.UserInputType.MouseButton1) {
				this.placeBuilding();
			}
		});
	}

	// in BuildController

	private resetHologramAppearance() {
		// Guard di base
		if (!this.hologram) return;

		const buildingId = this.hologram.GetAttribute("BuildingId") as string | undefined;
		if (!buildingId) return;

		// Lookup del nome modello via BUILDINGS
		const modelName = BUILDINGS.find((b) => b.id === buildingId)?.model;
		if (!modelName || !this.modelFolder) return;

		const templateRef = this.modelFolder.FindFirstChild(modelName);
		if (!templateRef || !templateRef.IsA("Model")) return;

		// Ripristina appearance dalle parti corrispondenti nel template
		for (const hologramPart of this.hologram.GetDescendants()) {
			if (hologramPart.IsA("BasePart") /* && hologramPart.Name !== "Bounds" */) {
				const templatePart = templateRef.FindFirstChild(hologramPart.Name, true);
				if (templatePart && templatePart.IsA("BasePart")) {
					hologramPart.Color = templatePart.Color;
					hologramPart.Transparency = templatePart.Transparency;
					hologramPart.Material = templatePart.Material;
				}
			}
		}
	}

	private createHologram(buildingId?: string): void {
		if (!this.currentBuildingDef) return;
		const modelRef = this.modelFolder?.FindFirstChild(this.currentBuildingDef.model);

		if (modelRef && modelRef.IsA("Model")) {
			this.hologram = modelRef.Clone();
			if (buildingId) this.hologram.SetAttribute("BuildingId", buildingId);
			this.hologram.Parent = Workspace;
			for (const descendant of this.hologram.GetDescendants()) {
				if (descendant.IsA("BasePart")) {
					descendant.CanCollide = false;
					descendant.Material = Enum.Material.ForceField;
				}
			}
			this.placementService.addInstanceToIgnoreList(this.hologram);

			const boundsPart = this.hologram.FindFirstChild("Bounds", true);
			if (boundsPart) {
				const surfaceGui = boundsPart.FindFirstChildOfClass("SurfaceGui");
				if (surfaceGui) {
					// Rendi visibili tutti i frame dentro la SurfaceGui
					for (const frame of surfaceGui.GetChildren()) {
						if (frame.IsA("Frame")) {
							frame.Visible = true;
						}
					}
				}
			}
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
		let finalWorldCFrame = GridUtils.gridToWorldCFrame(gridPos, buildingSize, gridCenter);

		// Solleviamo il modello in modo che la sua base appoggi sulla griglia.
		// Prendiamo l'altezza del PrimaryPart come riferimento.
		if (this.hologram.PrimaryPart) {
			const modelHeight = this.hologram.PrimaryPart.Size.Y;
			finalWorldCFrame = finalWorldCFrame.add(new Vector3(0, modelHeight / 2, 0));
		}

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

	private cleanupPlacementVisualsOnly(): void {
		this.renderSteppedConnection?.Disconnect();
		this.mouseClickConnection?.Disconnect();
		this.destroyHologram();

		this.lastCheckedPosition = undefined;
		this.isLastPositionValid = false;
		// NOTA: NON chiamare this.buildModeController.exitBuildMode() qui
	}

	private setHologramColor(isValid: boolean): void {
		if (!this.hologram) return;
		const color = isValid ? Color3.fromRGB(0, 255, 127) : Color3.fromRGB(255, 50, 50);
		// Colora le parti del modello 3D
		for (const part of this.hologram.GetDescendants()) {
			if (part.IsA("BasePart") && part.Name !== "Bounds") {
				// Escludiamo la parte Bounds
				part.Transparency = isValid ? 0.5 : 0.3; // Esempio: rendiamo il modello più o meno trasparente
				part.Color = color;
			}
		}

		// Colora i frame dell'outline
		const boundsPart = this.hologram.FindFirstChild("Bounds", true);
		if (boundsPart) {
			const surfaceGui = boundsPart.FindFirstChildOfClass("SurfaceGui");
			if (surfaceGui) {
				for (const frame of surfaceGui.GetChildren()) {
					if (frame.IsA("Frame")) {
						frame.BackgroundColor3 = color;
					}
				}
			}
		}
	}
}
