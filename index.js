import combine from '@turf/combine'
import explode from '@turf/explode'
import flatten from '@turf/flatten'
import nearestPoint from '@turf/nearest-point'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import polygonToLine from '@turf/polygon-to-line'
import rbush from 'geojson-rbush'
import * as maptalks from 'maptalks'

const options = {
  layers: [],
  mode: 'auto',
  distance: 10,
  shellPoints: 60,
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
    this._treePoints = rbush()
    this._treeLines = rbush()
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

  refreshTargets() {
    this._updateGeosSet()
    return this
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
      geometry.on('editstart', this._enable, this)
      geometry.on('editend remove', this._disable, this)
      if (geometry.isEditing()) this._enable()
    }
    return this
  }

  remove() {
    this._disable()
    if (this._cursorLayer) this._cursorLayer.remove()
    delete this._needDeal
    delete this._treePoints
    delete this._treeLines
    delete this._cursorLayer
    delete this._assistLayers
    delete this._mousePoint
    delete this._geosSetPoint
    delete this._geosSetLine
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
    this._isEnable = true
    if (this._cursorLayer) this._cursorLayer.show()
    this._updateGeosSet()
    this._registerMapEvents()
    this._geometry
      ? this._registerGeometryEvents()
      : this._registerDrawToolEvents()
  }

  _updateGeosSet() {
    this._geosSetPoint = []
    this._geosSetLine = []

    const geos = this._getAllAssistGeos()
    if (['auto', 'vertux'].includes(this.options['mode'])) {
      this._geosSetPoint = this._parseToPoints(geos)
    }
    if (['auto', 'border'].includes(this.options['mode'])) {
      this._geosSetLine = this._parseToLines(geos)
    }

    this._updateRBushTree()
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
          geo.setOptions(
            Object.assign(geo.options || {}, {
              numberOfShellPoints: this.options['shellPoints'],
            }),
          )
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
          geo.setOptions(
            Object.assign(geo.options || {}, {
              numberOfShellPoints: this.options['shellPoints'],
            }),
          )
        }
        lines = lines.concat(this._polygonToLine(geo.toGeoJSON()))
      }
    })
    return this._splitLines(lines)
  }

  _polygonToLine(feature) {
    const result = polygonToLine(feature)
    if (result.type === 'Feature') return flatten(result).features
    return result.features.reduce(
      (prev, cur) => prev.concat(flatten(cur).features),
      [],
    )
  }

  _splitLines(lines) {
    return lines.reduce((target, line) => {
      const coords = line.geometry.coordinates
      for (let i = 0; i < coords.length - 1; i++) {
        const coordinates = [coords[i], coords[i + 1]]
        target.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates },
          properties: {},
        })
      }
      return target
    }, [])
  }

  _updateRBushTree() {
    this._treePoints.clear()
    this._treePoints.load({
      type: 'FeatureCollection',
      features: this._geosSetPoint,
    })
    this._treeLines.clear()
    this._treeLines.load({
      type: 'FeatureCollection',
      features: this._geosSetLine,
    })
  }

  _registerMapEvents() {
    this._map.on('mousedown', this._mapMousedown, this)
    this._map.on('mouseup', this._mapMouseup, this)
    this._map.on('mousemove', this._mapMousemove, this)
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

    delete this._adsorbPoint
    if (this.options['needCtrl'] === domEvent.ctrlKey) {
      this._updateAdsorbPoint(coordinate)
    }
  }

  _updateAdsorbPoint(coordinate) {
    if (!this._needFindGeometry) return
    const availGeos = this._findGeometry(coordinate)
    if (availGeos.length > 0) {
      this._adsorbPoint = this._getAdsorbPoint(availGeos)
    }
    if (this._adsorbPoint) {
      const { x, y } = this._adsorbPoint
      this._cursor.setCoordinates([x, y])
    }
  }

  _findGeometry(coordinate) {
    let features = []
    if (this._geosSetPoint.length > 0) {
      const geos = this._findAvailGeos(this._treePoints, coordinate)
      features = features.concat(geos)
    }
    if (this._geosSetLine.length > 0) {
      const geos = this._findAvailGeos(this._treeLines, coordinate)
      features = features.concat(geos)
    }
    return features
  }

  _findAvailGeos(tree, coordinate) {
    const inspectExtent = this._createInspectExtent(coordinate)
    const availGeos = tree.search(inspectExtent)
    return availGeos.features
  }

  _createInspectExtent(coordinate) {
    const radius = this._map.pixelToDistance(0, this.options['distance'])
    const circle = new maptalks.Circle(coordinate, radius, {
      properties: {},
      numberOfShellPoints: this.options['shellPoints'],
    })
    return circle.toGeoJSON()
  }

  _getAdsorbPoint(features) {
    let nearestFeature
    const mousePoint = [this._mousePoint.x, this._mousePoint.y]
    const points = features.filter(
      (feature) => feature.geometry.type === 'Point',
    )
    if (points.length > 0) {
      nearestFeature = this._getNearestPoint(mousePoint, points)
    } else {
      const lines = features.filter(
        (feature) => feature.geometry.type === 'LineString',
      )
      nearestFeature = this._getNearestPointOnLine(mousePoint, lines)
    }
    const [x, y] = nearestFeature.geometry.coordinates
    return { x, y }
  }

  _getNearestPoint(mousePoint, features) {
    return nearestPoint(mousePoint, { type: 'FeatureCollection', features })
  }

  _getNearestPointOnLine(mousePoint, features) {
    const multiLines = combine({ type: 'FeatureCollection', features })
    return nearestPointOnLine(multiLines, mousePoint)
  }

  _registerGeometryEvents() {
    // this._geometry.on('shapechange', this._setShadowCoordinates, this)
    this._geometry.on('handledragging', this._setShadowCenter, this)
    this._geometry.on('editrecord', this._resetShadowCenter, this)
  }

  _setShadowCoordinates(e) {
    if (!this._needDeal || !this._adsorbPoint) return
    const geometry = e.target
  }

  _setShadowCenter(e) {
    this._handledragging = true
    const geometry = e.target
    const center = geometry.getCenter()
    const point = this._adsorbPoint || this._mousePoint
    const offset = this._getCoordsOffset(center, point)
    geometry.translate(...offset)
  }

  _getCoordsOffset(coordsFrom, coordsTo) {
    return [coordsTo.x - coordsFrom.x, coordsTo.y - coordsFrom.y]
  }

  _resetShadowCenter(e) {
    if (!this._adsorbPoint) return
    const geometry = e.target
    if (geometry instanceof maptalks.Marker) {
      geometry.setCoordinates(this._adsorbPoint)
    } else {
      if (!this._handledragging) return
      const center = geometry.getCenter()
      const point = this._adsorbPoint
      const offset = this._getCoordsOffset(center, point)
      geometry.translate(...offset)
      geometry._editor._shadow.translate(...offset)
      delete this._handledragging
    }
  }

  _registerDrawToolEvents() {
    this._drawTool.on('drawstart drawvertex', this._resetCoordsAndPoint, this)
    this._drawTool.on('mousemove drawend', this._resetCoordinates, this)
  }

  _resetCoordsAndPoint(e) {
    this._resetCoordinates(e)
    this._resetClickPoint(e)
  }

  _resetCoordinates(e) {
    if (!this._adsorbPoint) return
    const {
      options: { mode },
      _geometry: geo,
    } = e.target
    const coords = geo.getCoordinates()
    const { x, y } = this._adsorbPoint
    switch (mode) {
      case 'Point':
        geo.setCoordinates(this._adsorbPoint)
        break
      case 'Rectangle':
        coords[0][1].x = x
        coords[0][2].x = x
        coords[0][2].y = y
        coords[0][3].y = y
        geo.setCoordinates(coords)
        break
      case 'Circle':
        if (e.type === 'drawstart') {
          geo.setCoordinates(this._adsorbPoint)
          return
        }
        const radius = this._map
          .getProjection()
          .measureLength([coords, this._adsorbPoint])
        geo.setRadius(radius)
        break
      case 'Ellipse':
        if (e.type === 'drawstart') {
          geo.setCoordinates(this._adsorbPoint)
          return
        }
        const width = this._map
          .getProjection()
          .measureLength([coords, { x, y: coords.y }])
        const height = this._map
          .getProjection()
          .measureLength([coords, { x: coords.x, y }])
        geo
          .setWidth(width * 2)
          .setHeight(height * 2)
          ._updateCache()
        break
      default:
        coords.pop()
        coords.push(this._adsorbPoint)
        geo.setCoordinates(coords)
        break
    }
  }

  _resetClickPoint(e) {
    if (!this._adsorbPoint) return
    const clickCoords = e.target._clickCoords
    const point = this._map.coordToPoint(this._adsorbPoint)
    clickCoords.pop()
    clickCoords.push(this._map._pointToPrj(point))
  }

  _disable() {
    this._isEnable = false
    if (this._cursorLayer) this._cursorLayer.hide()
    this._offMapEvents()
    this._geometry ? this._offGeometryEvents() : this._offDrawToolEvents()
    this._resetGeosSet()
    delete this._geometry
  }

  _offMapEvents() {
    this._map.off('mousedown', this._mapMousedown, this)
    this._map.off('mousemove', this._mapMousemove, this)
    this._map.off('mouseup', this._mapMouseup, this)
  }

  _offGeometryEvents() {
    // this._geometry.off('shapechange', this._setShadowCoordinates, this)
    this._geometry.off('handledragging', this._setShadowCenter, this)
    this._geometry.off('editrecord', this._resetShadowCenter, this)
  }

  _offDrawToolEvents() {
    this._drawTool.off('drawstart drawvertex', this._resetCoordsAndPoint, this)
    this._drawTool.off('mousemove drawend', this._resetCoordinates, this)
  }

  _resetGeosSet() {
    this._geosSetPoint = []
    this._geosSetLine = []
  }

  _disableMapTool() {
    if (this._map._map_tool) this._map._map_tool.disable()
  }
}

Autoadsorb.mergeOptions(options)
