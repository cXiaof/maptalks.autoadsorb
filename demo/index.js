const map = new maptalks.Map('map', {
    center: [121.387, 31.129],
    zoom: 14,
    baseLayer: new maptalks.TileLayer('base', {
        urlTemplate: 'https://webrd{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
        subdomains: ['01', '02', '03', '04'],
        maxAvailableZoom: 18,
        placeholder: true
    })
})

const layerSketch = new maptalks.VectorLayer('sketchPad').addTo(map)

const drawTool = new maptalks.DrawTool({ mode: 'Polygon' }).addTo(map).disable()

const snap = new maptalks.SnapEndPoint().setLayer(layerSketch)

drawTool.on('drawend', (param) => {
    const { geometry } = param
    console.log(geometry)
    geometry.addTo(layerSketch)
})

const toolbar = new maptalks.control.Toolbar({
    items: [
        {
            item: 'Draw',
            click: () => drawTool.enable()
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
