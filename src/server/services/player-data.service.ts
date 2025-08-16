// src/server/services/player-data.service.ts
import { Service } from "@flamework/core";
import { PlayerProfile } from "@shared/interface/player.interface";
import ProfileStore, { Profile, Store } from "@rbxts/profile-store";
import { ClientEvents } from "@server/network";
import { BuildingService } from "@server/services/building.service";
import { GridUtils } from "@shared/utils/grid.utils";

@Service({})
export class PlayerDataService {
	private profiles = new Map<Player, Profile<PlayerProfile>>();
	private store: Store<PlayerProfile>;

	private readonly profileTemplate: PlayerProfile;

	constructor(private readonly buildingService: BuildingService) {
		const gridSize = 20; // o GridUtils.getGridSize(...)
		const coreSize = 5;
		const startX = math.floor((gridSize - coreSize) / 2);
		const startY = math.floor((gridSize - coreSize) / 2);

		this.profileTemplate = {
			coreTier: 1,
			placedBuildings: [
				{
					instanceId: "CORE_0",
					buildingId: "core",
					tier: 1,
					position: { x: startX, y: startY },
					status: "built",
				},
			],
			inventory: [{ buildingId: "ferronoxite_extractor", count: 1 }],
			resources: {
				ferronoxite: 250, // Diamo abbastanza Ferronoxite per costruire i primi edifici
				voltherium: 100, // Un po' di Voltherium per iniziare
				silphite: 0, // Il Silphite va prodotto, quindi si parte da zero!
			},
		};
		this.store = ProfileStore.New("PlayerData", this.profileTemplate);
	}

	public getPlayerData(player: Player): PlayerProfile | undefined {
		const profile = this.profiles.get(player);
		return profile?.Data;
	}

	public async loadPlayerData(player: Player): Promise<void> {
		// ✅ CORRETTO: Il metodo si chiama StartSessionAsync
		const profile = this.store.StartSessionAsync("Player_" + player.UserId, { Steal: true });

		if (!profile) {
			player.Kick("Your data could not be loaded. Please rejoin.");
			return;
		}

		// ✅ CORRETTO: Il metodo si chiama reconcile (r minuscola)
		profile.Reconcile();

		this.profiles.set(player, profile);
		ClientEvents.UpdatePlayerData.fire(player, profile.Data);
		print(`[PlayerDataService] Profile session started for ${player.Name}`);
		// 1. Ottieni i dati del profilo che hai appena caricato.
		const profileData = profile.Data;

		// 2. Calcola il centro della griglia per questo giocatore.
		//    Avrai bisogno della nostra utility GridUtils.
		const gridCenter = GridUtils.getGridCenter(profileData);
		if (!gridCenter) {
			warn(`Non è stato possibile trovare un "core" per ${player.Name}, impossibile ricreare gli edifici.`);
			return;
		}

		// 3. Itera su ogni edificio salvato nei dati del giocatore.
		for (const building of profile.Data.placedBuildings) {
			const gridCenter = GridUtils.getGridCenter(profile.Data);
			if (!gridCenter) continue;

			// La chiamata corretta:
			this.buildingService.createBuildingModel(
				player,
				building.instanceId,
				building.buildingId,
				new Vector2(building.position.x, building.position.y),
				gridCenter,
			);
		}

		print(`[PlayerDataService] Ricreati ${profileData.placedBuildings.size()} edifici per ${player.Name}`);
	}

	public unloadPlayerData(player: Player): void {
		const profile = this.profiles.get(player);
		if (profile) {
			// ✅ CORRETTO: Il metodo si chiama release (r minuscola)
			profile.EndSession();
			this.profiles.delete(player);
			print(`[PlayerDataService] Profile session for ${player.Name} released.`);
		}
	}

	public updateAndNotifyClient(player: Player, profileData: PlayerProfile): void {
		// Potremmo aggiungere logica di salvataggio qui in futuro, ma per ora...
		// la cosa più importante è notificare il client.

		ClientEvents.UpdatePlayerData.fire(player, profileData);
		print(`[PlayerDataService] Inviato profilo aggiornato a ${player.Name}`);
	}
}
