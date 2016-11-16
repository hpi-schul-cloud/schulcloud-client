import feathers from 'feathers/client';
import socketio from 'feathers-socketio/client';
import io from 'socket.io-client';

import Config from '../helpers/config';

class Server {
	constructor() {
		const socket = io(Config.server);
		const server = feathers()
			.configure(socketio(socket));

		return server;
	}
}

export default new Server();
