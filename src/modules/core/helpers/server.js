import feathers from 'feathers/client';
import socketio from 'feathers-socketio/client';
import io from 'socket.io-client';
import hooks from 'feathers-hooks';
import authentication from 'feathers-authentication/client';
import rx from 'feathers-reactive';
import RxJS from 'rxjs';
import { browserHistory } from 'react-router';

import Config from '../helpers/config';

class Server {
	constructor() {
		const socket = io(Config.server);
		const server = feathers()
			.configure(socketio(socket))
			.configure(rx(RxJS))
			.configure(hooks())
			.configure(authentication({ storage: window.localStorage, path: '/auth' }));

		socket.io.engine.on('upgrade', function(transport) {
			server.authenticate().catch(() => {
				console.info('User not authorized');
			});
		});

		return server;
	}
}

export default new Server();
