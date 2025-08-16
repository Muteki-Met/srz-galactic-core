import { Controller, OnStart } from "@flamework/core";
import { PlayerDataController } from "@client/controllers/player-data.controller";
import { GRID_CELL_SIZE } from "@shared/constants/grid.conf";
import { ReplicatedStorage, Workspace } from "@rbxts/services";
import { GridUtils } from "@shared/utils/grid.utils";
import { BuildModeController } from "@client/controllers/build-mode.controller";

@Controller({})
export class GridRendererController implements OnStart {
	private gridContainer: Model;
	private gridModel?: Model;

	// 1. Inietta il controller dei dati
	constructor(
		private readonly playerDataController: PlayerDataController,
		private readonly buildModeController: BuildModeController,
	) {
		this.gridContainer = new Instance("Model");
		this.gridContainer.Name = "ForceFieldContainer";
		this.gridContainer.Parent = Workspace;

		// Crea una parte invisibile per ospitare gli attachments
		const attachmentHost = new Instance("Part");
		attachmentHost.Name = "AttachmentHost";
		attachmentHost.Size = new Vector3(1, 1, 1);
		attachmentHost.Transparency = 1;
		attachmentHost.Anchored = true;
		attachmentHost.CanCollide = false;
		attachmentHost.Parent = this.gridContainer;
	}

	public onStart(): void {
		// 2. Ascolta il segnale
		this.buildModeController.onBuildModeEntered.Connect(() => this.showGrid());
		this.buildModeController.onBuildModeExited.Connect(() => this.hideGrid());

		this.playerDataController.onProfileUpdated.Connect(() => {
			if (this.buildModeController.isBuildModeActive()) {
				// Dovrai aggiungere un getter per questo
				this.showGrid();
			}
		});
	}

	private showGrid(): void {
		this.hideGrid();
	}

	private hideGrid(): void {
		this.gridContainer.ClearAllChildren();
	}
}
