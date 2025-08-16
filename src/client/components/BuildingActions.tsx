// in BuildingActions.tsx
import React, { useEffect, useRef } from "@rbxts/react";
import { RunService, Workspace } from "@rbxts/services";

interface BuildingActionsProps {
	selectedBuildingModel?: Model;
	onClose: () => void;
	onSalvage: (instanceId: string) => void;
	/*onMove: (instanceId: string) => void;*/
}

export function BuildingActions({ selectedBuildingModel, onClose, onSalvage }: BuildingActionsProps) {
	const frameRef = useRef<Frame>();

	useEffect(() => {
		if (!selectedBuildingModel || !frameRef.current) return;

		const frame = frameRef.current;

		// Connettiti all'evento che si attiva ogni frame
		const connection = RunService.RenderStepped.Connect(() => {
			const camera = Workspace.CurrentCamera;
			if (!camera) return;

			// Converte la posizione 3D del modello in coordinate 2D sullo schermo
			const [screenPos, onScreen] = camera.WorldToScreenPoint(selectedBuildingModel.GetPivot().Position);

			if (onScreen) {
				// Se è visibile, posiziona il frame e rendilo visibile
				frame.Visible = true;
				frame.Position = UDim2.fromOffset(screenPos.X, screenPos.Y);
			} else {
				// Altrimenti, nascondilo
				frame.Visible = false;
			}
		});

		// Funzione di pulizia: disconnetti quando il componente scompare o cambia l'edificio
		return () => connection.Disconnect();
	}, [selectedBuildingModel]); // Questo hook si riattiva ogni volta che l'edificio selezionato cambia

	if (!selectedBuildingModel) {
		return <></>;
	}

	return (
		// Usiamo un ref per poter accedere a questo frame nella logica dell'hook
		<frame
			ref={frameRef}
			Position={UDim2.fromScale(0.5, 0.5)}
			AnchorPoint={new Vector2(0.5, 1)}
			BorderColor3={Color3.fromRGB(80, 80, 80)}
			Visible={false} // Inizia invisibile
			Size={UDim2.fromOffset(180, 60)} // Un po' più grande per le icone
			BackgroundColor3={Color3.fromRGB(40, 40, 40)}
			BackgroundTransparency={0.3}
			BorderSizePixel={0}
		>
			<uicorner CornerRadius={new UDim(1, 0)} />
			<uilistlayout
				FillDirection={Enum.FillDirection.Horizontal}
				VerticalAlignment={Enum.VerticalAlignment.Center}
				HorizontalAlignment={Enum.HorizontalAlignment.Center}
				Padding={new UDim(0, 10)}
			/>
			<uipadding PaddingLeft={new UDim(0, 5)} PaddingRight={new UDim(0, 5)} />

			{/* Pulsante SPOSTA */}
			{/*	<imagebutton
				key="Move"
				Size={UDim2.fromOffset(40, 40)}
				Image="rbxassetid://111440788520197" // <-- SOSTITUISCI
				BackgroundTransparency={1}
				Event={{
					MouseButton1Click: () => {
						const instanceId = selectedBuildingModel.GetAttribute("InstanceId") as string;
						onMove(instanceId);
					},
				}}
			/>*/}
			{/* Pulsante RECUPERA */}
			<imagebutton
				key="Salvage"
				Size={UDim2.fromOffset(40, 40)}
				Image="rbxassetid://ID_ICONA_RECUPERA" // <-- SOSTITUISCI
				BackgroundTransparency={1}
				Event={{
					MouseButton1Click: () => {
						const instanceId = selectedBuildingModel.GetAttribute("InstanceId") as string;
						onSalvage(instanceId);
					},
				}}
			/>
			{/* Pulsante CHIUDI */}
			<imagebutton
				key="Close"
				Size={UDim2.fromOffset(40, 40)}
				Image="rbxassetid://71503326776390" // <-- SOSTITUISCI
				BackgroundTransparency={1}
				Event={{ MouseButton1Click: onClose }}
			/>
		</frame>
	);
}
