// in src/client/components/BuildModeButton.tsx
import React, { useEffect, useState } from "@rbxts/react";
import { BuildModeController } from "client/controllers/build-mode.controller";

// 1. Definisci le props che il componente riceverà
interface BuildModeButtonProps {
	buildModeController: BuildModeController;
}

// 2. Crea il componente che accetta le props
export function BuildModeButton({ buildModeController }: BuildModeButtonProps) {
	// 3. Crea una variabile di stato 'isActive'.
	//    Come ottieni lo stato iniziale dal controller?
	const [isActive, setIsActive] = useState(buildModeController.isBuildModeActive());

	// 4. Usa useEffect per ascoltare i cambiamenti di stato
	useEffect(() => {
		const enteredConnection = buildModeController.onBuildModeEntered.Connect(() => {
			setIsActive(true); // Imposta lo stato a 'true'
		});

		const exitedConnection = buildModeController.onBuildModeExited.Connect(() => {
			setIsActive(false); // Imposta lo stato a 'false'
		});

		// 5. Non dimenticare la funzione di pulizia per disconnettere tutto!
		return () => {
			enteredConnection.Disconnect();
			exitedConnection.Disconnect();
		};
	}, [buildModeController]); // La dipendenza è il controller stesso

	// 6. Restituisci il JSX per il pulsante
	return (
		<textbutton
			key="BuildModeButton"
			Size={new UDim2(0, 150, 0, 50)}
			Position={new UDim2(1, -170, 1, -70)} // Posizionato in basso a destra
			AnchorPoint={new Vector2(1, 1)}
			// Cambia testo e colore in base allo stato 'isActive'
			Text={isActive ? "Annulla" : "Costruisci"}
			BackgroundColor3={isActive ? Color3.fromRGB(200, 50, 50) : Color3.fromRGB(50, 150, 255)}
			// Gestisci l'evento del click
			Event={{
				MouseButton1Click: () => {
					buildModeController.toggleBuildMode();
				},
			}}
		>
			<uicorner CornerRadius={new UDim(0, 8)} />
		</textbutton>
	);
}
