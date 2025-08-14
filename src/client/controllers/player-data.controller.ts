// in player-data.controller.ts
import { Controller, OnStart } from "@flamework/core";
import { ClientEvents } from "@client/network";
import { PlayerProfile } from "@shared/interface/player.interface";
import Signal from "@rbxts/lemon-signal";

@Controller({ loadOrder: 0 })
export class PlayerDataController implements OnStart {
	public readonly onProfileUpdated = new Signal<(newProfile: PlayerProfile) => void>();
	private profile?: PlayerProfile;

	public onStart(): void {
		ClientEvents.UpdatePlayerData.connect((data) => {
			print("[PlayerDataController] Dati del profilo ricevuti!");
			this.profile = data;
			this.onProfileUpdated.Fire(data); // "Annuncia" che i dati sono pronti!
		});
	}

	public getProfile(): PlayerProfile | undefined {
		return this.profile;
	}
}
