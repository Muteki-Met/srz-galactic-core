import Net from "@rbxts/net";

export enum GridRemotesEnum {
	PlaceBuilding = "PlaceBuilding",
	UnlockCell = "UnlockCell",
	UpdateGrid = "UpdateGrid",
}

export interface PlaceBuildingRequest {
	x: number;
	y: number;
	type: string;
	rotation: number;
}

export interface UnlockCellRequest {
	x: number;
	y: number;
}

export interface GridCellUpdate {
	x: number;
	y: number;
	state: "occupied" | "free" | "locked"; // aggiungi altri stati se vuoi
}

export interface UpdateGridData {
	cells: GridCellUpdate[];
}

export const Remotes = Net.Definitions.Create({
	[GridRemotesEnum.PlaceBuilding]: Net.Definitions.ClientToServerEvent<[PlaceBuildingRequest]>(),
	[GridRemotesEnum.UnlockCell]: Net.Definitions.ClientToServerEvent<[UnlockCellRequest]>(),
	[GridRemotesEnum.UpdateGrid]: Net.Definitions.ServerToClientEvent<[UpdateGridData]>(),
	// altri remotes...
});
