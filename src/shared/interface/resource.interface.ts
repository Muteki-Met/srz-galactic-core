export interface ResourceNode {
	id: string;
	resourceType: "gold" | "energy"; // Per ora, poi potremo aggiungerne altri
	position: { x: number; y: number };
	size: { x: number; y: number };
}
