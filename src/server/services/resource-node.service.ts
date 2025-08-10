// in src/server/services/resource-node.service.ts
import { OnStart, Service } from "@flamework/core";
import { ResourceNode } from "@shared/interface/resource.interface";
import { DEFAULT_RESOURCE_NODES } from "@shared/constants/resource.conf";
import { ServerFunctions } from "@server/network";

@Service({})
export class ResourceNodeService implements OnStart {
	private resourceNodes = new Map<string, ResourceNode>();

	constructor() {
		this.generateDefaultNodes();
	}

	public onStart(): void {
		ServerFunctions.GetResourceNodes.setCallback((player) => {
			print(`[ResourceNodeService] Player ${player.Name} requested resource nodes.`);
			const nodesArray = new Array<ResourceNode>();
			for (const [_, node] of this.resourceNodes) {
				nodesArray.push(node);
			}
			return nodesArray;
		});
		print("[ResourceNodeService] GetResourceNodes function is now listening.");
	}

	public getNodes(): Map<string, ResourceNode> {
		return this.resourceNodes;
	}

	public getNodeAtPosition(position: { x: number; y: number }): ResourceNode | undefined {
		for (const [_, node] of this.resourceNodes) {
			const nodeRect = {
				minX: node.position.x,
				minY: node.position.y,
				maxX: node.position.x + node.size.x,
				maxY: node.position.y + node.size.y,
			};

			// Controlla se la posizione data è dentro il rettangolo del nodo
			if (
				position.x >= nodeRect.minX &&
				position.x < nodeRect.maxX &&
				position.y >= nodeRect.minY &&
				position.y < nodeRect.maxY
			) {
				return node; // Trovato!
			}
		}
		return undefined; // Nessun nodo trovato in quella posizione
	}

	private generateDefaultNodes(): void {
		// In futuro, potremmo leggere questi dati da un file di configurazione.

		for (const node of DEFAULT_RESOURCE_NODES) {
			this.resourceNodes.set(node.id, node);
		}
		print(`[ResourceNodeService] Generated ${this.resourceNodes.size()} resource nodes.`);
	}
}
