// in src/server/services/building.service.ts
import { Service } from "@flamework/core";
import { BUILDINGS } from "@shared/constants/building.conf";
import { GridUtils } from "@shared/utils/grid.utils";
import { ReplicatedStorage, Workspace } from "@rbxts/services";

@Service({})
export class BuildingService {
	public createBuildingModel(
		player: Player,
		instanceId: string,
		buildingId: string,
		gridPosition: Vector2,
		gridCenter: Vector3,
	): void {
		const buildingData = BUILDINGS.find((b) => b.id === buildingId);
		if (!buildingData) return;

		const modelFolder = ReplicatedStorage.FindFirstChild("Models");
		const modelRef = modelFolder?.FindFirstChild(buildingData.model);
		if (!modelRef || !modelRef.IsA("Model")) return;

		const newBuilding = modelRef.Clone();
		newBuilding.Name = instanceId;
		const worldCFrame = GridUtils.gridToWorldCFrame(
			gridPosition,
			new Vector2(buildingData.size.x, buildingData.size.y),
			gridCenter,
		);

		newBuilding.SetAttribute("BuildingId", buildingId);
		newBuilding.SetAttribute("OwnerUserId", player.UserId);
		newBuilding.SetAttribute("InstanceId", instanceId);

		newBuilding.Parent = Workspace;
		newBuilding.PivotTo(worldCFrame);

		print(`[BuildingService] Creato modello per ${buildingId}`);
	}
}
