# maptalks.autoadsorb

Adsorb vertux/border/both of geos on layer When drawing or editing,inspired on [maptalks.snapto](https://github.com/liubgithub/maptalks.snapto/wiki)

## Examples

### [DEMO](https://cxiaof.github.io/maptalks.autoadsorb/demo/index.html)

## Install

-   Install with npm: `npm install maptalks.autoadsorb`.
-   Install with yarn: `yarn add maptalks.autoadsorb`.
-   Download from [dist directory](https://github.com/cXiaof/maptalks.autoadsorb/tree/master/dist).
-   Use unpkg CDN: `https://cdn.jsdelivr.net/npm/maptalks.autoadsorb/dist/maptalks.autoadsorb.min.js`

## Usage

As a plugin, `maptalks.autoadsorb` must be loaded after `maptalks.js` in browsers. You can also use `'import { Autoadsorb } from "maptalks.autoadsorb"` when developing with webpack.

```html
<!-- ... -->
<script src="https://cdn.jsdelivr.net/npm/maptalks.autoadsorb/dist/maptalks.autoadsorb.min.js"></script>
<!-- ... -->
```

```javascript
// new drawTool and layer addTo map
const drawTool = new maptalks.DrawTool({ mode: 'Point' }).addTo(map).disable()
const layer = new maptalks.VectorLayer('v').addTo(map)
// new Autoadsorb which default options { mode: 'auto', distance: 10 }
const autoAdsorb = new maptalks.Autoadsorb()

// or you can update one option later
autoAdsorb.setMode('vertux')
autoAdsorb.setDistance(20)
autoAdsorb.needCtrl(true)

// Use when drawing with DrawTool, you should bind the layer which you draw on.
autoAdsorb.setLayer(layer)
// If DrawTool is on map already, Autoadsorb will bindDrawTool auto. If not, you should do bindDrawTool after.
autoAdsorb.bindDrawTool(drawTool)

// Use when editing one geometry, you should bind the geometry.
autoAdsorb.setGeometry(geometry)

// Capture geos on more layers.
autoAdsorb.setAssistGeosLayer(['v1', 'v2'])
```

## API Reference

```javascript
new maptalks.Autoadsorb(options)
```

-   options **Object** options
    -   mode **String** there are three modes, auto/vertux/border, auto by default.
    -   distance **Number** the distance in pixel from mouse to the snap point, 10 by default.
    -   needCtrl **Boolean** do adsorb only with Ctrl, default is false.

`setLayer(layer)` specify a vectorlayer which drawing on.

`bindDrawTool(drawtool)` When interacting with a drawtool, you should bind the drawtool.

`setGeometry(geometry)` specify a geometry which need edited.

`setAssistGeosLayer(layerNames[])` set more layers to which geos can be attached.

`enable()` start adsorb

`disable()` end adsorb

`toggleEnable()` toggle enable<=>disable

`isEnable()` get enable status

`setMode()` adsorb mode, 'vertux' will only adsorb Point ,'border' will only adsorb Line, and 'auto' will find both but may find Point only if Point and Line at very close

`getMode()` get mode now

`setDistance()` adsorb distance, used to set how far to find geometries around

`getDistance()` get distance now

`needCtrl(boolean)` update options.needCtrl

`remove()` clear private object

## Contributing

We welcome any kind of contributions including issue reportings, pull requests, documentation corrections, feature requests and any other helps.

## Develop

The only source file is `index.js`.

It is written in ES6, transpiled by [babel](https://babeljs.io/) and tested with [mocha](https://mochajs.org) and [expect.js](https://github.com/Automattic/expect.js).

### Scripts

-   Install dependencies

```shell
$ npm install
```

-   Watch source changes and generate runnable bundle repeatedly

```shell
$ gulp watch
```

-   Package and generate minified bundles to dist directory

```shell
$ gulp minify
```

-   Lint

```shell
$ npm run lint
```

## More Things

-   [maptalks.autoadsorb](https://github.com/cXiaof/maptalks.autoadsorb/issues)
-   [maptalks.multisuite](https://github.com/cXiaof/maptalks.multisuite/issues)
-   [maptalks.geosplit](https://github.com/cXiaof/maptalks.geosplit/issues)
-   [maptalks.polygonbool](https://github.com/cXiaof/maptalks.polygonbool/issues)
-   [maptalks.geo2img](https://github.com/cXiaof/maptalks.geo2img/issues)
-   [maptalks.control.compass](https://github.com/cXiaof/maptalks.control.compass/issues)
-   [maptalks.autogradual](https://github.com/cXiaof/maptalks.autogradual/issues)
