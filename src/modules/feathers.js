import feathers from 'feathers/client';
import socketio from 'feathers-socketio/client';
import io from 'socket.io-client';

const socket = io('http://localhost:3030/');

const server = feathers()
	.configure(socketio(socket));
export { server };
