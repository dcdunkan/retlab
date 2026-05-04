export async function openIdb(
	name: string,
	version: number,
	stores: {
		name: string;
		options?: IDBObjectStoreParameters;
		indexes?: {
			name: string;
			keyPath: string | string[];
			options?: IDBIndexParameters;
		}[];
	}[]
): Promise<IDBDatabase> {
	return new Promise<IDBDatabase>((resolve, reject) => {
		const request = indexedDB.open(name, version);

		request.onupgradeneeded = (event) => {
			const db = (event.target as IDBOpenDBRequest).result;
			for (const store of stores) {
				const objectStore = db.objectStoreNames.contains(store.name)
					? request.transaction?.objectStore(store.name)
					: db.createObjectStore(store.name, store.options);
				if (objectStore == null) continue;
				for (const index of store.indexes ?? []) {
					objectStore.createIndex(index.name, index.keyPath, index.options);
				}
			}
		};

		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
		request.onblocked = () => reject(new Error(`Opening "${name}" is blocked by another tab`));
	});
}

async function withTransaction<T>(
	db: IDBDatabase,
	storeNames: string | string[],
	transactionMode: IDBTransactionMode,
	action: (tx: IDBTransaction) => IDBRequest<T>
): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const tx = db.transaction(storeNames, transactionMode);
		const request = action(tx);
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
		tx.onerror = () => reject(tx.error);
		tx.onabort = () => reject(tx.error ?? new Error("Transaction aborted"));
	});
}

async function withObjectStore<T>(
	db: IDBDatabase,
	storeName: string,
	transactionMode: IDBTransactionMode,
	action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
	return withTransaction(db, storeName, transactionMode, (tx) => {
		const store = tx.objectStore(storeName);
		return action(store);
	});
}

export class IDBStore<T> {
	constructor(
		public db: IDBDatabase,
		public storeName: string
	) {
		if (!db.objectStoreNames.contains(storeName)) {
			throw new Error(`No store with the name ${storeName} in db ${db.name}`);
		}
	}

	#with<RT>(
		transactionMode: IDBTransactionMode,
		action: (store: IDBObjectStore) => IDBRequest<RT>
	): Promise<RT> {
		return withObjectStore(this.db, this.storeName, transactionMode, action);
	}

	add(value: T, key?: IDBValidKey): Promise<IDBValidKey> {
		return this.#with("readwrite", (store) => store.add(value, key));
	}

	put(value: T, key?: IDBValidKey): Promise<IDBValidKey> {
		return this.#with("readwrite", (store) => store.put(value, key));
	}

	get(query: IDBValidKey | IDBKeyRange): Promise<T | undefined> {
		return this.#with("readonly", (store) => store.get(query));
	}

	delete(query: IDBValidKey | IDBKeyRange): Promise<undefined> {
		return this.#with("readwrite", (store) => store.delete(query));
	}

	clear(): Promise<undefined> {
		return this.#with("readwrite", (store) => store.clear());
	}
}
