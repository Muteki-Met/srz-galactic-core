import { Workspace } from "@rbxts/services";
import { CELL_SIZE, GRID_SIZE } from "@shared/constants/grid.conf";

export function generateGrid() {
	const gridFolder = new Instance("Folder");
	gridFolder.Name = "Grid";
	gridFolder.Parent = Workspace;

	for (let x = 0; x < GRID_SIZE; x++) {
		for (let y = 0; y < GRID_SIZE; y++) {
			const part = new Instance("Part");
			part.Size = new Vector3(CELL_SIZE, 1, CELL_SIZE);
			part.Position = new Vector3(x * CELL_SIZE, 0.5, y * CELL_SIZE);
			//part.Transparency = 0.85;
			part.Anchored = true;
			part.Color = new Color3(0.2, 0.8, 0.2);
			part.Name = `Cell_${x}_${y}`;
			part.Parent = gridFolder;

			// Aggiungi ClickDetector
			const clickDetector = new Instance("ClickDetector");
			clickDetector.Parent = part;
		}
	}
}
