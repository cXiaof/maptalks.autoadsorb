const map = new maptalks.Map('map', {
    center: [121.387, 31.129],
    zoom: 14,
    baseLayer: new maptalks.TileLayer('base', {
        urlTemplate:
            'https://webrd{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        subdomains: ['01', '02', '03', '04'],
        maxAvailableZoom: 18,
        placeholder: true
    })
})

const layerSketch = new maptalks.VectorLayer('sketchPad').addTo(map)

const drawTool = new maptalks.DrawTool({ mode: 'LineString' }).addTo(map).disable()

const adjust = new maptalks.AdjustTo().setLayer(layerSketch)

drawTool.on('drawend', (param) => {
    const { geometry } = param
    geometry.addTo(layerSketch)
    geometry.on('contextmenu', () => {
        const isEditing = geometry.isEditing()
        if (isEditing) {
            adjust.setLayer(layerSketch)
            geometry.endEdit()
        }
        if (!isEditing) {
            adjust.setGeometry(geometry)
            geometry.startEdit()
        }
    })
})

const modes = [
    'Point',
    'LineString',
    'Polygon',
    'Circle',
    'Ellipse',
    'Rectangle',
    'FreeHandLineString',
    'FreeHandPolygon'
]
let children = []
modes.map((value) => children.push({ item: value, click: () => drawTool.setMode(value).enable() }))
const toolbar = new maptalks.control.Toolbar({
    items: [
        {
            item: 'Draw',
            children
        },
        {
            item: 'Stop',
            click: () => drawTool.disable()
        },
        {
            item: 'Clear',
            click: () => layerSketch.clear()
        }
    ]
}).addTo(map)
