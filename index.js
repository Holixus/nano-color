"use strict";

var exports = module.exports;

/* --------------------------------------------------------------------------------------- */
var hsv_angle_correction = false,
    hsv_gamma = 1.6;

/* --- value to byte ------------------------------------------------------------------------------------ */
var v2b/* = function _v2b(v) {
	return Math.pow(v, 1/hsv_gamma) * 255 + .5 | 0;
}*/;

/* --- byte to value ------------------------------------------------------------------------------------ */
var b2v/* = function _b2v(v) {
	return Math.pow(v/255, hsv_gamma);
}*/;

/* --------------------------------------------------------------------------------------- */
exports.setGamma = function setGamma(g) {
	var gamma = 1/g;
	if (gamma === hsv_gamma)
		return;

	hsv_gamma = gamma;

	var c = 30000, inv = 30000,
	    hsv_lut = [],
	    rgb_lut = [];

	for (var i = 0; i <= c; ++i)
		hsv_lut[i] = Math.pow(i/c, gamma) * 255 + .5 | 0;

	for (var i = 0; i <= inv; ++i)
		rgb_lut[i] = Math.pow(i/inv, g);

	v2b = function (v) {
		return hsv_lut[(v*c+.5)>>0];
	}

	b2v = function (v) {
		return rgb_lut[v/255*inv+.5|0];
	}
};

exports.setGamma(1.6);

/* --------------------------------------------------------------------------------------- */
// (R,G,B) return [ h,s,v ];
var rgb2hsv = exports.rgb2hsv = function rgb2hsv(R,G,B) {
	var r = b2v(R), g = b2v(G), b = b2v(B);

	var V = Math.max(r,g,b),
	    M = V,
	    C = (M - Math.min(r,b,g)),
	    S = C/V;

	if (V < 0.0001)
		return [ 0, 0, 0 ];

	if (S < 0.0001)
		return [ 0, 0, V ];

	switch (M) {
	case r:
		var h = (g-b)/C;
		if (h < 0) h += 6;
		break;
	case g:
		var h = (b-r)/C + 2;
		break;
	case b:
		var h = (r-g)/C + 4;
		break;
	}
	return [ h * 60, S, V];
};

/* --------------------------------------------------------------------------------------- */
function _hsv2rgb(data, addr, H,S,V) {
	if (V < 0.0001) {
		data[addr] = data[addr+1] = data[addr+2] = 0;
		return;
	}

	if (V>1) V = 1;

	if (S == 0) {
		data[addr] = data[addr+1] = data[addr+2] = v2b(V);
		return;
	}

	if (S>1) S = 1;

	var hue = H < 0 ? (H + 360) : (H >= 360 ? H - 360 : H),
	    st = (hue/60),
	    oct = st-(st|0), // [0...1]
	    y = hsv_angle_correction ? /* istanbul ignore next */ Math.sin((oct-.5)*1.0471975512)+.5 : oct,
	    s = S*V,
	    ns = V - s,
	    _ns = v2b(ns),
	    _v = v2b(V);

	switch (st|0) {
	case 0: data[addr] = _v;          data[addr+1] = v2b(ns+s*y); data[addr+2] = _ns;         return;
	case 1: data[addr] = v2b(V-s*y);  data[addr+1] = _v;          data[addr+2] = _ns;         return;
	case 2: data[addr] = _ns;         data[addr+1] = _v;          data[addr+2] = v2b(ns+s*y); return;
	case 3: data[addr] = _ns;         data[addr+1] = v2b(V-s*y);  data[addr+2] = _v;          return;
	case 4: data[addr] = v2b(ns+s*y); data[addr+1] = _ns;         data[addr+2] = _v;          return;
	}
	/*   5: */
	        data[addr] = _v;          data[addr+1] = _ns;         data[addr+2] = v2b(V-s*y);
};

/* --------------------------------------------------------------------------------------- */
// (h,s,v) return [ R, G, B ];
exports.hsv2rgb = function hsv2rgb(H,S,V) {
	var rgb = [ 0, 0, 0 ];
	_hsv2rgb(rgb, 0, H,S,V);
	return rgb;
};

/* --------------------------------------------------------------------------------------- */
// (h,s,v,a) return [ R, G, B, A ];
var hsva2rgba = exports.hsva2rgba = function hsva2rgba(h,s,v,a) {
	var rgb = [ 0, 0, 0, (a*255+.5)&255 ];
	_hsv2rgb(rgb, 0, h,s,v);
	return rgb;
};

/* --------------------------------------------------------------------------------------- */
// (R,G,B,A) return [ h, s, v, a ];
exports.rgba2hsva = function rgba2hsva(R,G,B,A) {
	var hsv = rgb2hsv(R,G,B);
	hsv[3] = (A/255);
	return hsv;
};

function _h(c) {
	//(c+100).toString(16).substr(-2);
	return "0123456789abcdef".charAt(c>>4) + "0123456789abcdef".charAt(c&15);
}

/* --------------------------------------------------------------------------------------- */
// ([r,g,b]) return "#RRGGBB";
exports.rgb2hex = function rgb2hex(rgb) {
	return '#' + _h(rgb[0]+.5|0) + _h(rgb[1]+.5|0) + _h(rgb[2]+.5|0);
};

/* --------------------------------------------------------------------------------------- */
// ([r,g,b,a]) return "#RRGGBBAA";
exports.rgba2hex = function rgba2hex(rgb) {
	return '#' + _h(rgb[0]+.5|0) + _h(rgb[1]+.5|0) + _h(rgb[2]+.5|0) + _h(rgb[3]+.5|0);
};

/* --------------------------------------------------------------------------------------- */
// ('#RRGGBBAA') return [ R, G, B ];
// ('#RRGGBB') return [ R, G, B ];
// ('#RGB') return [ R*17, G*17, B*17 ];
var hex2rgb = exports.hex2rgb = function hex2rgb(h) {
	var hex = h.charAt(0) == '#' ? h.substr(1) : h,
	    i = parseInt(hex, 16);
	switch (hex.length) {
	case 3: return [ ((i>>8)&15) * 0x11, ((i>>4)&15) * 0x11, (i&15) * 0x11 ];
	case 4: return [ ((i>>12)&15) * 0x11, ((i>>8)&15) * 0x11, ((i>>4)&15) * 0x11 ];
	case 6: return [ (i>>16) & 255, (i>>8) & 255, i & 255 ];
	case 8: return [ (i>>24) & 255, (i>>16) & 255, (i>>8) & 255 ];
	}
	return [ 255, 255, 255 ];
};

/* --------------------------------------------------------------------------------------- */
// ('#RRGGBBAA') return [ R, G, B, A ];
// ('#RRGGBB') return [ R, G, B, 255 ];
// ('#RGB') return [ R*17, G*17, B*17, 255 ];
var hex2rgba = exports.hex2rgba = function hex2rgba(hex) {
	if (hex.charAt(0) == '#')
		hex = hex.substr(1);
	var i = parseInt(hex, 16);
	switch (hex.length) {
	case 3: return [ ((i>>8)&15) * 0x11, ((i>>4)&15) * 0x11, (i&15) * 0x11, 255 ];
	case 4: return [ ((i>>12)&15) * 0x11, ((i>>8)&15) * 0x11, ((i>>4)&15) * 0x11, (i&15) * 0x11 ];
	case 6: return [ (i>>16) & 255, (i>>8) & 255, i & 255, 255 ];
	case 8: return [ (i>>24) & 255, (i>>16) & 255, (i>>8) & 255, i & 255 ];
	}
	return [ 255, 255, 255, 255 ];
};


/* --------------------------------------------------------------------------------------- */
// (0xRRGGBB) return [ R, G, B ];
exports.rgb2array = function rgb2array(value) {
	return [ value >> 16, (value >> 8) & 255, value & 255 ];
};

/* --------------------------------------------------------------------------------------- */
// (0xRRGGBBAA) return [ R, G, B, A ];
var rgba2array = exports.rgba2array = function rgba2array(value) {
	return [ (value >> 24)&255, (value >> 16) & 255, (value >> 8) & 255, value & 255 ];
};

/* --------------------------------------------------------------------------------------- */
// (H, S, V, A) return 0xRRGGBBAA;
exports.hsva2irgba = function hsva2irgba(H,S,V, A) {
	var rgba = hsva2rgba(H,S,V,A);
	return 16777216. * ((rgba[0]+.5)|0) + 65536. * ((rgba[1]+.5)|0) + 256. * ((rgba[2]+.5)|0) + rgba[3];
};

/* --------------------------------------------------------------------------------------- */
// [ R, G, B, A] mix to data[addr] by alpha channel
exports.put_rgb = function _rgb(data, addr, rgba) {
	if (rgba[3] == 255) {
		data[addr  ] = rgba[0];
		data[addr+1] = rgba[1];
		data[addr+2] = rgba[2];
		return;
	}
	var a = rgba[3]/255, na = 1/a;
	data[addr  ] = data[addr  ]*na + rgba[0]*a;
	data[addr+1] = data[addr+1]*na + rgba[1]*a;
	data[addr+2] = data[addr+2]*na + rgba[2]*a;
};

/* --------------------------------------------------------------------------------------- */
// [ R, G, B, A] mix to data[addr] with alpha channel
exports.put_rgba = function _rgba(data, addr, rgba) {
	if (rgba[3] == 255) {
		data[addr  ] = rgba[0];
		data[addr+1] = rgba[1];
		data[addr+2] = rgba[2];
		return;
	}
	var a = rgba[3]/255, na = 1/a;
	data[addr  ] = data[addr  ]*na + rgba[0]*a;
	data[addr+1] = data[addr+1]*na + rgba[1]*a;
	data[addr+2] = data[addr+2]*na + rgba[2]*a;
	data[addr+3] = data[addr+3]*a;
};

/* --------------------------------------------------------------------------------------- */
// (rgb_array, offset, hue, sat, val)
exports.hsv_filter = function hsv_filter(data, addr, hue, sat, val) {
	var VSU = val*sat*Math.cos(hue*Math.PI/180),
	    VSW = val*sat*Math.sin(hue*Math.PI/180),
	    r = b2v(data[addr]),
	    g = b2v(data[addr+1]),
	    b = b2v(data[addr+2]);
	data[addr  ] = v2b((.299*val+.701*VSU+0.168*VSW)*r + (.587*val-.587*VSU+0.330*VSW)*g + (.114*val-.114*VSU-.497*VSW)*b);
	data[addr+1] = v2b((.299*val-.299*VSU-0.328*VSW)*r + (.587*val+.413*VSU+0.035*VSW)*g + (.114*val-.114*VSU+.292*VSW)*b);
	data[addr+2] = v2b((.299*val-.300*VSU+1.250*VSW)*r + (.587*val-.588*VSU-1.050*VSW)*g + (.114*val+.886*VSU-.203*VSW)*b);
};

/* --------------------------------------------------------------------------------------- */
// (rgb_array, offset, hue, sat, val)
exports.colorify_filter = function colorify_filter(data, addr, hue, sat, val) {
	var r = b2v(data[addr]), g = b2v(data[addr+1]), b = b2v(data[addr+2]),
	    M = Math.max(r,g,b);

	_hsv2rgb(data, addr, hue, ((M - Math.min(r,b,g))/M)*sat, val >=0 ? M*val : (.21*r + .72*g + .07*b)*-val);
};

/* --------------------------------------------------------------------------------------- */
// (pos_a, pos_b, gr/*object*/, callback(/*this, */ pos, color/*[r,g,b]*/))
exports.gradient = function gradient(pos_a, pos_b, gr, callback) {

	function obj2rgba(some) {
		switch (typeof some) {
		case 'string':
			return hex2rgba(some);
		case 'number':
			return rgba2array(some);
		case 'object':
			if (some instanceof Array) {
				if (some.length < 4)
					return [ some[0], some[1], some[2], 255 ];
			} else
				throw TypeError('wrong color type');
		}
		return some;
	}
	function getLineAB(x1, y1, dx, dy) {
		return [ dy/dx, y1 - x1*dy/dx ];
	}

	var w = pos_b - pos_a, i = 0, x1, c1, x2, c2, c = [], line = [];
	for (var p in gr) {
		x2 = pos_a + w*p/10000;
		c2 = obj2rgba(gr[p]);
		if (i > 0) {
			var dx = x2 - x1;
			line[0] = getLineAB(x1, c1[0], dx, c2[0] - c1[0]);
			line[1] = getLineAB(x1, c1[1], dx, c2[1] - c1[1]);
			line[2] = getLineAB(x1, c1[2], dx, c2[2] - c1[2]);
			line[3] = getLineAB(x1, c1[3], dx, c2[3] - c1[3]);

			function color(x) {
				return [
					line[0][0]*ix + line[0][1] +.5 | 0,
					line[1][0]*ix + line[1][1] +.5 | 0,
					line[2][0]*ix + line[2][1] +.5 | 0,
					line[3][0]*ix + line[3][1] +.5 | 0
				];
			}
			function mix(f, c1, c2) {
				var nf = 1.-f;
				return [ 
					c1[0]*f + c2[0]*nf +.5 | 0,
					c1[1]*f + c2[1]*nf +.5 | 0,
					c1[2]*f + c2[2]*nf +.5 | 0,
					c1[3]*f + c2[3]*nf +.5 | 0
				];
			};
			for (var ix = (x1+.9999)|0, ie = x2|0; ix < ie; ++ix)
				callback.call(this, ix, color(ix));
			callback.call(this, ie, ie < pos_b ? mix(x2-ie, color(ie), c2) : c2);
		}
		x1 = x2;
		c1 = c2;
		++i;
	}
};
