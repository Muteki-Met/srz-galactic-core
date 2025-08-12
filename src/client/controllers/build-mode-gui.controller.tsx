// in src/client/controllers/build-mode-gui.controller.tsx
import React from "@rbxts/react";
import { Controller, OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import { createRoot, Root } from "@rbxts/react-roblox"; // <-- 1. Importa dal nuovo pacchetto

import { ResourceBar } from "client/components/ResourceBar";
import { PlayerDataController } from "./player-data.controller";
import { BuildModeController } from "./build-mode.controller";
import { BuildModeButton } from "@client/components/BuildModeButton";

//import { BuildModeButton } from "client/components/BuildModeButton"; // <-- 2. Importa il pulsante

@Controller({})
export class BuildModeGuiController implements OnStart {
	private root?: Root; // <-- 3. Il tipo corretto è 'Root'

	constructor(
		private readonly buildModeController: BuildModeController,
		private readonly playerDataController: PlayerDataController,
	) {
	}

	public onStart(): void {
		const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;
		const app = new Instance("ScreenGui");
		app.Name = "ReactApp";
		app.Parent = playerGui;

		// 4. Usa il nuovo metodo: createRoot() e root.render()
		const root = createRoot(app);
		this.root = root; // Salva la root per poterla smontare in futuro se necessario

		root.render(
			<React.StrictMode>
				<ResourceBar playerDataController={this.playerDataController} />
				<BuildModeButton buildModeController={this.buildModeController} />
			</React.StrictMode>,
		);
		

		print("[BuildModeGuiController] Componenti React montati correttamente.");
	}
}

/*
// in src/client/controllers/build-mode-gui.controller.ts
import { Controller, OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import { BuildModeController } from "./build-mode.controller"; // Importa il controller principale

@Controller({})
export class BuildModeGuiController implements OnStart {
	constructor(private readonly buildModeController: BuildModeController) {}

	public onStart(): void {
		const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;
		const buildModeGui = playerGui.WaitForChild("BuildModeGui") as ScreenGui;
		const frame = buildModeGui.WaitForChild("Frame_Bottom_Right") as Frame;
		const buildButton = frame.WaitForChild("BuildModeButton") as TextButton;

		// Quando il pulsante viene cliccato...
		buildButton.MouseButton1Click.Connect(() => {
			// ...chiama il metodo del controller principale.
			this.buildModeController.toggleBuildMode();
		});

		this.buildModeController.onBuildModeEntered.Connect(() => {
			buildButton.Text = "Esci";
			// Potresti anche cambiare il colore qui! Es:
			// buildButton.BackgroundColor3 = Color3.fromRGB(200, 50, 50); // Rosso
		});

		this.buildModeController.onBuildModeExited.Connect(() => {
			buildButton.Text = "Costruisci";
			// E resettare il colore
			// buildButton.BackgroundColor3 = Color3.fromRGB(50, 100, 200); // Blu
		});

		// Imposta il testo iniziale corretto all'avvio
		if (this.buildModeController.isBuildModeActive()) {
			buildButton.Text = "Esci";
		} else {
			buildButton.Text = "Costruisci";
		}

		print("[BuildModeGuiController] Pulsante di costruzione collegato.");
	}
}
*/
