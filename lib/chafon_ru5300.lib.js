const net = require('net');
const EventEmitter = require('events');

const {HEADERS, CMD, PARSER, ONEPARAM} = require(`${__dirname}/chafon_ru5300.constants.js`);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class _chafon_ru5300 extends EventEmitter{
	constructor({addr, ip, port = 60000, baud, path}){
		super();
		const self = this;

		self._client = undefined;
		self._currentCmd = undefined;
		self._response = {};

		self.CONSTANTS = (() => {
				let obj = {
					ADDR: {},
				};

				for(const key in ONEPARAM){
					const {addr, val} = ONEPARAM[key];

					if(addr !== undefined){
						obj.ADDR[key.toUpperCase()] = addr;
					}
					obj = {...obj, ...val}
				}

				return obj;
			})();

		self._device = {
			addr,
			ip,
			port,
			baud,
			path,
		};
	}

	/**
	 *	emit data if only there is at least 1 listener
	 *	@private
	 *	@param {string} eventName - event name to be emitted
	 *	@param {*} value - event data, any datatype can be emitted
	 * */
	_emit(eventName, ...values){
		const self = this;

		if(self.listenerCount(eventName) > 0){
			self.emit(eventName, ...values);
		}
	}

	/**
	 *	split response from reader into several blocks
	 *	@private
	 *	@param {buffer} received - response from reader
	 *	@returns {Object} event data, any datatype can be emitted
	 * */
	_splitResponseBlock(received){
		const length = received.length;
		return {
			header: received.slice(0,2),
			length: received.slice(2,4),
			address: received.slice(4,5),
			cmd: received.slice(5,6),
			status: received.slice(6,7),
			data: received.slice(7, length - 1),
			checksum: received.slice(length - 1, length),
		};
	}

	connect(){
		const self = this;

		self._client = new net.Socket();
		self._client.connect(self._device.port, self._device.ip);

		self._client.on('data', received => {
			if(!self._confirmChecksum(received)){
				self._emit('error', {
						status: false,
						error: 'Checksum doesn\'t match',
						raw: received,
					});
				return;
			}

			const blocks = self._splitResponseBlock(received);
			const cmd = blocks.cmd[0];

			const emitted = {
				cmd,
				name: CMD.REVERSED[cmd],
				status: Boolean(blocks.status[0]),
				raw: received,
				blocks,
			};

			// parse if it's an ACTIVE_DATA response
			if(cmd === 0x45 && PARSER[cmd] instanceof Function){
				emitted.parsed = PARSER[cmd](blocks.data);
			}

			self._response[emitted.cmd] = emitted;

			self._emit('data', emitted);
			self._currentCmd = undefined;
		});
	}

	_calculateChecksum(bytes){
		let checksum = 0;
		for(const byte of bytes){
			checksum = (checksum + byte) & 0xff;
		}

		// offset by 1 to compensate the checksum byte
		checksum = (~checksum) + 1;

		return checksum & 0xff;
	}

	_confirmChecksum(packet){
		const self = this;

		const len = packet.length;
		const checksum = packet[len - 1];
		let sum = 0;

		for(let idx = 0; idx < len - 1; idx++){
			sum = (sum + packet[idx]) & 0xff;
		}

		return ((sum + checksum) & 0xff) == 0;
	};

	_waitUntilFinished(ms = 5){
		const self = this;

		return new Promise(async resolve => {
			while(self._currentCmd !== undefined){
				await sleep(ms);
			}

			resolve(true);
		});
	};

	_waitForResponse(cmd, ms = 5){
		const self = this;

		return new Promise(async resolve => {
			while(self._response[cmd] == undefined){
				await sleep(ms);
			}

			const _response = self._response[cmd];
			self._response[cmd] = undefined;

			if(PARSER[cmd] instanceof Function){
				_response.parsed = PARSER[cmd](_response.blocks.data);
			}

			resolve(_response);
		});
	};

	async _send(cmd, payload = []){
		const self = this;

		await self._waitUntilFinished();

		self._currentCmd = cmd;
		self._response[cmd] = undefined;

		self._client.write(self.packet(cmd, payload));

		return self._waitForResponse(cmd);
	};

	packet(cmd, payload = []){
		const self = this;

		const data = [self._device.addr, cmd, ...payload];
		const dLength = data.length + 1
		const fLength = [
			(dLength >> 8) & 0xff,
			dLength & 0xff,
		];

		const packet = [
				...HEADERS.SEND,
				...fLength,
				self._device.addr,
				cmd,
				...payload,
			];

		packet.push(self._calculateChecksum(packet));

		return Buffer.from(packet);
	}

	async readSystemParam(){
		const self = this;
		return self._send(CMD.READ_SYSTEM_PARAM);
	};

	async readDeviceParam(){
		const self = this;
		return self._send(CMD.READ_DEVICE_PARAM);
	};

	async setDeviceOneParam(param, value){
		const self = this;
		return self._send(CMD.SET_DEVICE_ONEPARAM, [param, value]);
	}

	async readDeviceOneParam(param){
		const self = this;
		return self._send(CMD.READ_DEVICE_ONEPARAM, [param]);
	}

	async setActiveReading(isOn){
		const self = this;
		return self._send(isOn ? CMD.START_READ : CMD.STOP_READ);
	}

	async setRelay(isOn){
		const self = this;
		return self._send(isOn ? CMD.CLOSE_RELAY : CMD.RELEASE_RELAY);
	}

	/**
	 *	Read tag data
	 *	@param {object} options - tag options
	 *	@param {number} options.section - tag section where data will be read
	 *	@param {number} options.start - first tag data address
	 *	@param {number} options.length - how many bytes of data will be read
	 *	@param {[number, number, number, number]} [options.password=] - tag's password, default to [0,0,0,0]
	 *	@returns {Object} event data, any datatype can be emitted
	 * */
	async readTagData(options = {}){
		const self = this;

		if(!Array.isArray(options.password)){
			options.password = [0x00, 0x00, 0x00, 0x00];
		}

		const params = [
			options.section % 4,
			options.start & 0xff,
			Math.ceil(options.length/2) & 0xff,
			...options.password,
		];

		return self._send(CMD.READ_TAG_DATA, params);
	}

	/**
	 *	Write tag data
	 *	@param {object} options - tag options
	 *	@param {number} options.section - tag section where data will be read
	 *	@param {number} options.start - first tag data address
	 *	@param {number[]} options.data - data to write
	 *	@param {[number, number, number, number]} [options.password=] - tag's password, default to [0,0,0,0]
	 *	@returns {Object} event data, any datatype can be emitted
	 * */
	async writeTagData(options = {}){
		const self = this;

		if(!Array.isArray(options.password)){
			options.password = [0x00, 0x00, 0x00, 0x00];
		}

		const params = [
			options.section % 4,
			options.start & 0xff,
			parseInt(options.data.length / 2),
			...options.password,
			...options.data,
		];

		return self._send(CMD.WRITE_TAG_DATA, params);
	}
}

module.exports = _chafon_ru5300;
