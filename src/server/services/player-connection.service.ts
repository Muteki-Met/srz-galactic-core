// in src/server/services/player-connection.service.ts
import { OnStart, Service } from "@flamework/core";
import { Players } from "@rbxts/services";
import { PlayerDataService } from "./player-data.service";

@Service({})
export class PlayerConnectionService implements OnStart {
	// 1. Inietta il PlayerDataService per poterlo usare
	constructor(private readonly playerDataService: PlayerDataService) {}

	public onStart(): void {
		// 2. Gestisce i giocatori che sono GIA' nel gioco
		//    quando questo servizio si avvia.
		for (const player of Players.GetPlayers()) {
			// Usiamo task.spawn per non bloccare l'avvio degli altri servizi,
			// dato che loadPlayerData è asincrono.
			task.spawn(() => this.playerDataService.loadPlayerData(player));
		}

		// 3. Gestisce i giocatori che entrano DOPO l'avvio del servizio
		Players.PlayerAdded.Connect((player) => {
			this.playerDataService.loadPlayerData(player);
		});

		// 4. Gestisce i giocatori che escono dal gioco
		Players.PlayerRemoving.Connect((player) => {
			this.playerDataService.unloadPlayerData(player);
		});

		print("[PlayerConnectionService] Servizio avviato e in ascolto.");
	}
}
