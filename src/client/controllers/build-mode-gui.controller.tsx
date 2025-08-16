// in src/client/controllers/build-mode-gui.controller.tsx
import React from "@rbxts/react";
import { Controller, OnStart } from "@flamework/core";
import { Players, UserInputService, Workspace } from "@rbxts/services";
import { createRoot, Root } from "@rbxts/react-roblox"; // <-- 1. Importa dal nuovo pacchetto

import { ResourceBar } from "client/components/ResourceBar";
import { PlayerDataController } from "./player-data.controller";
import { BuildModeController } from "./build-mode.controller";
import { BuildModeButton } from "@client/components/BuildModeButton";
import { BuildMenu } from "@client/components/BuildMenu";
import { BuildingActions } from "@client/components/BuildingActions";
import { BuildController } from "@client/controllers/build.controller";
import { ClientEvents } from "@client/network";

//import { BuildModeButton } from "client/components/BuildModeButton"; // <-- 2. Importa il pulsante

@Controller({})
export class BuildModeGuiController implements OnStart {
	private root?: Root; // <-- 3. Il tipo corretto è 'Root'
	private inputConnection?: RBXScriptConnection;
	private selectedBuilding?: Model;
	private app?: Instance;

	constructor(
		private readonly buildModeController: BuildModeController,
		private readonly playerDataController: PlayerDataController,
		private readonly buildController: BuildController,
	) {}

	public onStart(): void {
		// Collega la nostra funzione all'evento di input
		this.inputConnection = UserInputService.InputBegan.Connect((input, gameProcessed) => {
			this.onInputBegan(input, gameProcessed);
		});

		const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;
		this.app = new Instance("ScreenGui");
		this.app.Name = "SRZ-Gui";
		this.app.Parent = playerGui;

		this.buildModeController.onBuildModeExited.Connect(() => {
			print("[BuildModeGuiController] Uscito dalla modalità costruzione, nascondo il menu azioni.");
			// Se c'è un edificio selezionato, deselezioniamolo
			if (this.selectedBuilding) {
				this.selectedBuilding = undefined;
				this.renderUI(); // Ri-renderizza la UI per far sparire il menu
			}
		});

		/*		root.render(
					<React.StrictMode>
						<ResourceBar playerDataController={this.playerDataController} />
						<BuildModeButton buildModeController={this.buildModeController} />
						<BuildMenu
							buildModeController={this.buildModeController}
							playerDataController={this.playerDataController}
							buildController={this.buildController}
						/>
					</React.StrictMode>,
				);*/
		this.renderUI();
		print("[BuildModeGuiController] Componenti React montati correttamente.");
	}

	private onInputBegan(input: InputObject, gameProcessed: boolean) {
		if (
			gameProcessed ||
			!this.buildModeController.isBuildModeActive() ||
			input.UserInputType !== Enum.UserInputType.MouseButton1
		) {
			return;
		}

		const raycastResult = this.performRaycast(); // Funzione che fa il raycast dal mouse
		if (raycastResult && raycastResult.Instance) {
			const buildingModel = this.findBuildingModelFromHit(raycastResult.Instance);
			if (buildingModel && buildingModel.GetAttribute("OwnerUserId") === Players.LocalPlayer.UserId) {
				// Evita di riselezionare lo stesso edificio
				if (this.selectedBuilding === buildingModel) return;

				print(`Hai cliccato sul tuo edificio! ID: ${buildingModel.GetAttribute("BuildingId")}`);
				this.selectedBuilding = buildingModel;
				this.renderUI();
				return; // Esci, abbiamo finito
			}
		}

		// Se arriviamo qui, significa che abbiamo cliccato sul terreno o su un edificio non nostro.
		// In ogni caso, deselezioniamo tutto.
		this.selectedBuilding = undefined;
		this.renderUI();

		// Qui, in futuro, mostreremo la UI di "Sposta/Recupera"
	}

	private renderUI(): void {
		if (!this.app) return;

		const root = createRoot(this.app);
		root.render(
			<React.StrictMode>
				<ResourceBar playerDataController={this.playerDataController} />
				<BuildModeButton buildModeController={this.buildModeController} />
				<BuildMenu
					buildModeController={this.buildModeController}
					playerDataController={this.playerDataController}
					buildController={this.buildController}
				/>
				{/* Ecco dove passiamo il modello selezionato! */}
				<BuildingActions
					selectedBuildingModel={this.selectedBuilding}
					onClose={() => {
						this.selectedBuilding = undefined;
						this.renderUI();
					}}
					onSalvage={(instanceId) => {
						print(`Recupera: ${instanceId}`);
						ClientEvents.SalvageBuilding.fire(instanceId);
						// Dopo aver inviato la richiesta, nascondiamo subito il menu
						this.selectedBuilding = undefined;
						this.renderUI();
					}}
					/*onMove={(instanceId) => {
						// 1. Prendi una copia del modello da spostare
						const buildingToMove = this.selectedBuilding;
						if (!buildingToMove) return;

						// 2. Nascondi il menu delle azioni deselezionando l'edificio
						this.selectedBuilding = undefined;
						this.renderUI();

						// 3. Passa il controllo al BuildController
						this.buildController.startMovingBuilding(buildingToMove);
					}}*/
				/>
			</React.StrictMode>,
		);
	}

	private performRaycast(): RaycastResult | undefined {
		const mouseLocation = UserInputService.GetMouseLocation();
		const camera = Workspace.CurrentCamera;
		if (!camera) return;

		// Crea un raggio dalla camera che passa per il mouse
		const ray = camera.ScreenPointToRay(mouseLocation.X, mouseLocation.Y);

		// Imposta i parametri del raggio
		const raycastParams = new RaycastParams();
		raycastParams.FilterType = Enum.RaycastFilterType.Exclude;
		// Aggiungi qui le cose da ignorare (es: il personaggio del giocatore)
		raycastParams.FilterDescendantsInstances = [Players.LocalPlayer.Character!];

		// Lancia il raggio e restituisci il risultato
		return Workspace.Raycast(ray.Origin, ray.Direction.mul(1000), raycastParams);
	}

	private findBuildingModelFromHit(hitPart: BasePart): Model | undefined {
		let current: Instance | undefined = hitPart;

		// Continua a salire fino a quando non trovi un modello con l'attributo giusto
		// o fino a quando non raggiungi la cima (Workspace)
		while (current && current !== Workspace) {
			if (current.IsA("Model") && current.GetAttribute("BuildingId") !== undefined) {
				// Trovato! È un modello di edificio.
				return current;
			}
			// Se non è quello giusto, passa al genitore
			current = current.Parent;
		}

		// Se siamo arrivati qui, non abbiamo trovato nessun modello di edificio
		return undefined;
	}
}
