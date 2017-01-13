import feathers from 'feathers/client';
import socketio from 'feathers-socketio/client';
import io from 'socket.io-client';
import hooks from 'feathers-hooks';
import authentication from 'feathers-authentication-client';
import rx from 'feathers-reactive';
import RxJS from 'rxjs';
import { browserHistory } from 'react-router';

import Config from '../helpers/config';

class Server {
	constructor() {
		const socket = io(Config.server);
		const server = feathers()
			.configure(socketio(socket))
			.configure(rx(RxJS, {listStrategy: 'always'}))
			.configure(hooks())
			.configure(authentication({
				entity: 'account',
				service: 'accounts',
				storage: window.localStorage
			}));

		const authenticateDefault = {};

		server.authenticateUser = (options) => {
			options = Object.assign({}, authenticateDefault, options);

			return server.authenticate(options).then((response) => {
				return server.passport.verifyJWT(response.accessToken);
			}).then((payload) => {
				// don't throw error only because userId is not given
				return new Promise(resolve => {
					server.service('users').get(payload.userId).then((user) => {
						server.set('user', user);
						resolve(payload);
					}).catch((e) => {
						console.info('User not authenticated.');
						resolve(payload);
					});
				});
			}).catch((e) => {
				// client doesn't care about login failing
			})
		};

		socket.io.engine.on('upgrade', function(transport) {
			server.authenticateUser();
		});

		return server;
	}
}

export default new Server();
