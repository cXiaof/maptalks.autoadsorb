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

const modesDraw = ['Point', 'LineString', 'Polygon', 'Rectangle', 'Circle', 'Ellipse']
let childrenDraw = []
modesDraw.map((item) => childrenDraw.push({ item, click: () => drawTool.setMode(item).enable() }))

const modesPlug = ['auto', 'vertux', 'border']
let childrenPlug = []
modesPlug.map((item) => childrenPlug.push({ item, click: () => autoAdsorb.setMode(item) }))

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

new maptalks.control.Panel({
    position: { top: '0', left: '0' },
    draggable: true,
    custom: false,
    content:
        '<div>· 右键图形：</div><div>开始/停止编辑</div><div>· 按住Ctrl：</div><div>打开/关闭吸附</div><div>· contextmenu</div><div>on geometry to</div><div>start/end edit</div><div>· try press Ctrl</div><div>open/close adsorb</div>',
    closeButton: true
}).addTo(map)
