import * as maptalks from 'maptalks'
import rbush from 'geojson-rbush'

export class SnapEndPoint extends maptalks.Class {
    constructor(options) {
        super(options)
        this.tree = rbush()
    }

    addTo(map) {
        const layerName = `${maptalks.INTERNAL_LAYER_PREFIX}_snapendpoint`
        this._mousemoveLayer = new maptalks.VectorLayer(layerName).addTo(map)
        this._map = map
        this._resetGeosSet()
        this.enable()
    }

    enable() {
        const map = this._map
        if (this.snaplayer) this._compositGeometries()
        if (this._geosSet) {
            this._registerEvents(map)
            this._mousemoveLayer.show()
        }
    }

    disable() {
        const map = this._map
        map.off('mousemove touchstart', this._mousemove)
        map.off('mousedown', this._mousedown, this)
        map.off('mouseup', this._mouseup, this)
        delete this._mousemove
        delete this._mousedown
        delete this._mouseup
        this._mousemoveLayer.hide()
        this._resetGeosSet()
    }

    setLayer(layer) {
        if (layer instanceof maptalks.VectorLayer) {
            this.snaplayer = layer
            this._compositGeometries()
            this.snaplayer.on('addgeo', () => this._compositGeometries(), this)
            this.snaplayer.on('clear', () => this._resetGeosSet(), this)
            this._mousemoveLayer.bringToFront()
        }
    }

    bindDrawTool(drawTool) {
        if (drawTool instanceof maptalks.DrawTool) {
            drawTool.on('drawstart', (e) => this._resetCoordsAndPoint(e), this)
            drawTool.on('mousemove', (e) => this._resetCoordinates(e.target._geometry), this)
            drawTool.on('drawvertex', (e) => this._resetCoordsAndPoint(e), this)
            drawTool.on('drawend', (e) => this._resetCoordinates(e.geometry), this)
        }
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
            clickCoords[clickCoords.length - 1].x = x
            clickCoords[clickCoords.length - 1].y = y
        }
    }

    _registerEvents() {
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

    _compositGeometries() {
        const geometries = this.snaplayer.getGeometries()
        this._geosSet = []
    }

    _resetGeosSet() {
        this._geosSet = []
    }
}
