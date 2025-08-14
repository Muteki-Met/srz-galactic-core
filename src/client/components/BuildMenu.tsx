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
	const [inventory, setInventory] = useState(playerDataController.getProfile()?.inventory ?? []);

	useEffect(() => {
		// 1. Gestisce l'apertura/chiusura del menu
		const enteredConnection = buildModeController.onBuildModeEntered.Connect(() => setIsOpen(true));
		const exitedConnection = buildModeController.onBuildModeExited.Connect(() => setIsOpen(false));

		// 2. Gestisce TUTTI gli aggiornamenti del profilo (inventario, risorse, ecc.)
		const profileUpdatedConnection = playerDataController.onProfileUpdated.Connect((profile) => {
			print("[BuildMenu] Profilo aggiornato, aggiorno la UI.");
			setInventory(profile.inventory);
			// Potremmo anche aggiornare le risorse qui se servisse in futuro
		});

		// 3. Funzione di pulizia che disconnette TUTTO
		return () => {
			enteredConnection.Disconnect();
			exitedConnection.Disconnect();
			profileUpdatedConnection.Disconnect();
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
			{inventory.map((inventoryItem) => {
				if (inventoryItem.count === 0) return; // Non mostrare edifici esauriti

				const buildingDef = BUILDINGS.find((b) => b.id === inventoryItem.buildingId);
				if (!buildingDef) return;

				return (
					<textbutton
						key={buildingDef.id}
						Size={new UDim2(0, 100, 1, 0)}
						Text=""
						BackgroundColor3={Color3.fromRGB(50, 50, 50)}
						Event={{
							MouseButton1Click: () => buildController.startPlacement(buildingDef.id),
						}}
					>
						{/* Questo oggetto magico ordinerà le label per noi! */}
						<uilistlayout
							SortOrder={Enum.SortOrder.LayoutOrder}
							FillDirection={Enum.FillDirection.Vertical}
							HorizontalAlignment={Enum.HorizontalAlignment.Center}
							VerticalAlignment={Enum.VerticalAlignment.Center}
							Padding={new UDim(0, 5)}
						/>

						{/* Label per il NOME dell'edificio */}
						<textlabel
							key="name"
							LayoutOrder={1} // Prima viene il nome...
							Text={buildingDef.name} // <-- Usiamo il nome dalla definizione
							Size={new UDim2(1, -10, 0.5, 0)}
							BackgroundTransparency={1}
							TextColor3={Color3.fromRGB(255, 255, 255)}
							TextScaled={true}
						/>

						{/* Label per la QUANTITÀ */}
						<textlabel
							key="quantity"
							LayoutOrder={2} // ...poi la quantità
							Text={`x${inventoryItem.count}`} // <-- La quantità dall'inventario
							Size={new UDim2(1, -10, 0.3, 0)}
							BackgroundTransparency={1}
							TextColor3={Color3.fromRGB(200, 200, 200)} // Un grigio chiaro per distinguerla
							TextScaled={true}
						/>
					</textbutton>
				);
			})}
		</frame>
	);
}
