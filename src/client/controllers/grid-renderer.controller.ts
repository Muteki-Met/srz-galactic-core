import { Controller, OnStart } from "@flamework/core";
import { PlayerDataController } from "@client/controllers/player-data.controller";
import { CORE_TIERS, GRID_CELL_SIZE } from "@shared/constants/grid.conf";
import { Workspace } from "@rbxts/services";
import { GridUtils } from "@shared/utils/grid.utils";
import { BuildModeController } from "@client/controllers/build-mode.controller";

@Controller({})
export class GridRendererController implements OnStart {
	private gridContainer: Model;

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

		const attachmentHost = new Instance("Part");
		attachmentHost.Name = "AttachmentHost";
		attachmentHost.Size = new Vector3(1, 1, 1);
		attachmentHost.Transparency = 1;
		attachmentHost.Anchored = true;
		attachmentHost.CanCollide = false;
		attachmentHost.Parent = this.gridContainer;

		const profile = this.playerDataController.getProfile();
		if (!profile) return;

		const coreTierInfo = CORE_TIERS.find((t) => t.tier === profile.coreTier);
		if (!coreTierInfo) return;

		const gridSizeInStuds = coreTierInfo.gridSize;
		const gridCenter = GridUtils.getGridCenter(profile);
		if (!gridCenter) return;

		if (!attachmentHost) return;

		const halfGrid = gridSizeInStuds / 2;
		const fieldHeight = 8;

		// Definiamo i 4 angoli della base
		const corners = [
			gridCenter.add(new Vector3(-halfGrid, 0, -halfGrid)),
			gridCenter.add(new Vector3(halfGrid, 0, -halfGrid)),
			gridCenter.add(new Vector3(halfGrid, 0, halfGrid)),
			gridCenter.add(new Vector3(-halfGrid, 0, halfGrid)),
		];

		const createBeam = (startPos: Vector3, endPos: Vector3) => {
			// Mettiamo gli attachments nell'ospite, non nel model!
			const att0 = new Instance("Attachment", attachmentHost);
			att0.WorldPosition = startPos;
			const att1 = new Instance("Attachment", attachmentHost);
			att1.WorldPosition = endPos;

			const beam = new Instance("Beam");
			beam.Attachment0 = att0;
			beam.Attachment1 = att1;
			beam.Color = new ColorSequence(Color3.fromRGB(0, 200, 255), Color3.fromRGB(100, 255, 255));
			beam.LightEmission = 0.8;
			beam.Transparency = new NumberSequence([
				new NumberSequenceKeypoint(0, 0.4),
				new NumberSequenceKeypoint(1, 0.8),
			]);
			beam.Width0 = 0.3;
			beam.Width1 = 0.3;
			beam.Parent = attachmentHost; // Anche il beam va nell'ospite
		};

		// Creiamo i pali verticali e le barre orizzontali
		for (let i = 0; i < corners.size(); i++) {
			const startCorner = corners[i];
			const endCorner = corners[(i + 1) % corners.size()];
			const startCornerTop = startCorner.add(new Vector3(0, fieldHeight, 0));
			const endCornerTop = endCorner.add(new Vector3(0, fieldHeight, 0));

			createBeam(startCorner, startCornerTop); // Palo verticale
			createBeam(startCornerTop, endCornerTop); // Barra orizzontale
		}
	}

	private hideGrid(): void {
		this.gridContainer.ClearAllChildren();
	}
}
