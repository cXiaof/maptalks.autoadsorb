// new Map
const map = new maptalks.Map('map', {
    center: [121.387, 31.129],
    zoom: 14,
    baseLayer: new maptalks.TileLayer('base', {
        urlTemplate:
            'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c', 'd'],
        attribution:
            '&copy; <a href="http://osm.org">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/">CARTO</a>',
        maxAvailableZoom: 18,
        placeholder: true
    }),
    scaleControl: { position: 'bottom-right', metric: true, imperial: true },
    zoomControl: {
        position: { top: 80, right: 20 },
        slider: false,
        zoomLevel: true
    },
    spatialReference: {
        projection: 'EPSG:3857',
        resolutions: (function() {
            const resolutions = []
            const d = 2 * 6378137 * Math.PI
            for (let i = 0; i < 22; i++) {
                resolutions[i] = d / (256 * Math.pow(2, i))
            }
            return resolutions
        })(),
        fullExtent: {
            top: 6378137 * Math.PI,
            bottom: -6378137 * Math.PI,
            left: -6378137 * Math.PI,
            right: 6378137 * Math.PI
        }
    }
})
new maptalks.CompassControl({
    position: 'top-right'
}).addTo(map)

const layerSketch = new maptalks.VectorLayer('sketchPad').addTo(map)

// new DrawTool
const drawTool = new maptalks.DrawTool({ mode: 'Point' }).addTo(map).disable()

const autoAdsorb = new maptalks.Autoadsorb().setLayer(layerSketch)

drawTool.on('drawend', (param) => {
    const { geometry } = param
    geometry.addTo(layerSketch)
    geometry.on('contextmenu', () => {
        const isEditing = geometry.isEditing()
        if (isEditing) {
            geometry.endEdit()
            autoAdsorb.setLayer(layerSketch)
        }
        if (!isEditing) {
            geometry.startEdit()
            autoAdsorb.setGeometry(geometry)
        }
    })
})

// new Toolbar
const modesDraw = ['LineString', 'Polygon', 'Rectangle', 'Circle']
const modesPlug = ['auto', 'vertux', 'border']
const toolbar = new maptalks.control.Toolbar({
    position: 'top-left',
    items: [
        {
            item: 'Draw',
            children: modesDraw.map((item) => ({
                item,
                click: () => drawTool.setMode(item).enable()
            }))
        },
        {
            item: 'Stop Drawing',
            click: () => drawTool.disable()
        },
        {
            item: 'Choose Mode',
            children: modesPlug.map((item) => ({
                item,
                click: () => autoAdsorb.setMode(item)
            }))
        },
        {
            item: 'Clear',
            click: () => layerSketch.clear()
        }
    ]
}).addTo(map)

// new tip Panel
new maptalks.control.Panel({
    position: 'bottom-left',
    draggable: true,
    custom: false,
    content: `
        Click a type in <b>Draw</b> to draw the first geo, and draw more geo<br />
        to feel how it works.<br />
        Click a type in <b>Choose Mode</b> to try only vertux or border mode.<br />
        Contextmenu on one geometry, try to edit it and test it,<br />
        Contextmenu to start or end edit.<br />
        <br />
        点击<b>Draw</b>里的类型先画一个图形，然后画其他的图形的时候体会<br />
        吸附功能是怎样的工作方式。<br />
        点击<b>Choose Mode</b>里的选项去尝试仅吸附点或是边的模式。<br />
        右键图形可以尝试在编辑时吸附，右键可以编辑或是停止编辑。<br />
    `,
    closeButton: true
}).addTo(map)
