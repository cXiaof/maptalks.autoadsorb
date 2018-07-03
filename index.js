import * as maptalks from 'maptalks'
import rbush from 'geojson-rbush'
import isEqual from 'lodash/isEqual'
import differenceWith from 'lodash/differenceWith'
import findIndex from 'lodash/findIndex'

const options = {}

export class SnapEndPoint extends maptalks.Class {
    constructor(options) {
        super(options)
        this.tree = rbush()
        this._distance = 10
        this._layerName = `${maptalks.INTERNAL_LAYER_PREFIX}_snapendpoint`
    }

    setLayer(layer) {
        if (layer instanceof maptalks.VectorLayer) {
            const map = layer.map
            this._checkOnlyOne(map)
            this.snaplayer = layer
            this.addTo(map)
            this.snaplayer.on('addgeo', () => this._updateGeosSet(), this)
            this.snaplayer.on('clear', () => this._resetGeosSet(), this)
            this.bindDrawTool(map._map_tool)
        }
        return this
    }

    bindDrawTool(drawTool) {
        if (drawTool instanceof maptalks.DrawTool) {
            this.drawTool = drawTool
            drawTool.on('enable', (e) => this.enable(), this)
            drawTool.on('disable', (e) => this.disable(), this)
            drawTool.on('remove', (e) => this.remove(), this)
            if (drawTool.isEnabled()) this.enable()
        }
    }

    setGeometry(geometry) {
        if (geometry instanceof maptalks.Geometry) {
            const layer = geometry._layer
            const map = layer.map
            this._checkOnlyOne(map)
            this.snaplayer = layer
            this.addTo(map)
            this.bindGeometry(geometry)
        }
        return this
    }

    bindGeometry(geometry) {
        if (geometry instanceof maptalks.Geometry) {
            this.geometry = geometry
            this.geometryCoords = geometry.getCoordinates()
            geometry.on('editstart', (e) => this.enable(), this)
            geometry.on('editend', (e) => this.disable(), this)
            geometry.on('remove', (e) => this.remove(), this)
        }
    }

    enable() {
        this._updateGeosSet()
        this._registerMapEvents()
        if (this.drawTool) this._registerDrawToolEvents()
        if (this.geometry) this._registerGeometryEvents()
        if (this._mousemoveLayer) this._mousemoveLayer.show()
        return this
    }

    disable() {
        this._offMapEvents()
        this._offDrawToolEvents()
        this._offGeometryEvents()

        delete this._mousemove
        delete this._mousedown
        delete this._mouseup
        if (this._mousemoveLayer) this._mousemoveLayer.hide()
        this._resetGeosSet()
        return this
    }

    remove() {
        this.disable()
        const layer = map.getLayer(this._layerName)
        if (layer) layer.remove()
        delete this._mousemoveLayer
    }

    addTo(map) {
        this._mousemoveLayer = new maptalks.VectorLayer(this._layerName).addTo(map)
        this._mousemoveLayer.bringToFront()
        this._map = map
        this._resetGeosSet()
        return this
    }

    _checkOnlyOne(map) {
        const _layer = map.getLayer(this._layerName)
        if (_layer) this.remove()
    }

    _updateGeosSet() {
        const geometries = this.snaplayer.getGeometries()
        let geos = []
        geometries.forEach((geo) => geos.push(...this._parserToPoints(geo)))
        this._geosSet = geos
    }

    _parserToPoints(geo) {
        const type = geo.getType()
        let coordinates =
            type === 'Circle' || type === 'Ellipse' ? geo.getShell() : geo.getCoordinates()
        if (this.geometry) {
            const coordsNow = geo.toGeoJSON().geometry.coordinates
            const coordsThis = this.geometry.toGeoJSON().geometry.coordinates
            if (isEqual(coordsNow, coordsThis)) return []
        }
        let geos = []
        const isPolygon = coordinates[0] instanceof Array
        if (isPolygon) coordinates.forEach((coords) => geos.push(...this._createMarkers(coords)))
        if (!isPolygon) {
            const isPoint = coordinates instanceof Array
            if (!isPoint) coordinates = [coordinates]
            geos.push(...this._createMarkers(coordinates))
        }
        return geos
    }

    _createMarkers(coords) {
        const markers = []
        coords.forEach((coord) =>
            markers.push(new maptalks.Marker(coord, { properties: {} }).toGeoJSON())
        )
        return markers
    }

    _resetGeosSet() {
        this._geosSet = []
    }

    _registerMapEvents() {
        if (!this._mousemove) {
            const map = this._map
            this._mousemove = (e) => this._mousemoveEvents(e)
            this._mousedown = () => {
                if (this.drawTool) this._needFindGeometry = false
                if (this.geometry) this._needFindGeometry = true
            }
            this._mouseup = () => {
                if (this.drawTool) this._needFindGeometry = true
                if (this.geometry) this._needFindGeometry = false
            }
            map.on('mousemove touchstart', this._mousemove, this)
            map.on('mousedown', this._mousedown, this)
            map.on('mouseup', this._mouseup, this)
        }
    }

    _offMapEvents() {
        const map = this._map
        if (this._mousemove) map.off('mousemove touchstart', this._mousemove, this)
        if (this._mousedown) map.off('mousedown', this._mousedown, this)
        if (this._mouseup) map.off('mouseup', this._mouseup, this)
    }

    _mousemoveEvents(event) {
        const { coordinate } = event
        this._needDeal = true
        this._mousePoint = coordinate

        const hasMarler = !!this._marker
        if (hasMarler) this._marker.setCoordinates(coordinate)
        if (!hasMarler)
            this._marker = new maptalks.Marker(coordinate, {
                symbol: {}
            }).addTo(this._mousemoveLayer)

        this._updateSnapPoint(coordinate)
    }

    _updateSnapPoint(coordinate) {
        if (this._needFindGeometry) {
            const availGeometries = this._findGeometry(coordinate)

            this.snapPoint =
                availGeometries.features.length > 0 ? this._getSnapPoint(availGeometries) : null

            if (this.snapPoint) {
                const { x, y } = this.snapPoint
                this._marker.setCoordinates([x, y])
            }
        }
    }

    _findGeometry(coordinate) {
        if (this._geosSet) {
            const features = this._geosSet
            this.tree.clear()
            this.tree.load({ type: 'FeatureCollection', features })
            this.inspectExtent = this._createInspectExtent(coordinate)
            const availGeometries = this.tree.search(this.inspectExtent)
            return availGeometries
        }
        return null
    }

    _createInspectExtent(coordinate) {
        const distance = this._distance
        const map = this._map
        const zoom = map.getZoom()
        const { x, y } = map.coordinateToPoint(coordinate, zoom)
        const lefttop = map.pointToCoordinate(
            new maptalks.Point([x - distance, y - distance]),
            zoom
        )
        const righttop = map.pointToCoordinate(
            new maptalks.Point([x + distance, y - distance]),
            zoom
        )
        const leftbottom = map.pointToCoordinate(
            new maptalks.Point([x - distance, y + distance]),
            zoom
        )
        const rightbottom = map.pointToCoordinate(
            new maptalks.Point([x + distance, y + distance]),
            zoom
        )
        return {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [lefttop.x, lefttop.y],
                        [righttop.x, righttop.y],
                        [rightbottom.x, rightbottom.y],
                        [leftbottom.x, leftbottom.y]
                    ]
                ]
            }
        }
    }

    _getSnapPoint(availGeometries) {
        const { geoObject } = this._findNearestGeometries(availGeometries.features)
        const { coordinates } = geoObject.geometry
        const snapPoint = {
            x: coordinates[0],
            y: coordinates[1]
        }
        return snapPoint
    }

    _findNearestGeometries(features) {
        let geoObjects = this._setDistance(features)
        geoObjects = geoObjects.sort(this._compare(geoObjects, 'distance'))
        return geoObjects[0]
    }

    _setDistance(features) {
        const geoObjects = []
        features.forEach((feature) => {
            const distance = this._distToPoint(feature)
            geoObjects.push({
                geoObject: feature,
                distance
            })
        })
        return geoObjects
    }

    _distToPoint(feature) {
        const { x, y } = this._mousePoint
        const from = [x, y]
        const to = feature.geometry.coordinates
        return Math.sqrt(Math.pow(from[0] - to[0], 2) + Math.pow(from[1] - to[1], 2))
    }

    _compare(data, propertyName) {
        return (object1, object2) => {
            const value1 = object1[propertyName]
            const value2 = object2[propertyName]
            return value2 < value1
        }
    }

    _registerDrawToolEvents() {
        const drawTool = this.drawTool
        drawTool.on('drawstart', (e) => this._resetCoordsAndPoint(e), this)
        drawTool.on('mousemove', (e) => this._resetCoordinates(e.target._geometry), this)
        drawTool.on('drawvertex', (e) => this._resetCoordsAndPoint(e), this)
        drawTool.on('drawend', (e) => this._resetCoordinates(e.geometry), this)
    }

    _offDrawToolEvents() {
        if (this.drawTool) {
            const drawTool = this.drawTool
            drawTool.off('drawstart', (e) => this._resetCoordsAndPoint(e), this)
            drawTool.off('mousemove', (e) => this._resetCoordinates(e.target._geometry), this)
            drawTool.off('drawvertex', (e) => this._resetCoordsAndPoint(e), this)
            drawTool.off('drawend', (e) => this._resetCoordinates(e.geometry), this)
        }
    }

    _registerGeometryEvents() {
        const geometry = this.geometry
        geometry.on('shapechange', (e) => this._getEditCoordinates(e.target), this)
        geometry.on('editrecord', (e) => this._upGeoCoords(e.target.getCoordinates()), this)
    }

    _offGeometryEvents() {
        if (this.geometry) {
            const geometry = this.geometry
            geometry.off('shapechange', (e) => this._getEditCoordinates(e.target), this)
            geometry.off('editrecord', (e) => this._upGeoCoords(e.target.getCoordinates()), this)
        }
    }

    _resetCoordsAndPoint(e) {
        this._resetCoordinates(e.target._geometry)
        this._resetClickPoint(e.target._clickCoords)
    }

    _getEditCoordinates(geometry) {
        if (this.snapPoint && this._needDeal) {
            const { x, y } = this.snapPoint
            const coordsOld = this.geometryCoords
            const coords = geometry.getCoordinates()

            const coordsNew = differenceWith(coords[0], coordsOld[0], isEqual)[0]
            const coordsIndex = findIndex(coords[0], coordsNew)

            const moreVertux = coords[0].length === coordsOld[0].length
            if (moreVertux) {
                coords[0][coordsIndex].x = x
                coords[0][coordsIndex].y = y
                if (coordsIndex === 0) {
                    coords[0][coords[0].length - 1].x = x
                    coords[0][coords[0].length - 1].y = y
                }
            }
            if (!moreVertux) {
                coords[0].splice(coordsIndex, 0, new maptalks.Coordinate(x, y))
            }
            this._needDeal = false
            this._upGeoCoords(coords)
            console.log(coordsIndex, coordsNew)
            console.log(coords[0])
            console.log(this.geometryCoords[0])
            geometry.setCoordinates(this.geometryCoords)
            return geometry
        }
    }

    _upGeoCoords(coords) {
        this.geometryCoords = coords
    }

    _resetCoordinates(geometry) {
        if (this.snapPoint) {
            const { x, y } = this.snapPoint
            const coords = geometry.getCoordinates()
            const { length } = coords
            if (length) {
                coords[length - 1].x = x
                coords[length - 1].y = y
            }
            geometry.setCoordinates(coords)
            return geometry
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
}

SnapEndPoint.mergeOptions(options)
