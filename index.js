import * as maptalks from 'maptalks'
import rbush from 'geojson-rbush'

const options = {}

export class SnapEndPoint extends maptalks.Class {
    constructor(options) {
        super(options)
        this.tree = rbush()
    }

    setLayer(layer) {
        console.log('setLayer')
        if (layer instanceof maptalks.VectorLayer) {
            this.snaplayer = layer
            this._addTo(layer.map)
            this._compositGeometries()
            this.snaplayer.on('addgeo', () => this._compositGeometries(), this)
            this.snaplayer.on('clear', () => this._resetGeosSet(), this)
            this._mousemoveLayer.bringToFront()
            this.bindDrawTool(layer.map._map_tool)
        }
        return this
    }

    _addTo(map) {
        const layerName = `${maptalks.INTERNAL_LAYER_PREFIX}_snapendpoint`
        this._mousemoveLayer = new maptalks.VectorLayer(layerName).addTo(map)
        this._map = map
        this._resetGeosSet()
        return this
    }

    _compositGeometries() {
        const geometries = this.snaplayer.getGeometries()
        this._geosSet = []
    }

    _resetGeosSet() {
        this._geosSet = []
    }

    bindDrawTool(drawTool) {
        console.log('bindDrawTool')
        if (drawTool instanceof maptalks.DrawTool) {
            this._drawTool = drawTool
            drawTool.on('enable', (e) => this.enable(), this)
            drawTool.on('disable', (e) => this.disable(), this)
            if (drawTool.isEnabled()) this.enable()
        }
    }

    enable() {
        console.log('enable')
        this._compositGeometries()
        this._registerMapEvents()
        this._registerDrawToolEvents()
        this._mousemoveLayer.show()
        return this
    }

    _registerMapEvents() {
        if (!this._mousemove) {
            const map = this._map
            this._needFindGeometry = true
            this._mousemove = (e) => this._mousemoveEvents(e)
            this._mousedown = () => (this._needFindGeometry = false)
            this._mouseup = () => (this._needFindGeometry = true)
            map.on('mousemove touchstart', this._mousemove, this)
            map.on('mousedown', this._mousedown, this)
            map.on('mouseup', this._mouseup, this)
        }
    }

    _mousemoveEvents(e) {
        console.log(e)
    }

    _registerDrawToolEvents() {
        const drawTool = this._drawTool
        drawTool.on('drawstart', (e) => this._resetCoordsAndPoint(e), this)
        drawTool.on('mousemove', (e) => this._resetCoordinates(e.target._geometry), this)
        drawTool.on('drawvertex', (e) => this._resetCoordsAndPoint(e), this)
        drawTool.on('drawend', (e) => this._resetCoordinates(e.geometry), this)
    }

    _resetCoordsAndPoint(e) {
        this._resetCoordinates(e.target._geometry)
        this._resetClickPoint(e.target._clickCoords)
    }

    _resetCoordinates(geometry) {
        if (this.snapPoint) {
        }
    }

    _resetClickPoint(clickCoords) {
        if (this.snapPoint) {
            const { x, y } = this.snapPoint
            const { length } = clickCoords
            clickCoords[length - 1].x = x
            clickCoords[length - 1].y = y
        }
    }

    disable() {
        console.log('disable')
        const map = this._map
        map.off('mousemove touchstart', this._mousemove, this)
        map.off('mousedown', this._mousedown, this)
        map.off('mouseup', this._mouseup, this)

        const drawTool = this._drawTool
        drawTool.off('drawstart', (e) => this._resetCoordsAndPoint(e), this)
        drawTool.off('mousemove', (e) => this._resetCoordinates(e.target._geometry), this)
        drawTool.off('drawvertex', (e) => this._resetCoordsAndPoint(e), this)
        drawTool.off('drawend', (e) => this._resetCoordinates(e.geometry), this)

        delete this._mousemove
        delete this._mousedown
        delete this._mouseup
        this._mousemoveLayer.hide()
        this._resetGeosSet()
        return this
    }
}

SnapEndPoint.mergeOptions(options)
