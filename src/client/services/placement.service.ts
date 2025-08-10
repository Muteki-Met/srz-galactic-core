import { Service, OnStart } from "@flamework/core";
import { Workspace, UserInputService, Players } from "@rbxts/services";
import { GridUtils } from "@shared/utils/grid.utils";

// Interfaccia per i dati che questo servizio fornirà
export interface PlacementInfo {
	worldPosition: Vector3;
	gridPosition: Vector2;
	target?: BasePart;
}

@Service({})
export class PlacementService implements OnStart {
	private camera: Camera;
	private raycastParams: RaycastParams;

	constructor() {
		this.camera = Workspace.CurrentCamera!;
		this.raycastParams = new RaycastParams();
		this.raycastParams.FilterType = Enum.RaycastFilterType.Exclude;
		// Inizializziamo la lista di oggetti da ignorare. Verrà popolata in onStart.
		this.raycastParams.FilterDescendantsInstances = [];
	}

	public onStart(): void {
		const player = Players.LocalPlayer;
		// Assicuriamoci di ignorare sempre il personaggio del giocatore
		player.CharacterAdded.Connect((character) => {
			this.addInstanceToIgnoreList(character);
		});
		if (player.Character) {
			this.addInstanceToIgnoreList(player.Character);
		}
	}

	/**
	 * Esegue un raycast dal centro dello schermo per trovare una posizione valida sulla griglia.
	 * @param placementDistance La distanza massima del raycast.
	 * @returns Un oggetto PlacementInfo o undefined se non viene trovata una posizione valida.
	 */
	public getPlacementInfo(placementDistance = 300): PlacementInfo | undefined {
		const viewportSize = this.camera.ViewportSize;
		const unitRay = this.camera.ViewportPointToRay(viewportSize.X / 2, viewportSize.Y / 2);

		const raycastResult = Workspace.Raycast(unitRay.Origin, unitRay.Direction.mul(placementDistance), this.raycastParams);

		if (raycastResult && raycastResult.Instance.IsA("BasePart")) {
			const worldPosition = raycastResult.Position;
			const gridPosition = GridUtils.worldToGrid(worldPosition);

			return {
				worldPosition,
				gridPosition,
				target: raycastResult.Instance,
			};
		}

		return undefined;
	}

	/**
	 * Aggiunge un'istanza (es. l'ologramma) alla lista di oggetti ignorati dal raycast.
	 * @param instance L'istanza da ignorare.
	 */
	public addInstanceToIgnoreList(instance: Instance): void {
		const currentList = this.raycastParams.FilterDescendantsInstances;
		if (!currentList.includes(instance)) {
			this.raycastParams.FilterDescendantsInstances = [...currentList, instance];
		}
	}

	/**
	 * Rimuove un'istanza dalla lista di oggetti ignorati.
	 * @param instance L'istanza da rimuovere.
	 */
	public removeInstanceFromIgnoreList(instance: Instance): void {
		const currentList = this.raycastParams.FilterDescendantsInstances;
		const index = currentList.indexOf(instance);
		if (index !== -1) {
			const newList = [...currentList];
			newList.remove(index);
			this.raycastParams.FilterDescendantsInstances = newList;
		}
	}
}
