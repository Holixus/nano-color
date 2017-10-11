module NanoColor {
    type IRGBA = [number, number, number, number];
    type IRGB = [number, number, number];
    export interface IStopColorPairsObject {
        [key: number]: string | IRGBA | IRGB;
    };

    export class NanoColor {
        "use strict";
        protected hsv_angle_correction = false;
        protected hsv_gamma;

        protected c = 10000;
        protected inv = 10000;
        protected hsv_lut = [];
        protected rgb_lut = [];

        constructor() {
            this.hsv_gamma = 1.6;
            this.setGamma(1.6);
        }

        /* --- value to byte ------------------------------------------------------------------------------------ */
        // Math.pow(v, 1/hsv_gamma) * 255 + .5 | 0;
        /** Value to Byte */
        public v2b = function (v) {
            return this.hsv_lut[(v * this.c + .5) >> 0];
        };

        /* --- byte to value ------------------------------------------------------------------------------------ */
        // Math.pow(v/255, hsv_gamma);
        /** Byte to Value */
        public b2v = function (v) {
            return this.rgb_lut[v / 255 * this.inv + .5 | 0];
        };

        /* --------------------------------------------------------------------------------------- */
        public setGamma = function (g) {
            var gamma = 1 / g;
            if (gamma === this.hsv_gamma)
                return;

            this.hsv_gamma = gamma;

            for (var i = 0; i <= this.c; ++i)
                this.hsv_lut[i] = Math.pow(i / this.c, gamma) * 255 + .5 | 0;

            for (var i = 0; i <= this.inv; ++i)
                this.rgb_lut[i] = Math.pow(i / this.inv, g);
        };



        /* --------------------------------------------------------------------------------------- */
        /** (R,G,B) return [ h,s,v ]; */
        public rgb2hsv = function (R, G, B) {
            var r = this.b2v(R),
                g = this.b2v(G),
                b = this.b2v(B);

            var V = Math.max(r, g, b),
                M = V,
                C = (M - Math.min(r, b, g)),
                S = C / V;

            if (V < 0.0001)
                return [0, 0, 0];

            if (S < 0.0001)
                return [0, 0, V];

            switch (M) {
                case r:
                    var h = (g - b) / C;
                    if (h < 0) h += 6;
                    break;
                case g:
                    var h = (b - r) / C + 2;
                    break;
                case b:
                    var h = (r - g) / C + 4;
                    break;
            }
            return [h * 60, S, V];
        };

        /* --------------------------------------------------------------------------------------- */
        protected _hsv2rgb = function (data, addr, H, S, V) {
            if (V < 0.0001) {
                data[addr] = data[addr + 1] = data[addr + 2] = 0;
                return;
            }

            if (V > 1) V = 1;

            if (S == 0) {
                data[addr] = data[addr + 1] = data[addr + 2] = this.v2b(V);
                return;
            }

            if (S > 1) S = 1;

            var hue = H < 0 ? (H + 360) : (H >= 360 ? H - 360 : H),
                st = (hue / 60),
                oct = st - (st | 0), // [0...1]
                y = this.hsv_angle_correction ? /* istanbul ignore next */ Math.sin((oct - .5) * 1.0471975512) + .5 : oct,
                s = S * V,
                ns = V - s,
                _ns = this.v2b(ns),
                _v = this.v2b(V);

            switch (st | 0) {
                case 0: data[addr] = _v; data[addr + 1] = this.v2b(ns + s * y); data[addr + 2] = _ns; return;
                case 1: data[addr] = this.v2b(V - s * y); data[addr + 1] = _v; data[addr + 2] = _ns; return;
                case 2: data[addr] = _ns; data[addr + 1] = _v; data[addr + 2] = this.v2b(ns + s * y); return;
                case 3: data[addr] = _ns; data[addr + 1] = this.v2b(V - s * y); data[addr + 2] = _v; return;
                case 4: data[addr] = this.v2b(ns + s * y); data[addr + 1] = _ns; data[addr + 2] = _v; return;
            }
            /*   5: */
            data[addr] = _v; data[addr + 1] = _ns; data[addr + 2] = this.v2b(V - s * y);
        };

        /* --------------------------------------------------------------------------------------- */
        /** (h,s,v) return [ R, G, B ]; */
        public hsv2rgb = function (H, S, V) {
            var rgb = [0, 0, 0];
            this._hsv2rgb(rgb, 0, H, S, V);
            return rgb as IRGB;
        };

        /* --------------------------------------------------------------------------------------- */
        /** (h,s,v,a) return [ R, G, B, A ]; */
        public hsva2rgba = function (h, s, v, a) {
            var rgba = [0, 0, 0, (a * 255 + .5) & 255];
            this._hsv2rgb(rgba, 0, h, s, v);
            return rgba as IRGBA;
        };

        /* --------------------------------------------------------------------------------------- */
        /** (R,G,B,A) return [ h, s, v, a ]; */
        public rgba2hsva = function (R, G, B, A) {
            var hsv = this.rgb2hsv(R, G, B);
            hsv[3] = (A / 255);
            return hsv;
        };

        protected _h = function (v) {
            var c = v + .5 & 255, s = "0123456789abcdef";
            return s.charAt(c >> 4) + s.charAt(c & 15);
        };

        /* --------------------------------------------------------------------------------------- */
        /** ([r,g,b]) return "#RRGGBB"; */
        public rgb2hex = function (rgb) {
            return '#' + this._h(rgb[0]) + this._h(rgb[1]) + this._h(rgb[2]);
        };

        /* --------------------------------------------------------------------------------------- */
        /** ([r,g,b,a]) return "#RRGGBBAA"; */
        public rgba2hex = function (rgb) {
            return '#' + this._h(rgb[0]) + this._h(rgb[1]) + this._h(rgb[2]) + this._h(rgb[3]);
        };

        /* --------------------------------------------------------------------------------------- */
        /** ('#RRGGBBAA') return [ R, G, B ];
        *   ('#RRGGBB')   return [ R, G, B ];
        *   ('#RGB')      return [ R*17, G*17, B*17 ];
        */
        public hex2rgb = function (h): IRGB {
            var hex = h.charAt(0) == '#' ? h.substr(1) : h,
                i = parseInt(hex, 16);
            switch (hex.length) {
                case 3: return [((i >> 8) & 15) * 0x11, ((i >> 4) & 15) * 0x11, (i & 15) * 0x11];
                case 4: return [((i >> 12) & 15) * 0x11, ((i >> 8) & 15) * 0x11, ((i >> 4) & 15) * 0x11];
                case 6: return [(i >> 16) & 255, (i >> 8) & 255, i & 255];
                case 8: return [(i >> 24) & 255, (i >> 16) & 255, (i >> 8) & 255];
            }
            return [255, 255, 255];
        };

        /* --------------------------------------------------------------------------------------- */
        /** ('#RRGGBBAA') return [ R, G, B, A ];
        *   ('#RRGGBB')   return [ R, G, B, 255 ];
        *   ('#RGB')      return [ R*17, G*17, B*17, 255 ];
        */
        public hex2rgba = function (hex): IRGBA {
            if (hex.charAt(0) == '#')
                hex = hex.substr(1);
            var i = parseInt(hex, 16);
            switch (hex.length) {
                case 3: return [((i >> 8) & 15) * 0x11, ((i >> 4) & 15) * 0x11, (i & 15) * 0x11, 255];
                case 4: return [((i >> 12) & 15) * 0x11, ((i >> 8) & 15) * 0x11, ((i >> 4) & 15) * 0x11, (i & 15) * 0x11];
                case 6: return [(i >> 16) & 255, (i >> 8) & 255, i & 255, 255];
                case 8: return [(i >> 24) & 255, (i >> 16) & 255, (i >> 8) & 255, i & 255];
            }
            return [255, 255, 255, 255];
        };

        /* --------------------------------------------------------------------------------------- */
        /** (0xRRGGBB) return [ R, G, B ]; */
        public rgb2array = function (value) {
            return [value >> 16, (value >> 8) & 255, value & 255] as IRGB;
        };

        /* --------------------------------------------------------------------------------------- */
        /** (0xRRGGBBAA) return [ R, G, B, A ]; */
        public rgba2array = function (value) {
            return [(value >> 24) & 255, (value >> 16) & 255, (value >> 8) & 255, value & 255] as IRGBA;
        };

        /* --------------------------------------------------------------------------------------- */
        /** (h, s, v, a) return 0xRRGGBBAA; */
        public hsva2irgba = function (h, s, v, a) {
            var rgba = this.hsva2rgba(h, s, v, a);
            return 16777216. * rgba[0] + 65536. * rgba[1] + 256. * rgba[2] + rgba[3];
        };

        /* --------------------------------------------------------------------------------------- */
        // [ R, G, B, A] mix to data[addr] by alpha channel
        protected put_rgb = function _rgb(data, addr, rgba) {
            if (rgba[3] == 255) {
                data[addr] = rgba[0];
                data[addr + 1] = rgba[1];
                data[addr + 2] = rgba[2];
                return;
            }
            var a = rgba[3] / 255, na = 1 / a;
            data[addr] = data[addr] * na + rgba[0] * a;
            data[addr + 1] = data[addr + 1] * na + rgba[1] * a;
            data[addr + 2] = data[addr + 2] * na + rgba[2] * a;
        };

        /* --------------------------------------------------------------------------------------- */
        // [ R, G, B, A] mix to data[addr] with alpha channel
        protected _rgba = function (data, addr, rgba) {
            if (rgba[3] == 255) {
                data[addr] = rgba[0];
                data[addr + 1] = rgba[1];
                data[addr + 2] = rgba[2];
                return;
            }
            var a = rgba[3] / 255, na = 1 / a;
            data[addr] = data[addr] * na + rgba[0] * a;
            data[addr + 1] = data[addr + 1] * na + rgba[1] * a;
            data[addr + 2] = data[addr + 2] * na + rgba[2] * a;
            data[addr + 3] = data[addr + 3] * a;
        };

        /* --------------------------------------------------------------------------------------- */
        // (rgb_array, offset, hue, sat, val)
        public hsv_filter = function (data, addr, hue, sat, val) {
            var VSU = val * sat * Math.cos(hue * Math.PI / 180),
                VSW = val * sat * Math.sin(hue * Math.PI / 180),
                r = this.b2v(data[addr]),
                g = this.b2v(data[addr + 1]),
                b = this.b2v(data[addr + 2]);
            data[addr] = this.v2b((.299 * val + .701 * VSU + 0.168 * VSW) * r + (.587 * val - .587 * VSU + 0.330 * VSW) * g + (.114 * val - .114 * VSU - .497 * VSW) * b);
            data[addr + 1] = this.v2b((.299 * val - .299 * VSU - 0.328 * VSW) * r + (.587 * val + .413 * VSU + 0.035 * VSW) * g + (.114 * val - .114 * VSU + .292 * VSW) * b);
            data[addr + 2] = this.v2b((.299 * val - .300 * VSU + 1.250 * VSW) * r + (.587 * val - .588 * VSU - 1.050 * VSW) * g + (.114 * val + .886 * VSU - .203 * VSW) * b);
        };

        /* --------------------------------------------------------------------------------------- */
        // (rgb_array, offset, hue, sat, val)
        public colorify_filter = function (data, addr, hue, sat, val) {
            var r = this.b2v(data[addr]),
                g = this.b2v(data[addr + 1]),
                b = this.b2v(data[addr + 2]),
                M = Math.max(r, g, b);

            this._hsv2rgb(data, addr, hue, ((M - Math.min(r, b, g)) / M) * sat, val >= 0 ? M * val : (.21 * r + .72 * g + .07 * b) * -val);
        };

        /* --------------------------------------------------------------------------------------- */
        // (pos_a, pos_b, colors/*object*/, callback(/*this, */ pos, color/*[r,g,b]*/))
        public gradient = (pos_a: number, pos_b: number, colors: IStopColorPairsObject, callback: Function) => {

            let obj2rgba = (color): IRGBA => {
                switch (typeof color) {
                    case 'string':
                        return this.hex2rgba(color);
                    case 'number':
                        return this.rgba2array(color);
                    case 'object':
                        if (color instanceof Array) {
                            switch (color.length) {
                                case 4:
                                    return color as IRGBA;
                                case 3:
                                    return [color[0], color[1], color[2], 255] as IRGBA;
                            }
                        }
                }
                throw TypeError('wrong color type');
            }
            let getLineAB = (x1: number, y1: number, dx: number, dy: number) => {
                return [dy / dx, y1 - x1 * dy / dx];
            }

            let color = (x) => {
                return [
                    line[0][0] * ix + line[0][1] + .5 | 0,
                    line[1][0] * ix + line[1][1] + .5 | 0,
                    line[2][0] * ix + line[2][1] + .5 | 0,
                    line[3][0] * ix + line[3][1] + .5 | 0
                ];
            }
            let mix = (f: number, c1, c2) => {
                var nf = 1. - f;
                return [
                    c1[0] * f + c2[0] * nf + .5 | 0,
                    c1[1] * f + c2[1] * nf + .5 | 0,
                    c1[2] * f + c2[2] * nf + .5 | 0,
                    c1[3] * f + c2[3] * nf + .5 | 0
                ];
            };

            var len = pos_b - pos_a;
            var i = 0;
            var x1: number;
            var c1: IRGBA;
            var x2: number;
            var c2: IRGBA;
            var line: number[][] = [[], [], [], []];

            for (var stop in colors) {
                var stopAny = <any>stop;
                x2 = pos_a + len * stopAny / 10000;
                c2 = obj2rgba(colors[stop]);
                if (i > 0) {
                    var dx = x2 - x1;
                    line[0] = getLineAB(x1, c1[0], dx, c2[0] - c1[0]);
                    line[1] = getLineAB(x1, c1[1], dx, c2[1] - c1[1]);
                    line[2] = getLineAB(x1, c1[2], dx, c2[2] - c1[2]);
                    line[3] = getLineAB(x1, c1[3], dx, c2[3] - c1[3]);

                    for (var ix = x1 + .5 | 0, ie = x2 | 0; ix < ie; ++ix)
                        callback(ix, color(ix));

                    if (ie === pos_b)
                        callback(ie, c2);
                    else
                        if (ix !== x2)
                            callback(ie, mix(x2 - ie, color(ie), c2));
                }
                x1 = x2;
                c1 = c2;
                ++i;
            }
        };
    }
};
