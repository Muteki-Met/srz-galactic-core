import { GridRemotesEnum, Remotes } from "@shared/remotes/grid.remotes";

import "./services/datastore.service";

Remotes.Server.Get(GridRemotesEnum.PlaceBuilding).Connect((player, data) => {
	print(`Richiesta piazzamento da ${player.Name}:`);
	print(`x: ${data.x}, y: ${data.y}, type: ${data.type}, rotation: ${data.rotation}`);
	// Qui puoi aggiungere validazione, logica di piazzamento, ecc.
	Remotes.Server.Get(GridRemotesEnum.UpdateGrid).SendToPlayer(player, {
		cells: [
			// Puoi inviare solo la cella aggiornata o l’intera griglia
			{ x: data.x, y: data.y, state: "occupied" },
		],
	});
});
