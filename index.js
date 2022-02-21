global.__basedir = __dirname;
const _chafon = require(`${__basedir}/lib/chafon_ru5300.lib.js`);
const net = require('net');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const chafon = new _chafon({
			addr: 0x00,
			ip: '192.168.85.244',
			port: 60000
		});
const { CONSTANTS } = chafon;

chafon.on('data', received => {
	console.dir(received, {depth:null});
});

chafon.on('error', received => {
	console.error(received);
});

chafon.connect();

(async () => {
	await chafon.setActiveReading(CONSTANTS.ACTIVE_READING_ON);

	const setBeep = await chafon.setDeviceOneParam(
			CONSTANTS.ADDR.BEEP,
			CONSTANTS.BEEP_DISABLE
		);
	console.log(setBeep);

	const setToRJ45 = await chafon.setDeviceOneParam(
			CONSTANTS.ADDR.TRANSPORT,
			CONSTANTS.T_RJ45
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

	await sleep(5000);

	await chafon.setActiveReading(CONSTANTS.ACTIVE_READING_ON);

	console.log(await chafon.readDeviceOneParam(CONSTANTS.ADDR.TRANSPORT));
	//~ process.exit(0);
})();
