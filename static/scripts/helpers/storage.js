import { storageFactory } from 'storage-factory';

export const local = storageFactory(() => localStorage);
export const session = storageFactory(() => sessionStorage);

export const apiV3BasePath = '/api/v3';

export function getFileDownloadUrl(id, name) {
	return `${apiV3BasePath}/file/download/${id}/${name}`;
}
