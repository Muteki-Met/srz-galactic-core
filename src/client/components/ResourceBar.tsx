// in src/client/components/ResourceBar.tsx
import React, { useEffect, useState } from "@rbxts/react";
import { PlayerDataController } from "client/controllers/player-data.controller";
import { RESOURCES } from "shared/constants/resource.conf";
import { PlayerProfile } from "shared/interface/player.interface"; // Importiamo il tipo del profilo

// 1. Definiamo le "props" che il nostro componente si aspetta di ricevere
interface ResourceBarProps {
	playerDataController: PlayerDataController;
}

// 2. Il componente ora accetta le props come argomento
export function ResourceBar({ playerDataController }: ResourceBarProps) {
	// 3. NON usiamo più Dependency(). Usiamo il controller che ci è stato passato!
	const [resources, setResources] = useState(playerDataController.getProfile()?.resources);

	useEffect(() => {
		// Definiamo una funzione che sa come aggiornare le risorse
		const updateResources = () => {
			// Chiediamo il profilo al controller
			const profile = playerDataController.getProfile();
			// Se il profilo esiste, aggiorniamo il nostro stato
			if (profile) {
				setResources(profile.resources);
			}
		};

		// 1. Colleghiamo la nostra funzione al segnale.
		//    Ora la funzione non prende argomenti, come si aspetta il segnale.
		const connection = playerDataController.onProfileUpdated.Connect(updateResources);

		// 2. Chiamiamo la funzione una volta subito, nel caso in cui il profilo
		//    fosse già stato caricato prima che questo componente apparisse.
		updateResources();

		// La funzione di pulizia rimane la stessa, fondamentale!
		return () => connection.Disconnect();
	}, [playerDataController]); // L'array delle dipendenze è corretto

	// 4. La funzione di rendering. Ho cambiato 'Key' in 'key' (minuscolo)
	return (
		<frame
			key="ResourceBar" // <-- k minuscola
			Size={new UDim2(1, 0, 0, 50)}
			Position={UDim2.fromScale(0.5, 0)}
			AnchorPoint={new Vector2(0.5, 0)}
			BackgroundTransparency={1}
		>
			{/* 1. Aggiungiamo un UIListLayout per gestire la disposizione */}
			<uilistlayout
				FillDirection={Enum.FillDirection.Horizontal} // Disponi gli elementi in orizzontale
				HorizontalAlignment={Enum.HorizontalAlignment.Center} // **Questa è la magia che centra tutto!**
				VerticalAlignment={Enum.VerticalAlignment.Center} // Centra anche verticalmente
				SortOrder={Enum.SortOrder.LayoutOrder}
				Padding={new UDim(0, 10)} // Aggiunge 10 pixel di spazio tra ogni elemento
			/>
			{RESOURCES.map((resourceInfo, index) => (
				<frame
					key={resourceInfo.id} // <-- k minuscola
					Size={new UDim2(0, 150, 1, 0)}
					// 2. Rimuoviamo la Posizione manuale! Il layout la gestisce.
					// Position={UDim2.fromOffset(index * 160, 0)}
					BackgroundTransparency={1}
					LayoutOrder={index} // Diamo un ordine al layout
				>
					<imagelabel
						key="Icon" // <-- k minuscola
						Size={UDim2.fromOffset(40, 40)}
						Position={UDim2.fromScale(0, 0.5)}
						AnchorPoint={new Vector2(0, 0.5)}
						Image={resourceInfo.iconAssetId}
						BackgroundTransparency={1}
					/>
					<textlabel
						key="Amount"
						Size={new UDim2(1, -50, 1, 0)}
						Position={UDim2.fromScale(1, 0.5)}
						AnchorPoint={new Vector2(1, 0.5)}
						Text={tostring(resources?.[resourceInfo.id] ?? 0)}
						// --- Modifiche qui ---
						Font={"LuckiestGuy"}
						TextColor3={Color3.fromRGB(44, 44, 44)}
						TextSize={16}
						TextXAlignment={Enum.TextXAlignment.Left}
						BackgroundTransparency={1}
					>
						{/* --- Aggiunta qui --- */}
						{/* Questo elemento aggiunge il contorno al suo genitore (il TextLabel) */}
						<uistroke
							ApplyStrokeMode={Enum.ApplyStrokeMode.Contextual}
							Color={Color3.fromRGB(255, 255, 255)} // Contorno bianco
							Thickness={2.5} // Spessore 2.5
						/>
					</textlabel>
				</frame>
			))}
		</frame>
	);
}
