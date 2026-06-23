import {
	createCipheriv,
	createDecipheriv,
	createHash,
	randomBytes,
} from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export function encryptSecret(plaintext: string) {
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv, {
		authTagLength: AUTH_TAG_LENGTH,
	});
	const encrypted = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const authTag = cipher.getAuthTag();

	return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptSecret(ciphertext: string) {
	const payload = Buffer.from(ciphertext, "base64");
	const iv = payload.subarray(0, IV_LENGTH);
	const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
	const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
	const decipher = createDecipheriv(ALGORITHM, encryptionKey(), iv, {
		authTagLength: AUTH_TAG_LENGTH,
	});
	decipher.setAuthTag(authTag);

	return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
		"utf8",
	);
}

function encryptionKey() {
	const secret = process.env.BUILDER_CREDENTIAL_ENCRYPTION_KEY;
	if (!secret) {
		throw new Error("BUILDER_CREDENTIAL_ENCRYPTION_KEY is not configured");
	}

	return createHash("sha256").update(secret).digest();
}
