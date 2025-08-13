// in src/client/components/BuildMenu.tsx

import React, { useEffect, useState } from "@rbxts/react";
import { BuildModeController } from "client/controllers/build-mode.controller";
import { PlayerDataController } from "@client/controllers/player-data.controller";
import { BuildController } from "@client/controllers/build.controller";
import { BUILDINGS } from "@shared/constants/building.conf";
import { ResourceId } from "@shared/interface/resource.interface";
// 1. Definiamo le "props": i dati che il componente riceve dall'esterno.
//    In questo caso, gli serve solo il controller per sapere quando aprirsi/chiudersi.
interface BuildMenuProps {
	buildModeController: BuildModeController;
	playerDataController: PlayerDataController;
	buildController: BuildController;
}

export function BuildMenu({ buildModeController, playerDataController, buildController }: BuildMenuProps) {
	// ... (gli hook useState e useEffect rimangono uguali)

	// Aggiungiamo uno stato per le risorse del giocatore, così la UI si aggiorna
	const [isOpen, setIsOpen] = useState(buildModeController.isBuildModeActive());
	const [playerResources, setPlayerResources] = useState(playerDataController.getProfile()?.resources);

	useEffect(() => {
		// Logica per aprire/chiudere il menu
		const enteredConnection = buildModeController.onBuildModeEntered.Connect(() => setIsOpen(true));
		const exitedConnection = buildModeController.onBuildModeExited.Connect(() => setIsOpen(false));

		// --- CORREZIONE 2: Correggiamo come ci connettiamo a onProfileLoaded ---
		// La funzione non riceve argomenti. Chiamiamo getProfile() al suo interno.
		const profileLoadedConnection = playerDataController.onProfileLoaded.Connect(() => {
			const profile = playerDataController.getProfile();
			if (profile) {
				setPlayerResources(profile.resources);
			}
		});

		// Chiamata iniziale per sicurezza
		setPlayerResources(playerDataController.getProfile()?.resources);

		// Funzione di pulizia per tutte le connessioni
		return () => {
			enteredConnection.Disconnect();
			exitedConnection.Disconnect();
			profileLoadedConnection.Disconnect();
		};
	}, [buildModeController, playerDataController]); // Dipendenze corrette

	if (!isOpen) {
		return <></>;
	}

	return (
		<frame
			key="BuildMenu"
			Size={UDim2.fromOffset(500, 120)}
			Position={new UDim2(0.5, 0, 1, -20)}
			AnchorPoint={new Vector2(0.5, 1)}
			BackgroundColor3={Color3.fromRGB(30, 30, 30)}
			BackgroundTransparency={0.2}
			ZIndex={10} // Aggiunto ZIndex per sicurezza
		>
			<uicorner CornerRadius={new UDim(0, 8)} />
			<uipadding
				PaddingTop={new UDim(0, 10)}
				PaddingBottom={new UDim(0, 10)}
				PaddingLeft={new UDim(0, 10)}
				PaddingRight={new UDim(0, 10)}
			/>
			<uilistlayout
				FillDirection={Enum.FillDirection.Horizontal}
				VerticalAlignment={Enum.VerticalAlignment.Center}
				SortOrder={Enum.SortOrder.LayoutOrder}
				Padding={new UDim(0, 10)}
			/>

			{BUILDINGS.map((building) => {
				const tier1Cost = building.tiers[0]?.cost;
				let canAfford = true;
				if (tier1Cost && playerResources) {
					for (const [resource, requiredAmount] of pairs(tier1Cost)) {
						const playerAmount = playerResources[resource as ResourceId] ?? 0;
						if (playerAmount < requiredAmount) {
							canAfford = false;
							break;
						}
					}
				} else {
					canAfford = false;
				}

				return (
					<textbutton
						key={building.id}
						Size={new UDim2(0, 100, 1, 0)}
						Text=""
						BackgroundColor3={Color3.fromRGB(50, 50, 50)}
						BackgroundTransparency={canAfford ? 0 : 0.5}
						AutoButtonColor={canAfford}
						Event={{
							MouseButton1Click: () => {
								if (canAfford) {
									buildController.startPlacement(building.id);
								}
							},
						}}
					>
						<uicorner CornerRadius={new UDim(0, 6)} />
						<uilistlayout
							FillDirection={Enum.FillDirection.Vertical}
							HorizontalAlignment={Enum.HorizontalAlignment.Center}
							Padding={new UDim(0, 5)}
						/>
						<textlabel
							Text={building.name}
							Size={new UDim2(1, 0, 0, 20)}
							BackgroundTransparency={1}
							TextColor3={Color3.fromRGB(255, 255, 255)}
						/>
						<imagelabel
							Image={building.icon} // Corretto da 'icon' a 'iconAssetId'
							Size={new UDim2(0, 50, 0, 50)}
							BackgroundTransparency={1}
						/>
					</textbutton>
				);
			})}
		</frame>
	);
}
