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
        return this
    }

    getMode() {
        return this.options['mode']
    }

    setDistance(distance) {
        this.options['distance'] = distance
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
            if (drawTool.isEnabled()) this.enable()
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
            if (geometry.isEditing()) this.enable()
        }
        return this
    }

    remove() {
        this.disable()
        if (this._cursorLayer) this._cursorLayer.remove()
        delete this._cursorLayer
        delete this._assistLayers
        delete this._drawTool
        delete this._geometry
        delete this._geometryCoords
        delete this._map
    }

    _addTo(map) {
        this._map = map
        this._newCursorLayer()
        this._saveAdsorbLayers()
    }

    _newCursorLayer() {
        this._cursorLayer = new maptalks.VectorLayer(cursorLayerName, {
            style: { sylbol: this.options['cursorSymbol'] },
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
        this._isEnable = true
    }

    _disable() {
        this._isEnable = false
    }

    _disableMapTool() {
        if (this._map._map_tool) this._map._map_tool.disable()
    }
}

Autoadsorb.mergeOptions(options)
