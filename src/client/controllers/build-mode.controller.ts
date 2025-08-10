import { Controller, OnStart } from "@flamework/core";
import Signal from "@rbxts/lemon-signal";
import { UserInputService } from "@rbxts/services";

@Controller({})
export class BuildModeController implements OnStart {
	public onBuildModeEntered = new Signal<() => void>();
	public onBuildModeExited = new Signal<() => void>();
	private buildModeActive = false;

	onStart(): void {
		UserInputService.InputBegan.Connect((input, gameProcessed) => {
			if (gameProcessed) return; // Ignora se il gioco sta già usando l'input (es. chat)

			if (input.KeyCode === Enum.KeyCode.B) {
				this.toggleBuildMode();
			}
		});
	}

	public enterBuildMode(): void {
		if (this.buildModeActive) return; // Se siamo già in modalità costruzione, non fare nulla
		this.buildModeActive = true;
		this.onBuildModeEntered.Fire();
		print("[BuildModeController] Entrato in modalità costruzione (chiamata esterna).");
	}

	public exitBuildMode(): void {
		if (!this.buildModeActive) return; // Se non siamo in modalità costruzione, non fare nulla
		this.buildModeActive = false;
		this.onBuildModeExited.Fire();
		print("[BuildModeController] Uscito dalla modalità costruzione (chiamata esterna).");
	}

	// Il metodo toggle ora può usare questi nuovi metodi
	public toggleBuildMode(): void {
		if (this.buildModeActive) {
			this.exitBuildMode();
		} else {
			this.enterBuildMode();
		}
	}

	public isBuildModeActive(): boolean {
		return this.buildModeActive;
	}
}
