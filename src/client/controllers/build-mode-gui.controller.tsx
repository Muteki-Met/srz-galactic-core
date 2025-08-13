// in src/client/controllers/build-mode-gui.controller.tsx
import React from "@rbxts/react";
import { Controller, OnStart } from "@flamework/core";
import { Players } from "@rbxts/services";
import { createRoot, Root } from "@rbxts/react-roblox"; // <-- 1. Importa dal nuovo pacchetto

import { ResourceBar } from "client/components/ResourceBar";
import { PlayerDataController } from "./player-data.controller";
import { BuildModeController } from "./build-mode.controller";
import { BuildModeButton } from "@client/components/BuildModeButton";
import { BuildMenu } from "@client/components/BuildMenu";
import { BuildController } from "@client/controllers/build.controller";

//import { BuildModeButton } from "client/components/BuildModeButton"; // <-- 2. Importa il pulsante

@Controller({})
export class BuildModeGuiController implements OnStart {
	private root?: Root; // <-- 3. Il tipo corretto è 'Root'

	constructor(
		private readonly buildModeController: BuildModeController,
		private readonly playerDataController: PlayerDataController,
		private readonly buildController: BuildController,
	) {}

	public onStart(): void {
		const playerGui = Players.LocalPlayer.WaitForChild("PlayerGui") as PlayerGui;
		const app = new Instance("ScreenGui");
		app.Name = "SRZ-Gui";
		app.Parent = playerGui;

		// 4. Usa il nuovo metodo: createRoot() e root.render()
		const root = createRoot(app);
		this.root = root; // Salva la root per poterla smontare in futuro se necessario

		root.render(
			<React.StrictMode>
				<ResourceBar playerDataController={this.playerDataController} />
				<BuildModeButton buildModeController={this.buildModeController} />
				<BuildMenu
					buildModeController={this.buildModeController}
					playerDataController={this.playerDataController}
					buildController={this.buildController}
				/>
			</React.StrictMode>,
		);

		print("[BuildModeGuiController] Componenti React montati correttamente.");
	}
}
