import { CELL_SIZE, CORE_TIERS, GRID_CELL_SIZE } from "@shared/constants/grid.conf";
import { PlayerProfile } from "@shared/interface/player.interface";

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
	 * @param gridPos Le coordinate (x, y) della cella in alto a sinistra.
	 * @param buildingSize La dimensione dell'edificio in numero di celle (x, y).
	 * @param gridCenter
	 * @returns Il CFrame per posizionare il modello nel mondo.
	 */
	export function gridToWorldCFrame(gridPos: Vector2, buildingSize: Vector2, gridCenter: Vector3): CFrame {
		/*const relativePos = new Vector3((gridPos.X + 0.5) * GRID_CELL_SIZE, 0, (gridPos.Y + 0.5) * GRID_CELL_SIZE);
		return new CFrame(gridCenter.add(relativePos));*/
		// 1. Calcola la posizione del mondo dell'angolo della cella di riferimento (gridPos)
		const anchorWorldPos = new Vector3(gridPos.X * GRID_CELL_SIZE, 0, gridPos.Y * GRID_CELL_SIZE);

		// 2. Calcola l'offset necessario per centrare il MODELLO, non la cella.
		//    Per un edificio 1x1, l'offset è mezza cella.
		//    Per un edificio 5x5, l'offset è 2.5 celle.
		//    La formula è (dimensione / 2)
		const centeringOffset = new Vector3(
			(buildingSize.X * GRID_CELL_SIZE) / 2,
			0,
			(buildingSize.Y * GRID_CELL_SIZE) / 2,
		);

		// 3. La posizione finale è il centro della griglia + la posizione dell'angolo + l'offset di centratura.
		const finalPosition = gridCenter.add(anchorWorldPos).add(centeringOffset);

		return new CFrame(finalPosition);
	}

	// NUOVA FUNZIONE
	export function getGridCenter(profile: PlayerProfile): Vector3 | undefined {
		/*	const coreBuilding = profile.placedBuildings.find((b) => b.buildingId === "core");
			if (!coreBuilding) return undefined;

			return new Vector3(
				coreBuilding.position.x * GRID_CELL_SIZE,
				0.1, // Mettiamo una piccola altezza per non essere sotto il terreno
				coreBuilding.position.y * GRID_CELL_SIZE,
			);*/
		return new Vector3(0, 0.1, 0);
	}

	// NUOVA FUNZIONE
	export function getGridSize(profile: PlayerProfile): number | undefined {
		const tierInfo = CORE_TIERS[profile.coreTier - 1];
		return tierInfo?.gridSize;
	}
}
