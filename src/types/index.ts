export type Player = {
	id: string;
	name: string;
	isHost: boolean;
};

export type Room = {
	id: string;
	players: Player[];
	deck: string[];
	round: number;
};
