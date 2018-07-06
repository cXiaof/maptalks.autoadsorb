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
            {
                x: 121.38785830688471,
                y: 31.143325869261986
            },
            {
                x: 121.38931742858881,
                y: 31.126501934606353
            },
            {
                x: 121.40759936523432,
                y: 31.12899999999999
            },
            {
                x: 121.4036511535644,
                y: 31.14560311579109
            },
            {
                x: 121.38785830688471,
                y: 31.143325869261986
            }
        ]
    ],
    [
        [
            {
                x: 121.40880099487299,
                y: 31.144501229139024
            },
            {
                x: 121.41446582031244,
                y: 31.127824448008
            },
            {
                x: 121.43309107971186,
                y: 31.13149799961886
            },
            {
                x: 121.42407885742182,
                y: 31.149569801702256
            },
            {
                x: 121.40880099487299,
                y: 31.144501229139024
            }
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
