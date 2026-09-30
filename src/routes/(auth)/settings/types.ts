export type ClientWebSession = {
	id: string;
	revokedAt: Date | null;
	revokedReason: string | null;
	expiresAt: Date;
	loggedInAt: Date;
	requestedAt: Date;
	lastUsedAt: Date;
	requestsMade: number;
};
