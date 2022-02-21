const DEVICES = {
	0xC3: 'RU5300',
	PARAMS: {
		bTransport: {
			0: 'T_USB',
			1: 'T_RS232',
			2: 'T_RJ45',
			3: 'T_WIFI',
			4: 'T_WIEGAND',
		},
		bWorkMode: {
			0: 'M_ANSWER',
			1: 'M_ACTIVE',
			2: 'M_TRIGGER',
		},
		bUartBaudRate: {
			0: 'BPS_9600',
			1: 'BPS_19200',
			2: 'BPS_38400',
			3: 'BPS_57600',
			4: 'BPS_115200',
		},
		bSection: {
			0: 'SC_EPC',
			1: 'SC_TID',
			2: 'SC_USER',
			3: 'SC_EPC+TID',
		},
		bWgProtocol:{
			0: 'WG26',
			1: 'WG34',
		},
		bWgOutPutMode:{
			0: 'BIG_ENDIAN',
			1: 'LITTLE_ENDIAN',
		},
		bFrequency: (bytes) => {
			const bHi = bytes[0];
			const bLo = bytes[1];

			const _bands = fBand => {
				switch(fBand){
					case 0x01: return {
							type: 'CHINA2',
							offset: 920.125,
							multiplier: 0.25,
						};
						break;

					case 0x02: return {
							type: 'US',
							offset: 902.75,
							multiplier: 0.5,
						};
						break;

					case 0x03: return {
							type: 'KOREA',
							offset: 917.1,
							multiplier: 0.2,
						};
						break;

					case 0x04: return {
							type: 'EU',
							offset: 865.1,
							multiplier: 0.2,
						};
						break;

					case 0x06: return {
							type: 'UKRAINE',
							offset: 868.0,
							multiplier: 0.1,
						};
						break;

					case 0x07: return {
							type: 'PERU',
							offset: 916.2,
							multiplier: 0.9,
						};
						break;

					case 0x08: return {
							type: 'CHINA1',
							offset: 840.125,
							multiplier: 0.25,
						};
						break;

					case 0x09: return {
							type: 'EU3',
							offset: 865.7,
							multiplier: 0.6,
						};
						break;

					case 0x0a: return {
							type: 'TAIWAN',
							offset: 922.25,
							multiplier: 0.5,
						};
						break;

					case 0x0c: return {
							type: 'US3',
							offset: 902,
							multiplier: 0.5,
						};
						break;

					default: return {
							type: 'UNKNOWN',
							offset: 0,
							multiplier: 1,
						};
						break;
				};
			};

			const fBand = _bands(((bHi & 0xc0) | ((bLo & 0xc0) >> 2)) >> 4);
			const nMax = bHi & 0x3f;
			const nMin = bLo & 0x3f;

			return {
					band: fBand.type,
					max: nMax + fBand.offset * fBand.multiplier,
					min: nMin + fBand.offset * fBand.multiplier,
				};
		}
	},
};

const TAG = {
	PARSE: (tagNumber, data) => {
		const received = [];

		for(let counter = 0, offset = 0; counter < tagNumber; counter++){
			const length = data[offset];
			const chunk = data.slice(offset, offset + length + 1);

			received.push({
					length,
					type: chunk.slice(1,2)[0],
					antenna: chunk.slice(2,3)[0],
					tagId: Array.from(chunk.slice(3, chunk.length - 1)),
					RSSI: chunk.slice(chunk.length - 1, chunk.length)[0],
				});

			offset += length;
		}

		return received;
	},
};

const HEADERS = {
	SEND: [0x53, 0x57],
	RECEIVE: [0x43, 0x54],
};

const CMD = {
	REVERSED: {
		0x10: 'READ_SYSTEM_PARAM',
		0x20: 'READ_DEVICE_PARAM',
		0x21: 'SET_DEVICE_PARAM',
		0x22: 'DEFAULT_DEVICE_PARAM',
		0x23: 'READ_DEVICE_ONEPARAM',
		0x24: 'SET_DEVICE_ONEPARAM',
		0x26: 'READ_DEVICENET_PARAM',
		0x27: 'SET_DEVICENET_PARAM',
		0x28: 'DEFAULT_DEVICENET_PARAM',
		0x2B: 'READ_DEVICE_TIME',
		0x2C: 'SET_DEVICE_TIME',
		0x2E: 'READ_DEVICE_SPECIAL_PARAM',
		0x2F: 'SET_DEVICE_SPECIAL_PARAM',
		0x3E: 'READ_FREQ',
		0x3F: 'SET_FREQ',
		0x40: 'STOP_READ',
		0x41: 'START_READ',
		0x45: 'ACTIVE_DATA',
		0xE0: 'CHECK_MODULE',
		0xE1: 'CHECK_ANT',
		0x85: 'CLOSE_RELAY',
		0x86: 'RELEASE_RELAY',
		0xFF: 'HEARTBEAT_PACK',
		0x01: 'INVENTORY_TAG',
		0x02: 'READ_TAG_DATA',
		0x03: 'WRITE_TAG_DATA',
	},
	READ_SYSTEM_PARAM: 0x10,
	READ_DEVICE_PARAM: 0x20,
	SET_DEVICE_PARAM: 0x21,
	DEFAULT_DEVICE_PARAM: 0x22,
	READ_DEVICE_ONEPARAM: 0x23,
	SET_DEVICE_ONEPARAM: 0x24,
	READ_DEVICENET_PARAM: 0x26,
	SET_DEVICENET_PARAM: 0x27,
	DEFAULT_DEVICENET_PARAM: 0x28,
	READ_DEVICE_TIME: 0x2B,
	SET_DEVICE_TIME: 0x2C,
	READ_DEVICE_SPECIAL_PARAM: 0x2E,
	SET_DEVICE_SPECIAL_PARAM: 0x2F,
	READ_FREQ: 0x3E,
	SET_FREQ: 0x3F,
	STOP_READ: 0x40,
	START_READ: 0x41,
	ACTIVE_DATA: 0x45,
	CHECK_MODULE: 0xE0,
	CHECK_ANT: 0xE1,
	CLOSE_RELAY: 0x85,
	RELEASE_RELAY: 0x86,
	HEARTBEAT_PACK: 0xFF,
	INVENTORY_TAG: 0x01,
	READ_TAG_DATA: 0x02,
	WRITE_TAG_DATA: 0x03,
};

const PARSER = {
	0x10: (data) => {
		return {
			version: {
				software: data.slice(0,1)[0].toString(16),
				hardware: data.slice(1,2)[0].toString(16),
			},
			SN: Array.from(data.slice(2,data.length))
				.map(x => x.toString(16))
				.join(''),
		};
	},
	0x20: (data) => {
		return {
			device: DEVICES[data.slice(0,1)[0]],
			defParam: data.slice(1,2)[0],
			transport: DEVICES.PARAMS.bTransport[data.slice(2,3)[0]],
			workMode: DEVICES.PARAMS.bWorkMode[data.slice(3,4)[0]],
			address: data.slice(4,5)[0],
			filterTime: data.slice(5,6)[0],
			RFPower: data.slice(6,7)[0],
			beep: Boolean(data.slice(7,8)[0]),
			baud: DEVICES.PARAMS.bUartBaudRate[data.slice(8,9)[0]],
			frequency: DEVICES.PARAMS.bFrequency(data.slice(9,11)),
			section: DEVICES.PARAMS.bSection[data.slice(11,12)[0]],
			startPos: data.slice(12,13)[0],
			scanLength: data.slice(13,14)[0],
			triggerTime: data.slice(14,15)[0],
			wgProtocol: DEVICES.PARAMS.bWgProtocol[data.slice(15,16)[0]],
			wgOutputMode: DEVICES.PARAMS.bWgOutPutMode[data.slice(16,17)[0]],
			wgOutTime: data.slice(17,18)[0],
			wgPulseWidth: data.slice(18,19)[0],
			wgPulseInterval: data.slice(19,20)[0],
			antenna: data.slice(20,22).readInt16BE(),
			QValue: data.slice(22,23)[0],
			session: data.slice(23,24)[0],
		};
	},
	0x21: 'SET_DEVICE_PARAM',
	0x22: 'DEFAULT_DEVICE_PARAM',
	0x23: 'READ_DEVICE_ONEPARAM',
	0x24: 'SET_DEVICE_ONEPARAM',
	0x26: 'READ_DEVICENET_PARAM',
	0x27: 'SET_DEVICENET_PARAM',
	0x28: 'DEFAULT_DEVICENET_PARAM',
	0x2B: 'READ_DEVICE_TIME',
	0x2C: 'SET_DEVICE_TIME',
	0x2E: 'READ_DEVICE_SPECIAL_PARAM',
	0x2F: 'SET_DEVICE_SPECIAL_PARAM',
	0x3E: 'READ_FREQ',
	0x3F: 'SET_FREQ',
	0x40: 'STOP_READ',
	0x41: 'START_READ',
	0x45: (data) => {
			const numOfTags = data.slice(7,8)[0];

			return {
				SN: Array.from(data.slice(0,7))
					.map(x => x.toString(16))
					.join(''),
				numOfTags,
				tags: TAG.PARSE(numOfTags, data.slice(8, data.length)),
			};
		},
	0xE0: 'CHECK_MODULE',
	0xE1: 'CHECK_ANT',
	0x85: 'CLOSE_RELAY',
	0x86: 'RELEASE_RELAY',
	0xFF: 'HEARTBEAT_PACK',
	0x01: 'INVENTORY_TAG',
	0x02: 'READ_TAG_DATA',
	0x03: 'WRITE_TAG_DATA',
};

const ONEPARAM = {
	transport: {
		addr: 0x01,
		val: {
			T_USB: 0x00,
			T_RS232: 0x01,
			T_RJ45: 0x02,
			T_WIFI: 0x03,
			T_WIEGAND: 0x04,
		},
	},

	workMode: {
		addr: 0x02,
		val: {
			M_ANSWER: 0x00,
			M_ACTIVE: 0x01,
			M_TRIGGER: 0x02,
		},
	},

	tagAddr: {
		addr: 0x03,
		val: {},
	},

	filterTime: {
		addr: 0x04,
		val: {},
	},

	RFPower: {
		addr: 0x05,
		val: {},
	},

	beep: {
		addr: 0x06,
		val: {
			BEEP_DISABLE: 0x00,
			BEEP_ENABLE: 0x01,
		},
	},

	baud: {
		addr: 0x07,
		val: {
			BPS_9600: 0x00,
			BPS_19200: 0x01,
			BPS_38400: 0x02,
			BPS_57600: 0x03,
			BPS_115200: 0x04,
		},
	},

	section: {
		val: {
			SC_RESERVED: 0x00,
			SC_EPC: 0x01,
			SC_TID: 0x02,
			SC_USER: 0x03,
		},
	},

	relay: {
		val: {
			RELAY_CLOSE: true,
			RELAY_OPEN: false,
		}
	},

	activeReading: {
		val: {
			ACTIVE_READING_ON: true,
			ACTIVE_READING_OFF: false,
		}
	},
};

module.exports = {HEADERS, CMD, PARSER, ONEPARAM};
