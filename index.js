global.__basedir = __dirname;
const _chafon = require(`${__basedir}/lib/chafon_ru5300.lib.js`);
const net = require('net');

const data = [0xC3, 0x55, 0x00, 0x01, 0x00, 0x00, 0x1A, 0x01, 0x02, 0x31, 0x80, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x1E, 0x0A, 0x0F, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
//~ client.connect(60000, '192.168.85.244', function() {
const chafon = new _chafon(0x00, '192.168.85.244', 60000);

chafon.on('data', received => {
	//~ console.dir(received, {depth:null});
});

chafon.connect();

(async () => {
	await chafon.setActiveReading(false);

	const system = await chafon.readSystemParam();
	const device = await chafon.readDeviceParam();

	//~ console.log(system, device);

	console.log(await chafon.readTagData({
		section: chafon.CONSTANTS.section.val.USER,
		start: 0x02,
		length: 0x08,
		password: [0x00, 0x00,0x00, 0x00],
	}));

	//~ console.log(await chafon.writeTagData({
		//~ section: chafon.CONSTANTS.section.val.USER,
		//~ start: 0x02,
		//~ data: [1,2,3,4,5,6,7,8],
		//~ password: [0x00, 0x00,0x00, 0x00],
	//~ }));

	console.log(await chafon.readTagData({
		section: chafon.CONSTANTS.section.val.USER,
		start: 0x02,
		length: 0x08,
		password: [0x00, 0x00,0x00, 0x00],
	}));

	await sleep(5000);

	await chafon.setActiveReading(true);

	const setToRJ45 = await chafon.setDeviceOneParam(0x06, 0x00);
	console.log(setToRJ45);

	console.log(await chafon.readDeviceOneParam(0x01, 0x02));
	//~ process.exit(0);
})();

//~ const buffer = chafon.createPacket(0x21, data);
//~ const buffer = chafon.createPacket(0x00, 0x20);
//~ console.log(buffer);

//~ process.exit();

//~ 53570003ffe074
//~ 53570025FF21C355000100001A010231800000000100001E0A0F000000000000000000000000
