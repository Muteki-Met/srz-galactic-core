import { Players, Workspace } from "@rbxts/services";
import { GridRemotesEnum, Remotes } from "shared/remotes/grid.remotes";

const player = Players.LocalPlayer;

// Trova la folder Grid
const gridFolder = Workspace.FindFirstChild("Grid");

/*print("Grid folder:", gridFolder);
if (gridFolder && gridFolder.IsA("Folder")) {
	print("Grid folder found:", gridFolder.Name);
	for (const cell of gridFolder.GetChildren()) {
		print("Oggetto in Grid:", cell.Name, cell.ClassName);
		if (cell.IsA("Part")) {
			const clickDetector = cell.FindFirstChildOfClass("ClickDetector");
			print("Part trovata:", cell.Name, "ClickDetector:", clickDetector);
			if (clickDetector) {
				print("ClickDetector found:", clickDetector.Name);
				// Highlight on hover
				clickDetector.MouseHoverEnter.Connect(() => {
					cell.Color = new Color3(1, 1, 0); // giallo
				});
				clickDetector.MouseHoverLeave.Connect(() => {
					cell.Color = new Color3(0.2, 0.8, 0.2); // verde originale
				});

				// Click: invia il remote PlaceBuilding
				clickDetector.MouseClick.Connect((plr) => {
					if (plr === player) {
						// Esempio: estrai x,y dal nome della cella
						const [_, x, y] = string.match(cell.Name, "Cell_(%d+)_(%d+)");
						Remotes.Client.Get(GridRemotesEnum.PlaceBuilding).SendToServer({
							x: tonumber(x) ?? 0,
							y: tonumber(y) ?? 0,
							type: "tower", // puoi cambiare dinamicamente in base alla selezione
							rotation: 0, // idem per la rotazione
						});
					}
				});
			}
		}
	}
}*/

function handleCell(cell: Instance) {
	print("Oggetto in Grid:", cell.Name, cell.ClassName);
	if (cell.IsA("Part")) {
		const clickDetector = cell.FindFirstChildOfClass("ClickDetector");
		print("Part trovata:", cell.Name, "ClickDetector:", clickDetector);
		if (clickDetector) {
			clickDetector.MouseHoverEnter.Connect(() => {
				cell.Color = new Color3(1, 1, 0);
			});
			clickDetector.MouseHoverLeave.Connect(() => {
				cell.Color = new Color3(0.2, 0.8, 0.2);
			});
			clickDetector.MouseClick.Connect((plr) => {
				if (plr === player) {
					const [xStr, yStr] = string.match(cell.Name, "Cell_(%d+)_(%d+)");

					if (xStr && yStr) {
						const x = tonumber(xStr);
						const y = tonumber(yStr);
						print(`Click su: ${cell.Name}, x: ${x}, y: ${y}`);
						Remotes.Client.Get(GridRemotesEnum.PlaceBuilding).SendToServer({
							x: x ?? 0,
							y: y ?? 0,
							type: "tower",
							rotation: 0,
						});
					}
				}
			});
		}
	}
}

Remotes.Client.Get(GridRemotesEnum.UpdateGrid).Connect((updateData) => {
	print("Aggiornamento griglia ricevuto:", updateData);
	for (const cellUpdate of updateData.cells) {
		const cell = Workspace.FindFirstChild("Grid")?.FindFirstChild(`Cell_${cellUpdate.x}_${cellUpdate.y}`);
		print(`Aggiornamento cella: ${cellUpdate.x} ${cellUpdate.y} -> ${cellUpdate.state}`);
		if (cell && cell.IsA("Part")) {
			print(`Aggiornamento cella: ${cell.Name} -> ${cellUpdate.state}`);
			if (cellUpdate.state === "occupied") {
				cell.Color = new Color3(1, 0.5, 0); // arancione per “occupato”
			}
			// Puoi aggiungere altri stati: "free", "locked", ecc.
		}
	}
});

if (gridFolder && gridFolder.IsA("Folder")) {
	for (const cell of gridFolder.GetChildren()) {
		handleCell(cell);
	}
	gridFolder.ChildAdded.Connect(handleCell); // <-- questa riga è la chiave!
}
