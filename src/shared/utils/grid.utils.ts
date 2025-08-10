import { CELL_SIZE } from "@shared/constants/grid.conf";

// NOTA: Questo è l'offset del punto di ancoraggio della griglia nel mondo.
// Potrebbe essere necessario regolarlo in base alla posizione della tua baseplate.
const GRID_ORIGIN_OFFSET = new Vector3(0, 0.5, 0);

export namespace GridUtils {
	/**
	 * Converte una posizione 3D nel mondo in coordinate 2D della griglia (arrotondate).
	 * @param worldPosition La posizione nel mondo 3D.
	 * @returns Un Vector2 con le coordinate (x, y) della cella della griglia.
	 */
	export function worldToGrid(worldPosition: Vector3): Vector2 {
		const localPosition = worldPosition.sub(GRID_ORIGIN_OFFSET);
		const gridX = math.floor(localPosition.X / CELL_SIZE);
		const gridY = math.floor(localPosition.Z / CELL_SIZE);
		return new Vector2(gridX, gridY);
	}

	/**
	 * Converte le coordinate 2D della griglia nel CFrame del mondo 3D per un edificio.
	 * La posizione è calcolata al centro dell'area occupata dall'edificio.
	 * @param gridPosition Le coordinate (x, y) della cella in alto a sinistra.
	 * @param buildingSize La dimensione dell'edificio in numero di celle (x, y).
	 * @returns Il CFrame per posizionare il modello nel mondo.
	 */
	export function gridToWorldCFrame(gridPosition: Vector2, buildingSize: Vector2): CFrame {
		const halfSizeWorld = new Vector3(buildingSize.X * CELL_SIZE * 0.5, 0, buildingSize.Y * CELL_SIZE * 0.5);
		const anchorWorld = new Vector3(gridPosition.X * CELL_SIZE, 0, gridPosition.Y * CELL_SIZE).add(
			GRID_ORIGIN_OFFSET,
		);
		return new CFrame(anchorWorld.add(halfSizeWorld));
	}
}
