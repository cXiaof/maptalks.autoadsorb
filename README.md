# maptalks.autoadsorb

Adsorb vertux/border/both of geos on layer When drawing or editing,inspired on [maptalks.snapto](https://github.com/liubgithub/maptalks.snapto/wiki)

## Examples

### [DEMO](https://cxiaof.github.io/maptalks.autoadsorb/demo/index.html)

## Install

- Install with npm: `npm install maptalks.autoadsorb`.
- Install with yarn: `yarn add maptalks.autoadsorb`.
- Download from [dist directory](https://github.com/cXiaof/maptalks.autoadsorb/tree/master/dist).
- Use unpkg CDN: `https://cdn.jsdelivr.net/npm/maptalks.autoadsorb/dist/maptalks.autoadsorb.min.js`

## Usage

As a plugin, `maptalks.autoadsorb` must be loaded after `maptalks.js` in browsers. You can also use `'import { Autoadsorb } from "maptalks.autoadsorb"` when developing with webpack.

```html
<!-- ... -->
<script src="https://cdn.jsdelivr.net/npm/maptalks.autoadsorb/dist/maptalks.autoadsorb.min.js"></script>
<!-- ... -->
```

```javascript
// new Autoadsorb, option layers is necessary.
const autoAdsorb = new maptalks.Autoadsorb({ layers: [layer] })

// or you can update some options later
autoAdsorb.setMode('vertux')
autoAdsorb.setDistance(20)

// Use when drawing with DrawTool.
autoAdsorb.bindDrawTool(drawTool)

// Use when editing geometry.
autoAdsorb.bindGeometry(geometry)

// Forced refresh of adsorption geometries.Usually used after drawend or editend.
autoAdsorb.refreshTargets()
```

## API Reference

```javascript
new maptalks.Autoadsorb(options)
```

- options **Object** options
  - layers **Array** Get layer array or layerID array of the adsorption target.
  - mode **String** there are three modes, auto/vertux/border, auto by default.
  - distance **Number** the distance in pixel from mouse to the snap point, 10 by default.
  - shellPoints **Number** number of shell points in Circle and Ellipse, 60 by default.The larger the number, the smoother the experience when adsorption Circle and Ellipse.
  - needCtrl **Boolean** do adsorb only with Ctrl, default is false.

`bindDrawTool(drawtool)` bind a drawtool on map.

`bindGeometry(geometry)` bind a geometry on map which need edited.

`refreshTargets()` forced refresh of adsorption geometries.

`isEnable()` get enable status

`setMode()` adsorb mode, 'vertux' will only adsorb Point ,'border' will only adsorb Line, and 'auto' will find both but may find Point only if Point and Line at very close

`getMode()` get mode now

`setDistance()` adsorb distance, used to set how far to find geometries around

`getDistance()` get distance now

`remove()` clear private object

## Contributing

We welcome any kind of contributions including issue reportings, pull requests, documentation corrections, feature requests and any other helps.

## Develop

The only source file is `index.js`.

It is written in ES6, transpiled by [babel](https://babeljs.io/) and tested with [mocha](https://mochajs.org) and [expect.js](https://github.com/Automattic/expect.js).

### Scripts

- Install dependencies

```shell
$ npm install
```

- Watch source changes and generate runnable bundle repeatedly

```shell
$ gulp watch
```

- Package and generate minified bundles to dist directory

```shell
$ gulp minify
```

- Lint

```shell
$ npm run lint
```

## More Things

- [maptalks.autoadsorb](https://github.com/cXiaof/maptalks.autoadsorb/issues)
- [maptalks.multisuite](https://github.com/cXiaof/maptalks.multisuite/issues)
- [maptalks.geosplit](https://github.com/cXiaof/maptalks.geosplit/issues)
- [maptalks.polygonbool](https://github.com/cXiaof/maptalks.polygonbool/issues)
- [maptalks.geo2img](https://github.com/cXiaof/maptalks.geo2img/issues)
- [maptalks.control.compass](https://github.com/cXiaof/maptalks.control.compass/issues)
- [maptalks.autogradual](https://github.com/cXiaof/maptalks.autogradual/issues)
