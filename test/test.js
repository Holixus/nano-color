var c = require('../index.js'),
    assert = require('core-assert');

var timer = function (ms, v) {
	return new Promise(function (resolve, reject) {
		var to = setTimeout(function () {
				resolve(v);
			}, ms);
		return { cancel: function () {
			clearTimeout(to);
		}};
	});
};

function round_a(v) {
	return ((v*10000+.5)|0)/10000;
}

function round_c(v) {
	return ((v*10+.5)|0)/10;
}

function round_rgb(a) {
	a[0] = round_c(a[0]);
	a[1] = round_c(a[1]);
	a[2] = round_c(a[2]);
	return a;
}

function round_rgba(a) {
	a[0] = round_c(a[0]);
	a[1] = round_c(a[1]);
	a[2] = round_c(a[2]);
	a[3] = round_c(a[3]);
	return a;
}

function round_hsv(a) {
	a[0] = round_c(a[0]);
	a[1] = round_a(a[1]);
	a[2] = round_a(a[2]);
	return a;
}

function round_hsva(a) {
	a[0] = round_c(a[0]);
	a[1] = round_a(a[1]);
	a[2] = round_a(a[2]);
	a[3] = round_a(a[3]);
	return a;
}

function hsva2irgba_tests(pairs) {
	for (var i = 0, n = pairs.length; i < n; i += 2)
		(function (hsva, irgba) {
			test('hsva2irgba('+hsva.join(',')+') -> 0x'+irgba.toString(16)+'', function (done) {
				assert.strictEqual(irgba, c.hsva2irgba.apply(c, hsva));
				done();
			});
		})(pairs[i], pairs[i+1]);
}

function ts(a, radix, deep) {
	switch (typeof a) {
	case 'object':
		if (a instanceof Array) {
			var o = [];
			for (var i = 0, n = a.length; i < n; ++i)
				o[i] = ts(a[i], radix, 1);
			return deep ? '['+o.join(',')+']' : o.join(',');
		} else {
			if (a === null)
				return 'null';
			var o = [];
			for (var id in a)
				o.push(id+':'+ts(a[id], radix, 1));
			return '{' + o.join(',') + '}';
		}
		break;
	case 'string':
		var qc = 0, dqc = 0;
		for (var i = 0, n = a.length; i < n; ++i)
			switch (a.charAt(i)) {
			case "'": ++qc; break;
			case '"': ++dqc; break;
			}
		if (qc <= dqc) {
			return '"' + a.replace(/["\t\n\r]/g, function (m) { //"
				switch (m) {
				case '"':	return '\\"';
				case '\t':  return '\\t';
				case '\n':  return '\\n';
				case '\r':  return '\\r';
				default:    return m;
				}
			}) + '"';
		} else {
			return "'" + a.replace(/['\t\n\r]/g, function (m) { //'
				switch (m) {
				case "'":	return "\\'";
				case '\t':  return '\\t';
				case '\n':  return '\\n';
				case '\r':  return '\\r';
				default:    return m;
				}
			}) + "'";
		}
	case 'number':
		switch (radix) {
		case 2:
		case undefined:
		default:
			return '0b'+a.toString(2);
		case 10:
			return a.toString(10);
		case 16:
			return '0x'+a.toString(16);
		case 8:
			return '0o'+a.toString(8);
		}
	case 'undefined':
		return 'undefined';
	case 'function':
	case 'boolean':
		return a.toString();
	}
}

function massive(name, fn, pairs, sradix, dradix, gamma) {
	suite(name, function () {
		for (var i = 0, n = pairs.length; i < n; i += 2)
			(function (args, ret) {
				test(fn.name+'('+ts(args, sradix)+') -> '+ts(ret, dradix)+'', function (done) {
					c.setGamma(gamma || 1);
					assert.deepStrictEqual(args instanceof Array ? fn.apply(null, args) : fn.call(null, args), ret);
					done();
				});
			})(pairs[i], pairs[i+1]);
	});
}

function massive_reversed(name, fn, pairs, sradix, dradix, gamma) {
	suite(name, function () {
		for (var i = 0, n = pairs.length; i < n; i += 2)
			(function (args, ret) {
				test(fn.name+'('+ts(args, sradix)+') -> '+ts(ret, dradix)+'', function (done) {
					c.setGamma(gamma || 1);
					assert.deepStrictEqual(args instanceof Array ? fn.apply(null, args) : fn.call(null, args), ret);
					done();
				});
			})(pairs[i+1], pairs[i]);
	});
}

var rgb_vs_hsv_samples = [
	[   0,   0,   0 ], [   0,0,0 ],
	[ 255, 255, 255 ], [   0,0,1 ],
	[ 255,   0,   0 ], [   0,1,1 ],
	[ 255, 255,   0 ], [  60,1,1 ],
	[   0, 255,   0 ], [ 120,1,1 ],
	[   0, 255, 255 ], [ 180,1,1 ],
	[   0,   0, 255 ], [ 240,1,1 ],
	[ 255,   0, 255 ], [ 300,1,1 ],
	[   0,   0,   0 ], [   0,0,0.000 ],
	[ 128, 128, 128 ], [   0,0,0.502 ],
	[ 128,   0,   0 ], [   0,1,0.502 ],
	[ 128, 128,   0 ], [  60,1,0.502 ],
	[   0, 128,   0 ], [ 120,1,0.502 ],
	[   0, 128, 128 ], [ 180,1,0.502 ],
	[   0,   0, 128 ], [ 240,1,0.502 ],
	[ 128,   0, 128 ], [ 300,1,0.502 ]
], rgba_vs_hsva_samples = [
	[   0,   0,   0,   0 ], [   0,0,0, 0      ],
	[ 255, 255, 255,   1 ], [   0,0,1, 0.0039 ],
	[ 255,   0,   0,  10 ], [   0,1,1, 0.0392 ],
	[ 255, 255,   0,  40 ], [  60,1,1, 0.1569 ],
	[   0, 255,   0, 100 ], [ 120,1,1, 0.3922 ],
	[   0, 255, 255, 201 ], [ 180,1,1, 0.7882 ],
	[   0,   0, 255, 254 ], [ 240,1,1, 0.9961 ],
	[ 255,   0, 255, 255 ], [ 300,1,1, 1      ],
	[   0,   0,   0,   0 ], [   0,0,0.000, 0      ],
	[ 128, 128, 128,   1 ], [   0,0,0.502, 0.0039 ],
	[ 128,   0,   0,  10 ], [   0,1,0.502, 0.0392 ],
	[ 128, 128,   0,  40 ], [  60,1,0.502, 0.1569 ],
	[   0, 128,   0, 100 ], [ 120,1,0.502, 0.3922 ],
	[   0, 128, 128, 201 ], [ 180,1,0.502, 0.7882 ],
	[   0,   0, 128, 254 ], [ 240,1,0.502, 0.9961 ],
	[ 128,   0, 128, 255 ], [ 300,1,0.502, 1      ]
], rgb_vs_hex_samples = [
	[   0,   0,   0 ], '#000000',
	[   1,   1,   1 ], '#010101',
	[  11,  11,  11 ], '#0b0b0b',
	[ 255, 255, 255 ], '#ffffff',
	[ 255,   0,   0 ], '#ff0000',
	[ 255, 255,   0 ], '#ffff00',
	[   0, 255,   0 ], '#00ff00',
	[   0, 255, 255 ], '#00ffff',
	[   0,   0, 255 ], '#0000ff',
	[ 255,   0, 255 ], '#ff00ff',
	[ 128, 128, 128 ], '#808080',
	[ 128,   0,   0 ], '#800000',
	[ 128, 128,   0 ], '#808000',
	[   0, 128,   0 ], '#008000',
	[   0, 128, 128 ], '#008080',
	[   0,   0, 128 ], '#000080',
	[ 128,   0, 128 ], '#800080'
], rgba_vs_hex_samples = [
	[   0,   0,   0,   0 ], '#00000000',
	[   1,   1,   1,   1 ], '#01010101',
	[  11,  11,  11,  10 ], '#0b0b0b0a',
	[ 255, 255, 255,  40 ], '#ffffff28',
	[ 255,   0,   0, 100 ], '#ff000064',
	[ 255, 255,   0, 201 ], '#ffff00c9',
	[   0, 255,   0, 254 ], '#00ff00fe',
	[   0, 255, 255, 255 ], '#00ffffff',
	[   0,   0, 255,   0 ], '#0000ff00',
	[ 255,   0, 255,  15 ], '#ff00ff0f',
	[ 128, 128, 128,  10 ], '#8080800a',
	[ 128,   0,   0,  47 ], '#8000002f',
	[ 128, 128,   0, 105 ], '#80800069',
	[   0, 128,   0, 208 ], '#008000d0',
	[   0, 128, 128, 254 ], '#008080fe',
	[   0,   0, 128, 255 ], '#000080ff',
	[ 128,   0, 128, 128 ], '#80008080'
];

suite('nano-color gamma = 1', function () {

	massive('rgb -> hsv', function () {
		return round_hsv(c.rgb2hsv.apply(c, arguments));
	}, rgb_vs_hsv_samples, 10, 10);

	massive_reversed('hsv -> rgb', function () {
		return round_rgb(c.hsv2rgb.apply(c, arguments));
	}, rgb_vs_hsv_samples, 10, 10);

	massive_reversed('hsv -> rgb (special)', function () {
		return round_rgb(c.hsv2rgb.apply(c, arguments));
	}, [
			[   0,   0,   0 ], [   0,0,0 ],
			[   0,   0,   0 ], [ 360,0,0 ],
			[   0,   0,   0 ], [-360,0,0 ],
			[ 255, 255, 255 ], [   0,0,2 ],
			[ 255,   0,   0 ], [   0,2,1 ],
			[ 255, 255,   0 ], [  60,2,1 ],
			[ 255, 255,   0 ], [ 420,2,1 ],
			[   0, 255,   0 ], [ 120,2,2 ],
			[   0, 255, 255 ], [ 180,2,1 ],
			[   0,   0, 255 ], [ 240,2,2 ],
			[   0,   0, 255 ], [-120,2,2 ],
			[ 255,   0, 255 ], [ 300,2,1 ]
	], 10, 10);

	massive('rgba -> hsva', function () {
		return round_hsva(c.rgba2hsva.apply(c, arguments));
	}, rgba_vs_hsva_samples, 10, 10);

	massive_reversed('hsva -> rgba', function () {
		return round_rgba(c.hsva2rgba.apply(c, arguments));
	}, rgba_vs_hsva_samples, 10, 10);

	massive('rgb -> hex', function () {
		return c.rgb2hex.call(c, arguments);
	}, rgb_vs_hex_samples, 10, 10);

	massive_reversed('hex -> rgb', function () {
		return c.hex2rgb.apply(c, arguments);
	}, rgb_vs_hex_samples, 10, 10);

	massive('rgba -> hex', function () {
		return c.rgba2hex.call(c, arguments);
	}, rgba_vs_hex_samples, 10, 10);

	massive_reversed('hex -> rgba', function () {
		return c.hex2rgba.apply(c, arguments);
	}, rgba_vs_hex_samples, 10, 10);

	massive('hex[3,8] -> rgb', function () {
		return c.hex2rgb.apply(c, arguments);
	}, [
		'#abc',      [ 170, 187, 204 ],
		'#abc4',     [ 170, 187, 204 ],
		'#aabbcc44', [ 170, 187, 204 ],
		'',          [ 255, 255, 255 ]
	], 10, 10);

	massive('hex[3,8] -> rgba', function () {
		return c.hex2rgba.apply(c, arguments);
	}, [
		'#abc',      [ 170, 187, 204, 255 ],
		'#abc4',     [ 170, 187, 204, 68 ],
		'#aabbcc',   [ 170, 187, 204, 255  ],
		'#aabbcc44', [ 170, 187, 204, 68  ],
		'',          [ 255, 255, 255, 255 ]
	], 10, 10);

	massive('hsva2irgba', c.hsva2irgba, [
			[   0,0,0, 0      ], 0x00000000,
			[   0,0,1, 0.0039 ], 0xffffff01,
			[   0,1,1, 0.0392 ], 0xff00000a,
			[  60,1,1, 0.1569 ], 0xffff0028,
			[ 120,1,1, 0.3922 ], 0x00ff0064,
			[ 180,1,1, 0.7882 ], 0x00ffffc9,
			[ 240,1,1, 0.9961 ], 0x0000fffe,
			[ 300,1,1, 1      ], 0xff00ffff,
			[   0,0,0.502, 0.0039 ], 0x80808001,
			[   0,1,0.502, 0.0392 ], 0x8000000a,
			[  60,1,0.502, 0.1569 ], 0x80800028,
			[ 120,1,0.502, 0.3922 ], 0x00800064,
			[ 180,1,0.502, 0.7882 ], 0x008080c9,
			[ 240,1,0.502, 0.9961 ], 0x000080fe,
			[ 300,1,0.502, 1      ], 0x800080ff
		], 10, 16);

	massive('irgb2array', c.irgb2array, [
			0x000000, [ 0, 0, 0 ],
			0x010203, [ 1, 2, 3 ],
			0xFFFFFF, [ 255, 255, 255 ],
			0xF0F0F0, [ 240, 240, 240 ]
		], 16, 10);

	massive('irgba2array', c.irgba2array, [
			0x00000000, [ 0, 0, 0, 0 ],
			0x01020304, [ 1, 2, 3, 4 ],
			0xFFFFFFFF, [ 255, 255, 255, 255 ],
			0xF0F0F0F0, [ 240, 240, 240, 240 ]
		], 16, 10);

	massive('hsv_filter', function (d, h, s, v) {
			var d = [ d[0], d[1], d[2], d[3] ];
			c.hsv_filter(d, 0, h, s, v);
			return d;
		}, [
			[ [ 255, 0, 0, 255 ], 0, 0, 1 ], [ 120,120,120,255 ]
		], 10, 10, 1.6);

	massive('colorify_filter', function (d, h, s, v) {
			var d = [ d[0], d[1], d[2], d[3] ];
			c.colorify_filter(d, 0, h, s, v);
			return d;
		}, [
			[ [ 0, 0, 255, 255 ], 0, 1, 1 ], [ 255,0,0,255 ],
			[ [ 0, 128, 0, 255 ], 0, 1, 1 ], [ 128,0,0,255 ],
			[ [ 0, 255, 0, 255 ], 0, 1, 1 ], [ 255,0,0,255 ],
			[ [ 255, , 0, 255 ], 120, 1, -1 ], [ 0,96,0,255 ],
			[ [ 0, 255, 0, 255 ], 0, .5, 1 ], [ 255,165,165,255 ]
		], 10, 10, 1.6);3

	massive('gradient', function (x1, x2, gr) {
			var d = [];
			c.gradient(x1, x2, gr, function (i, rgba) {
				var addr = i*4;
				d[addr  ] = rgba[0];
				d[addr+1] = rgba[1];
				d[addr+2] = rgba[2];
				d[addr+3] = rgba[3];
			});
			return d;
		}, [
			[ 0, 10, { 0: '#000', 4000: '#1234', 6000: 0x33445566, 10000: [ 255, 255, 255, 255 ] } ], [
				0, 0, 0, 255,
				4, 9, 13, 208,
				9, 17, 26, 162,
				13, 26, 38, 115,
				17, 34, 51, 68,
				34, 51, 68, 85,
				51, 68, 85, 102,
				102, 115, 128, 140,
				153, 162, 170, 179,
				204, 208, 213, 217,
				255, 255, 255, 255
			],
			[ 0, 10, { 0: '#000', 4002: '#1234', 6500: 0x33445566, 10000: [ 255, 255, 7 ] } ], [
				0, 0, 0, 255,
				4, 8, 13, 208,
				8, 17, 25, 162,
				13, 25, 38, 115,
				17, 34, 51, 68,
				31, 48, 65, 82,
				48, 65, 82, 99,
				80, 95, 74, 124,
				138, 148, 52, 168,
				197, 202, 29, 211,
				255, 255, 7, 255
			]
		], 10, 10, 1.6);

	test('gradient throw', function (done) {
		try {
			c.gradient(0, 10, { 0: {q:1}, 10000: undefined }, function () {});
		} catch (e) {
			return done();
		}
		done(Error('not thrown'));
	});

	massive('put_rgb', function (d, rgba) {
			var d = [ d[0], d[1], d[2], d[3] ];
			c.put_rgb(d, 0, rgba);
			return d;
		}, [
			[ [ 0, 0, 0, 0 ], [ 255, 255, 255, 255] ], [ 255, 255, 255, 0 ],
			[ [ 0, 0, 0, 0 ], [ 255, 255, 255, 128] ], [ 128, 128, 128, 0 ]
		], 10, 10, 1.6);

	massive('put_rgba', function (d, rgba) {
			var d = [ d[0], d[1], d[2], d[3] ];
			c.put_rgba(d, 0, rgba);
			return d;
		}, [
			[ [ 0, 0, 0, 255 ], [ 255, 255, 255, 255] ], [ 255, 255, 255, 255 ],
			[ [ 0, 0, 0, 255 ], [ 255, 255, 255, 128] ], [ 128, 128, 128, 128 ]
		], 10, 10, 1.6);

});
