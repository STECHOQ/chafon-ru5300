const _chafon = require('.');

const config = {
	addr: 0x00,
	ip: '192.168.1.250',
	port: 60000,
	autostart: true,
};

//~ const net = require('net');
//~ const transport = new net.Socket();
//~ transport.connect(config.port, config.ip);

const SerialHelper = require('@iqrok/serial.helper')
const transport = new SerialHelper({
		port: '/dev/serial/by-id/usb-Prolific_Technology_Inc._USB-Serial_Controller_ATAPb11A921-if00-port0',
		baud: 115200,
		parser: { type: 'InterByteTimeout', interval: 20 },
	});

const chafon = new _chafon({ ...config, transport });
const { CONSTANTS } = chafon;
chafon.connect();

chafon.on('data', received => {
	//~ console.dir(received, {depth:null});
	if (!received?.data) return;

	for (const tags of received.data.tags) {
		const { tagId } = tags;
		const id = Buffer.from(tagId);
		console.log(id, id.toString('hex'));
	}
});

chafon.on('error', received => {
	console.error(received);
});

chafon.connect();

(async () => {
	//~ console.log(CONSTANTS);
	await chafon.setActiveReading(CONSTANTS.ACTIVE_READING_ON);

	const setBeep = await chafon.setDeviceOneParam(
			CONSTANTS.ADDR.BEEP,
			CONSTANTS.BEEP_ENABLE
		);
	console.log(setBeep);

	const setToRJ45 = await chafon.setDeviceOneParam(
			CONSTANTS.ADDR.TRANSPORT,
			CONSTANTS.T_RS232,
			//~ CONSTANTS.T_RJ45,
		);
	console.log(setToRJ45);

	const system = await chafon.readSystemParam();
	const device = await chafon.readDeviceParam();

	console.log(system, device);

	console.log(await chafon.readTagData({
		section: CONSTANTS.SC_USER,
		start: 0x02,
		length: 0x08,
		password: [0x00, 0x00,0x00, 0x00],
	}));

	console.log(await chafon.writeTagData({
		section: CONSTANTS.SC_USER,
		start: 0x02,
		data: [1,2,3,4,5,6,7,8],
		password: [0x00, 0x00,0x00, 0x00],
	}));

	console.log(await chafon.readTagData({
		section: CONSTANTS.SC_USER,
		start: 0x02,
		length: 0x08,
		password: [0x00, 0x00,0x00, 0x00],
	}));

	await chafon.setActiveReading(CONSTANTS.ACTIVE_READING_ON);

	console.log(await chafon.readDeviceOneParam(CONSTANTS.ADDR.TRANSPORT));
	//~ process.exit(0);
})();
