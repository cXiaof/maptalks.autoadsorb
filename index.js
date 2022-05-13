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

    addTo(map) {
        this._map = map
        this._newCursorLayer()
        this._saveAdsorbLayers()
        return this
    }

    enable() {
        this._isEnable = true
        return this
    }

    disable() {
        this._isEnable = false
        return this
    }

    isEnable() {
        return this._isEnable
    }

    toggleEnable() {
        return this._isEnable ? this.disable() : this.enable()
    }

    remove() {
        this.disable()
        delete this._isEnable
        if (this._cursorLayer) this._cursorLayer.remove()
        delete this._cursorLayer
        delete this._assistLayers
        delete this._map
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
}

Autoadsorb.mergeOptions(options)
