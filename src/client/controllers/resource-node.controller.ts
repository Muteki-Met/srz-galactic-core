import { Controller, OnStart } from "@flamework/core";
import { ClientFunctions } from "@client/network";
import { ResourceNode } from "@shared/interface/resource.interface";
import { GRID_CELL_SIZE } from "@shared/constants/grid.conf";
import { GridUtils } from "@shared/utils/grid.utils";
import { Workspace } from "@rbxts/services";
import { PlayerDataController } from "@client/controllers/player-data.controller";

@Controller({})
export class ResourceNodeController implements OnStart {
	constructor(private playerDataController: PlayerDataController) {}

	public async onStart(): Promise<void> {
		this.playerDataController.onProfileLoaded.Connect(() => {
			this.drawResourceNodes(); // Chiama la logica di disegno solo ora
		});
	}

	private async drawResourceNodes(): Promise<void> {
		print("[ResourceNodeController] Profilo caricato, richiesta dei nodi risorsa...");
		const resourceNodes = await ClientFunctions.GetResourceNodes();

		if (resourceNodes) {
			print(`[ResourceNodeController] Ricevuti ${resourceNodes.size()} nodi dal server.`);

			// Ottieni il profilo e il centro della griglia UNA SOLA VOLTA
			const profile = this.playerDataController.getProfile();
			if (!profile) return;
			const gridCenter = GridUtils.getGridCenter(profile);
			if (!gridCenter) return;
			// Crea un modello per tenere tutto pulito
			const resourceNodesModel = new Instance("Model", Workspace);
			resourceNodesModel.Name = "ResourceNodesVisuals";

			// Itera e disegna ogni nodo
			for (const node of resourceNodes) {
				this.createNodeVisual(node, gridCenter, resourceNodesModel);
			}
		} else {
			warn("[ResourceNodeController] Non è stato possibile ricevere i nodi risorsa dal server.");
		}
	}

	private createNodeVisual(node: ResourceNode, gridCenter: Vector3, parent: Model) {
		// 1. Calcola la posizione e la dimensione nel mondo
		const nodeSize = new Vector2(node.size.x, node.size.y);
		const nodeGridPos = new Vector2(node.position.x, node.position.y);
		const worldCFrame = GridUtils.gridToWorldCFrame(nodeGridPos, nodeSize, gridCenter);

		const worldSize = new Vector3(
			node.size.x * GRID_CELL_SIZE,
			0.2, // Una piccola altezza per renderlo visibile
			node.size.y * GRID_CELL_SIZE,
		);

		// 2. Crea la parte visiva
		const visualPart = new Instance("Part", parent);
		visualPart.Anchored = true;
		visualPart.CanCollide = false;
		visualPart.Size = worldSize;
		visualPart.CFrame = worldCFrame;
		visualPart.Transparency = 0.6;
		visualPart.Material = Enum.Material.Neon;

		// 3. Imposta il colore in base al tipo di risorsa
		if (node.resourceType === "gold") {
			visualPart.Color = Color3.fromRGB(255, 204, 0); // Giallo oro
		} else if (node.resourceType === "energy") {
			visualPart.Color = Color3.fromRGB(0, 204, 255); // Ciano energia
		}
	}
}
