import { storageFactory } from 'storage-factory';

export const local = storageFactory(() => localStorage);
export const session = storageFactory(() => sessionStorage);

export const apiV3FileStorageBasePath = '/api/v3/file';

export function getFileDownloadUrl(id, name) {
	return `${apiV3FileStorageBasePath}/download/${id}/${encodeURI(name)}`;
}
