import crypto from "crypto";

export interface KeyPair {
	privateKey: string; // PEM PKCS#8
	publicKey: string; // PEM SPKI
}

export interface PartyKeys {
	sign: KeyPair; // Ed25519
	enc: KeyPair; // X25519
}

export interface PublicKeys {
	sign: string; // Ed25519 public key PEM
	enc: string; // X25519 public key PEM
}

export interface EncryptedEnvelope {
	ephemeralPub: string; // X25519 ephemeral public key PEM
	iv: string; // base64, 12 bytes
	authTag: string; // base64, 16 bytes
	ciphertext: string; // base64
}

export interface SignedEnvelope extends EncryptedEnvelope {
	senderId: string;
}

export function generateKeyPair(): PartyKeys {
	const encoding = {
		publicKeyEncoding: { type: "spki", format: "pem" },
		privateKeyEncoding: { type: "pkcs8", format: "pem" }
	} as const;

	return {
		// @ts-expect-error Yes
		sign: crypto.generateKeyPairSync("ed25519", encoding),
		// @ts-expect-error Yes
		enc: crypto.generateKeyPairSync("x25519", encoding)
	};
}

// Ed25519 sign / verify
function sign(data: string, privateKeyPem: string): string {
	return crypto.sign(null, Buffer.from(data, "utf8"), privateKeyPem).toString("base64");
}
function verify(data: string, signatureB64: string, publicKeyPem: string): boolean {
	try {
		return crypto.verify(
			null,
			Buffer.from(data, "utf8"),
			publicKeyPem,
			Buffer.from(signatureB64, "base64")
		);
	} catch {
		return false;
	}
}

// ECIES: X25519 + HKDF-SHA256 + AES-256-GCM

function encryptTo(plaintext: string, recipientEncPubPem: string): EncryptedEnvelope {
	// 1. Ephemeral key pair (fresh per message)
	const ephemeral = crypto.generateKeyPairSync("x25519");

	// 2. ECDH shared secret
	const shared = crypto.diffieHellman({
		privateKey: ephemeral.privateKey,
		publicKey: crypto.createPublicKey(recipientEncPubPem)
	});

	// 3. Derive 256-bit AES key via HKDF-SHA256
	const aesKey = Buffer.from(crypto.hkdfSync("sha256", shared, Buffer.alloc(32), "aes-key", 32));

	// 4. AES-256-GCM encrypt
	const iv = crypto.randomBytes(12);
	const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
	const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);

	return {
		ephemeralPub: ephemeral.publicKey.export({ type: "spki", format: "pem" }) as string,
		iv: iv.toString("base64"),
		authTag: cipher.getAuthTag().toString("base64"),
		ciphertext: ct.toString("base64")
	};
}

function decryptFrom(envelope: EncryptedEnvelope, myEncPrivPem: string): string {
	const { ephemeralPub, iv, authTag, ciphertext } = envelope;

	const shared = crypto.diffieHellman({
		privateKey: crypto.createPrivateKey(myEncPrivPem),
		publicKey: crypto.createPublicKey(ephemeralPub)
	});

	const aesKey = Buffer.from(crypto.hkdfSync("sha256", shared, Buffer.alloc(32), "aes-key", 32));
	const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, Buffer.from(iv, "base64"));
	decipher.setAuthTag(Buffer.from(authTag, "base64"));

	return Buffer.concat([
		decipher.update(Buffer.from(ciphertext, "base64")),
		decipher.final() // throws on auth tag mismatch
	]).toString("utf8");
}

// Helpers

export function createMessage(
	payload: unknown,
	senderSignPrivPem: string,
	recipientEncPubPem: string
): EncryptedEnvelope {
	const data = JSON.stringify(payload);
	const signature = sign(data, senderSignPrivPem);
	return encryptTo(JSON.stringify({ data, signature }), recipientEncPubPem);
}

export function openMessage<T = unknown>(
	envelope: EncryptedEnvelope,
	myEncPrivPem: string,
	senderSignPubPem: string
): T {
	const raw = decryptFrom(envelope, myEncPrivPem);
	const { data, signature } = JSON.parse(raw) as { data: string; signature: string };

	if (!verify(data, signature, senderSignPubPem)) {
		throw new Error("Signature verification failed");
	}

	return JSON.parse(data) as T;
}
