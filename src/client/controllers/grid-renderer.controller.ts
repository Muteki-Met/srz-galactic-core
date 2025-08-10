import { Controller, OnStart } from "@flamework/core";
import { PlayerDataController } from "@client/controllers/player-data.controller";
import { GRID_CELL_SIZE } from "@shared/constants/grid.conf";
import { Workspace } from "@rbxts/services";
import { GridUtils } from "@shared/utils/grid.utils";

@Controller({})
export class GridRendererController implements OnStart {
	// 1. Inietta il controller dei dati
	constructor(private readonly playerDataController: PlayerDataController) {}

	public onStart(): void {
		// 2. Ascolta il segnale
		this.playerDataController.onProfileLoaded.Connect(() => {
			print("[GridRendererController] Profilo caricato, disegno la griglia...");

			const profile = this.playerDataController.getProfile();
			if (!profile) return; // Controllo di sicurezza

			// 3. Trova il core
			const coreBuilding = profile.placedBuildings.find((b) => b.buildingId === "core");
			if (!coreBuilding) return; // Altro controllo

			// 4. Calcola dimensione e centro

			const gridSize = GridUtils.getGridSize(profile);
			if (!gridSize) return;
			const gridCenter = GridUtils.getGridCenter(profile);
			if (!gridCenter) return;
			// 5. Disegna la griglia (la logica dei for loop va qui)
			//    Ricorda di usare `gridSize` e di aggiungere `gridCenter` alle posizioni delle linee.
			// Esempio per una linea verticale:
			// line.Position = gridCenter.add(new Vector3(x, 0, 0));
			// --- Preparazione ---

			// Creiamo un modello per contenere la nostra griglia
			const gridModel = new Instance("Model");
			gridModel.Name = "VisualGrid";
			gridModel.Parent = Workspace;

			// --- Disegno delle Linee con i Beams ---
			const beamHolder = new Instance("Part"); // Un pezzo invisibile per ospitare gli attachments
			beamHolder.Size = new Vector3(1, 1, 1);
			beamHolder.Transparency = 1;
			beamHolder.Anchored = true;
			beamHolder.CanCollide = false;
			beamHolder.Parent = gridModel;

			const halfGrid = gridSize / 2;

			// Funzione di aiuto per creare un beam
			const createBeam = (startPos: Vector3, endPos: Vector3) => {
				const att0 = new Instance("Attachment", beamHolder);
				att0.WorldPosition = startPos;
				const att1 = new Instance("Attachment", beamHolder);
				att1.WorldPosition = endPos;

				const beam = new Instance("Beam");
				beam.Attachment0 = att0;
				beam.Attachment1 = att1;
				beam.Color = new ColorSequence(
					Color3.fromRGB(255, 57, 100), // Blu-Turchese
					new Color3(0.7, 0.3, 1), // Viola tenue
				);
				beam.Transparency = new NumberSequence([
					new NumberSequenceKeypoint(0, 0.5),
					new NumberSequenceKeypoint(0.5, 0.15),
					new NumberSequenceKeypoint(1, 0.5),
				]);
				beam.Width0 = 0.15;
				beam.Width1 = 0.15;
				beam.LightEmission = 0.6;
				beam.LightInfluence = 0;
				beam.Texture = "rbxassetid://446111271"; // Laser sottile più pulito
				beam.TextureMode = Enum.TextureMode.Wrap;
				beam.TextureLength = 1;
				beam.TextureSpeed = 0.3; // Lenta animazione
				beam.FaceCamera = true;
				beam.Parent = beamHolder;
			};

			const createIntersectionSphere = (pos: Vector3) => {
				const sphere = new Instance("Part");
				sphere.Shape = Enum.PartType.Ball;
				sphere.Size = new Vector3(0.35, 0.35, 0.35);
				sphere.Position = pos.add(new Vector3(0, 0.05, 0)); // Leggermente sopra la griglia
				sphere.Anchored = true;
				sphere.CanCollide = false;
				sphere.Material = Enum.Material.Plastic;
				sphere.Color = Color3.fromRGB(255, 57, 100); // Blu-Turchese neon
				sphere.Parent = gridModel;
			};

			// Disegna le linee verticali
			for (let i = 0; i <= gridSize; i++) {
				const x = i * GRID_CELL_SIZE;
				const z = gridSize * GRID_CELL_SIZE;
				const lStart = gridCenter.add(new Vector3(x, 0, 0));
				const lEnd = gridCenter.add(new Vector3(x, 0, z));
				createBeam(lStart, lEnd);
			}

			// Disegna le linee orizzontali
			for (let i = 0; i <= gridSize; i++) {
				const x = gridSize * GRID_CELL_SIZE;
				const z = i * GRID_CELL_SIZE;
				const lStart = gridCenter.add(new Vector3(0, 0, z));
				const lEnd = gridCenter.add(new Vector3(x, 0, z));
				createBeam(lStart, lEnd);
			}

			for (let xIndex = 0; xIndex <= gridSize; xIndex++) {
				for (let zIndex = 0; zIndex <= gridSize; zIndex++) {
					const pos = gridCenter.add(new Vector3(xIndex * GRID_CELL_SIZE, 0, zIndex * GRID_CELL_SIZE));
					createIntersectionSphere(pos);
				}
			}

			// --- (Opzionale ma consigliato) Aggiungi Particelle alle Intersezioni ---
			// Puoi aggiungere un altro ciclo for per creare piccoli emettitori di particelle
			// nei punti di intersezione per un effetto ancora più dinamico.

			print("[GridRendererController] Griglia sci-fi dinamica creata.");
		});
	}
}
