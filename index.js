import * as maptalks from 'maptalks'
import rbush from 'geojson-rbush'
import isEqual from 'lodash.isequal'
import differenceWith from 'lodash.differencewith'
import findIndex from 'lodash.findindex'
import includes from 'lodash.includes'
import flattenDeep from 'lodash.flattendeep'

const options = {
    mode: 'auto',
    layers: [],
    distance: 10,
    needCtrl: false,
    cursorSymbol: {
        markerType: 'ellipse',
        markerFill: '#de3333',
        markerWidth: 4,
        markerHeight: 4,
        markerLineWidth: 0,
    },
}

const cursorLayerName = `${maptalks.INTERNAL_LAYER_PREFIX}_cxiaof_autoadsorb`

export class Autoadsorb extends maptalks.Class {
    constructor(options) {
        super(options)
        this._isEnable = false
    }

    setMode(mode) {
        this.options['mode'] = mode
        this._updateGeosSet()
        return this
    }

    getMode() {
        return this.options['mode']
    }

    setDistance(distance) {
        this.options['distance'] = distance
        this._updateGeosSet()
        return this
    }

    getDistance() {
        return this.options['distance']
    }

    isEnable() {
        return this._isEnable
    }

    bindDrawTool(drawTool) {
        if (drawTool instanceof maptalks.DrawTool) {
            if (!this._map) this._addTo(drawTool.getMap())
            this._drawTool = drawTool
            drawTool.on('enable', this._enable, this)
            drawTool.on('disable remove', this._disable, this)
            if (drawTool.isEnabled()) this._enable()
        }
        return this
    }

    bindGeometry(geometry) {
        if (geometry instanceof maptalks.Geometry) {
            if (!this._map) this._addTo(drawTool.getMap())
            this._disableMapTool()
            this._geometry = geometry
            this._geometryCoords = geometry.getCoordinates()
            geometry.on('editstart', this._enable, this)
            geometry.on('editend remove', this._disable, this)
            if (geometry.isEditing()) this._enable()
        }
        return this
    }

    remove() {
        this._disable()
        if (this._cursorLayer) this._cursorLayer.remove()
        delete this._cursorLayer
        delete this._assistLayers
        delete this._needDeal
        delete this._mousePoint
        delete this._cursor
        delete this._adsorbPoint
        delete this._drawTool
        delete this._map
    }

    _addTo(map) {
        this._map = map
        this._newCursorLayer()
        this._saveAdsorbLayers()
    }

    _newCursorLayer() {
        this._cursorLayer = new maptalks.VectorLayer(cursorLayerName, {
            style: { symbol: this.options['cursorSymbol'] },
        })
        this._cursorLayer.addTo(this._map).bringToFront()
    }

    _saveAdsorbLayers() {
        this._assistLayers = []
        this.options['layers'].forEach((layer) => {
            if (typeof layer === 'string') {
                layer = this._map.getLayer(layer)
            }
            if (layer instanceof maptalks.VectorLayer) {
                this._assistLayers.push(layer)
            }
        })
    }

    _enable() {
        console.log('enable')
        this._isEnable = true
        if (this._cursorLayer) this._cursorLayer.show()
        map.on('mousedown', this._mapMousedown, this)
        map.on('mouseup', this._mapMouseup, this)
        map.on('mousemove', this._mapMousemove, this)
        this._updateGeosSet()
    }

    _mapMousedown() {
        this._needFindGeometry = !!this._geometry
    }

    _mapMouseup() {
        this._needFindGeometry = !this._geometry
    }

    _mapMousemove({ coordinate, domEvent }) {
        this._needDeal = true
        this._mousePoint = coordinate

        if (this._cursor) {
            this._cursor.setCoordinates(coordinate)
        } else {
            this._cursor = new maptalks.Marker(coordinate)
            this._cursor.addTo(this._cursorLayer)
        }

        if (this.options['needCtrl'] !== domEvent.ctrlKey) {
            delete this._adsorbPoint
        }
    }

    _updateGeosSet() {}

    _disable() {
        console.log('disable')
        this._isEnable = false
        if (this._cursorLayer) this._cursorLayer.hide()
        map.off('mousedown', this._mapMousedown, this)
        map.off('mousemove', this._mapMousemove, this)
        map.off('mouseup', this._mapMouseup, this)
        this._resetGeosSet()
        delete this._geometry
        delete this._geometryCoords
    }

    _resetGeosSet() {}

    _disableMapTool() {
        if (this._map._map_tool) this._map._map_tool.disable()
    }
}

Autoadsorb.mergeOptions(options)
