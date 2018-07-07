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

const modesDraw = ['Point', 'LineString', 'Polygon', 'Circle', 'Ellipse', 'Rectangle']
let childrenDraw = []
modesDraw.map((item) => childrenDraw.push({ item, click: () => drawTool.setMode(item).enable() }))

const modesPlug = ['auto', 'vertux', 'border']
let childrenPlug = []
modesPlug.map((item) => childrenPlug.push({ item, click: () => adjust.setMode(item) }))

const toolbar = new maptalks.control.Toolbar({
    items: [
        {
            item: 'Draw',
            children: childrenDraw
        },
        {
            item: 'Mode',
            children: childrenPlug
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

const multi = new maptalks.MultiPolygon([
    [
        [
            { x: 121.3878583068847, y: 31.143325869261 },
            { x: 121.3893174285888, y: 31.126501934606 },
            { x: 121.4075993652343, y: 31.128999999999 },
            { x: 121.4036511535644, y: 31.145603115791 },
            { x: 121.3878583068847, y: 31.143325869261 }
        ]
    ],
    [
        [
            { x: 121.4088009948729, y: 31.144501229139 },
            { x: 121.4144658203124, y: 31.127824448008 },
            { x: 121.4330910797118, y: 31.131497999618 },
            { x: 121.4240788574218, y: 31.149569801702 },
            { x: 121.4088009948729, y: 31.144501229139 }
        ]
    ]
])
multi.addTo(layerSketch)
multi.on('contextmenu', () => {
    const isEditing = multi.isEditing()
    if (isEditing) {
        adjust.setLayer(layerSketch)
        multi.endEdit()
    }
    if (!isEditing) {
        adjust.setGeometry(multi)
        multi.startEdit()
    }
})
