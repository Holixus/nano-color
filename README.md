[![Gitter][gitter-image]][gitter-url]
[![NPM version][npm-image]][npm-url]
[![Build status][travis-image]] [travis-url]
[![Test coverage][coveralls-image]] [coveralls-url]
[![Dependency Status][david-image]][david-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

# nano-color

HSV/RGB color conversion utility library. HSV filter, coloring filter, gradients generating.

## Functions

### Common parameter names

* R,G,B,A -- integer channel value (0..255);
* h -- hue value (0..359);
* s,v,a -- saturation, volume, alpha value (0..1);
* g -- gamma value;
* RGB -- [ R, G, B ];
* RGBA -- [ R, G, B, A ];
* IRGBA -- 0xRRGGBBAA;
* IRGB -- 0xRRGGBB;
* data -- array of bytes;
* addr -- offset in an array of bytes.

### setGamma(g)

set Gamma correction value

### rgb2hsv(R,G,B)

Converts RGB to HSV. Returns array [ h, s, v ].

### hsv2rgb(h,s,v)

Returns [ R, G, B ].

### hsva2rgba(h,s,v,a)
Returns [ R, G, B, A ].

### rgba2hsva(R,G,B,A)

Returns [ h, s, v, a ].

### rgb2hex(RGB)

Return CSS hex color string -- '#RRGGBB'.

### rgba2hex(RGBA)

Return SVN hex color string -- '#RRGGBBAA'.

### hex2rgb(h)

Returns [ R, G, B ]. Eats '#RGB', '#RGBA', '#RRGGBB' and '#RRGGBBAA' formats.

### hex2rgba(hex)

Returns [ R, G, B, A ]. Eats '#RGB', '#RGBA', '#RRGGBB' and '#RRGGBBAA' formats.

### irgb2array(IRGB)

Returns [ R, G, B ].

### irgba2array(IRGBA)

Returns [ R, G, B, A ].

### hsva2irgba(h,s,v,a)

Returns 0xRRGGBBAA.

### put_rgb(data, addr, RGBA)

Put or mix in RGBA to the RGB bitmap array (data).

### put_rgba(data, addr, RGBA)

Put or mix in RGBA to the RGBA bitmap array (data).

### hsv_filter(data, addr, h, s, v)

Applyes HSV filter to the bitmap pixel.

### colorify_filter(data, addr, h, s, v)

Applyes Colorify filter to the bitmap pixel.

There are special case for v < 0. A result volume will be calculated by the formula ```(.21*r + .72*g + .07*b) * -val```.

### gradient(first_pos, last_pos, stops, fn)

* {stops} -- Object with color stops like:

```
{ 0: '#000', 4000: '#1234', 6000: 0x33445566, 10000: [ 255, 255, 255, 255 ] }
```
where, keys of object should be numeric value in bounds between 0 and 10000, that means from 0 to 1.0.

* {fn(position, RGBA)} -- callback function 

Example:
```
> var c = require('nano-color');
c.gradient(0, 10, {
		0: '#000',
		4000: '#1234',
		6500: 0x33445566,
		10000: [ 255, 255, 7, 255 ]
	}, function (pos, RGBA) {
		console.log('%s: [ %s ]', pos, RGBA.join(', '));
	});
```

will produce console output:
```
0: [ 0, 0, 0, 255 ]
1: [ 4, 9, 13, 208 ]
2: [ 9, 17, 26, 162 ]
3: [ 13, 26, 38, 115 ]
4: [ 17, 34, 51, 68 ]
5: [ 31, 48, 65, 82 ]
6: [ 48, 65, 82, 99 ]
7: [ 80, 95, 74, 124 ]
8: [ 138, 148, 52, 168 ]
9: [ 197, 202, 29, 211 ]
10: [ 255, 255, 7, 255 ]
```

[gitter-image]: https://badges.gitter.im/Holixus/nano-color.png
[gitter-url]: https://gitter.im/Holixus/nano-color
[npm-image]: https://img.shields.io/npm/v/nano-color.svg
[npm-url]: https://npmjs.org/package/nano-color
[github-tag]: http://img.shields.io/github/tag/Holixus/nano-color.svg
[github-url]: https://github.com/Holixus/nano-color/tags
[travis-image]: https://travis-ci.org/Holixus/nano-color.svg?branch=master
[travis-url]: https://travis-ci.org/Holixus/nano-color
[coveralls-image]: https://img.shields.io/coveralls/Holixus/nano-color.svg
[coveralls-url]: https://coveralls.io/r/Holixus/nano-color
[david-image]: http://img.shields.io/david/Holixus/nano-color.svg
[david-url]: https://david-dm.org/Holixus/nano-color
[license-image]: http://img.shields.io/npm/l/nano-color.svg
[license-url]: LICENSE
[downloads-image]: http://img.shields.io/npm/dm/nano-color.svg
[downloads-url]: https://npmjs.org/package/nano-color
