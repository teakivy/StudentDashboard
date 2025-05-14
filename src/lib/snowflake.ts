import type { SnowflakeId } from './types';

const CUSTOM_EPOCH = new Date('2005-05-20T00:00:00Z').getTime();

/**
 * Generates a Snowflake-style 64-bit ID.
 * - 42 bits = ms since 05/20/2005
 * - 12 bits = random to avoid collisions
 * - 10 bits = reserved
 */
export function generateSnowflakeId(): SnowflakeId {
	const now = Date.now();
	const timestamp = BigInt(now - CUSTOM_EPOCH); // ms since custom epoch
	const random = BigInt(Math.floor(Math.random() * 4096)); // 12 bits
	const reserved = BigInt(0); // optional 10-bit filler

	// Final 64-bit structure: [timestamp << 22] | [random << 10] | reserved
	const snowflake = (timestamp << 22n) | (random << 10n) | reserved;

	return snowflake.toString() as SnowflakeId;
}

/**
 * Extracts the creation date from a Snowflake ID.
 * @param id - The Snowflake ID as a string
 * @returns The Date the ID represents
 */
export function getDateFromSnowflake(id: SnowflakeId): Date {
	const snowflake = BigInt(id);
	const timestampPart = snowflake >> 22n;
	const unixTimestamp = Number(timestampPart) + CUSTOM_EPOCH;
	return new Date(unixTimestamp);
}

export const createId = generateSnowflakeId;
export const getCreatedAt = getDateFromSnowflake;
