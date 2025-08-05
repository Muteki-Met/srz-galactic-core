import { DataStoreService, Players, Workspace } from "@rbxts/services";
import { PlayerData } from "shared/interface/player.interface";

const ds = DataStoreService.GetDataStore("PlayerData");

function getDefaultPlayerData(): PlayerData {
	const grid: PlayerData["grid"] = [];
	for (let x = 0; x < 4; x++) {
		for (let y = 0; y < 4; y++) {
			let state: "locked" | "unlocked" | "occupied" = "unlocked";
			let building: string | undefined = undefined;
			// Core occupa il centro 2x2
			if ((x === 1 || x === 2) && (y === 1 || y === 2)) {
				state = "occupied";
				building = "core";
			}
			grid.push({ x, y, state, building });
		}
	}
	return {
		coreTier: 1,
		grid,
		inventory: [],
		resources: {
			gold: 500,
			energy: 100,
		},
	};
}

export function generateGridFromData(playerData: PlayerData) {
	const gridFolder = new Instance("Folder");
	gridFolder.Name = "Grid";
	gridFolder.Parent = Workspace;

	for (const cell of playerData.grid) {
		const part = new Instance("Part");
		part.Name = `Cell_${cell.x}_${cell.y}`;
		part.Size = new Vector3(16, 1, 16); // Usa la tua CELL_SIZE
		part.Position = new Vector3(cell.x * 16, 0.5, cell.y * 16);
		part.Anchored = true;

		// Colore e attributi in base allo stato
		if (cell.state === "locked") {
			part.Color = new Color3(0.5, 0.5, 0.5);
			part.SetAttribute("Locked", true);
		} else if (cell.state === "occupied" && cell.building === "core") {
			part.Color = new Color3(0.2, 0.2, 1); // blu per il Core
			part.SetAttribute("Occupied", true);
			part.SetAttribute("Building", "core");
			// Qui puoi anche spawnare un modello Core 2x2, se vuoi
		} else {
			part.Color = new Color3(0.2, 0.8, 0.2);
			part.SetAttribute("Locked", false);
		}

		// ClickDetector sempre presente
		const clickDetector = new Instance("ClickDetector");
		clickDetector.Parent = part;

		part.Parent = gridFolder;
	}
}

Players.PlayerAdded.Connect((player) => {
	const key = tostring(player.UserId);
	let data: PlayerData | undefined;

	const [success, result] = pcall(() => ds.GetAsync(key));
	if (success && result) {
		data = result as PlayerData;
	} else {
		data = getDefaultPlayerData();
		ds.SetAsync(key, data);
	}
	generateGridFromData(data);
	// Salva i dati in memoria per questo player (es: in una mappa globale)
	// playerDataMap.set(player.UserId, data);

	// ...continua con la logica di gioco!
});

Players.PlayerRemoving.Connect((player) => {
	// Salva i dati aggiornati!
	// const data = playerDataMap.get(player.UserId);
	// ds.SetAsync(tostring(player.UserId), data);
});
