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
