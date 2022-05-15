import * as maptalks from 'maptalks'
import explode from '@turf/explode'
import polygonToLine from '@turf/polygon-to-line'
import flatten from '@turf/flatten'
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

const cursorLayerName = `${maptalks.INTERNAL_LAYER_PREFIX}cxiaof_autoadsorb`

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

    this._updateAdsorbPoint(coordinate)
    if (this.options['needCtrl'] !== domEvent.ctrlKey) {
      delete this._adsorbPoint
    }
  }

  _updateAdsorbPoint(coordinate) {
    if (!this._needFindGeometry) return
    const availGeos = this._findGeometry(coordinate)
  }

  _findGeometry(coordinate) {}

  _updateGeosSet() {
    const geos = this._getAllAssistGeos()
    if (['auto', 'vertux'].includes(this.options['mode'])) {
      this._geosSetPoint = this._parseToPoints(geos)
    }
    if (['auto', 'border'].includes(this.options['mode'])) {
      this._geosSetLine = this._parseToLines(geos)
    }
  }

  _getAllAssistGeos() {
    return this._assistLayers.reduce(
      (target, layer) => target.concat(layer.getGeometries()),
      [],
    )
  }

  _parseToPoints(geos) {
    let points = []
    geos.forEach((geo) => {
      if (geo instanceof maptalks.GeometryCollection) {
        points = points.concat(explode(geo.toGeoJSON()).features)
      } else {
        if (geo instanceof maptalks.Circle || geo instanceof maptalks.Ellipse) {
          geo = geo.copy()
          const { options } = geo
          const shellPoints = options['numberOfShellPoints']
          options.numberOfShellPoints = Math.max(shellPoints, 360)
          geo.setOptions(options)
          points.push(this._getCenterFeature(geo))
        }
        points = points.concat(explode(geo.toGeoJSON()).features)
      }
    })
    return points
  }

  _getCenterFeature(geo) {
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: geo.getCenter().toArray() },
      properties: {},
    }
  }

  _parseToLines(geos) {
    let lines = []
    geos = geos.filter(
      (geo) =>
        !(geo instanceof maptalks.Marker || geo instanceof maptalks.MultiPoint),
    )
    geos.forEach((geo) => {
      if (geo instanceof maptalks.LineString) {
        lines.push(geo.toGeoJSON())
      } else if (geo instanceof maptalks.MultiLineString) {
        lines = lines.concat(flatten(geo.toGeoJSON()).features)
      } else {
        if (geo instanceof maptalks.Circle || geo instanceof maptalks.Ellipse) {
          geo = geo.copy()
          const { options } = geo
          const shellPoints = options['numberOfShellPoints']
          options.numberOfShellPoints = Math.max(shellPoints, 360)
          geo.setOptions(options)
        }
        lines = lines.concat(this._polygonToLine(geo.toGeoJSON()))
      }
    })
    return lines
  }

  _polygonToLine(feature) {
    const result = polygonToLine(feature)
    if (result.type === 'Feature') return flatten(result).features
    return result.features.reduce(
      (prev, cur) => prev.concat(flatten(cur).features),
      [],
    )
  }

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
