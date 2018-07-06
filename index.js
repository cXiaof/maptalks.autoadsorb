import * as maptalks from 'maptalks'
import rbush from 'geojson-rbush'
import isEqual from 'lodash/isEqual'
import differenceWith from 'lodash/differenceWith'
import findIndex from 'lodash/findIndex'
import includes from 'lodash/includes'
import flattenDeep from 'lodash/flattenDeep'

const options = {
    mode: 'auto',
    distance: 10
}

export class AdjustTo extends maptalks.Class {
    constructor(options) {
        super(options)
        this.tree = rbush()
        this._distance = Math.max(this.options['distance'] || options.distance, 1)
        this._layerName = `${maptalks.INTERNAL_LAYER_PREFIX}_AdjustTo`
        this._updateModeType()
    }

    setLayer(layer) {
        if (layer instanceof maptalks.VectorLayer) {
            const map = layer.map
            this._addTo(map)
            this.adjustlayer = layer
            this.adjustlayer.on('addgeo', () => this._updateGeosSet(), this)
            this.adjustlayer.on('clear', () => this._resetGeosSet(), this)
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
            this._addTo(map)
            this.adjustlayer = layer
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
            geometry.startEdit().endEdit()
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

    setMode(mode) {
        this._updateModeType(mode)
        this._updateGeosSet()
        return this
    }

    getMode() {
        return this._mode
    }

    _updateModeType(mode) {
        this._mode = mode || this.options['mode'] || options.mode
    }

    _addTo(map) {
        const _layer = map.getLayer(this._layerName)
        if (_layer) this.remove()
        this._mousemoveLayer = new maptalks.VectorLayer(this._layerName).addTo(map)
        this._mousemoveLayer.bringToFront()
        this._map = map
        this._resetGeosSet()
        return this
    }

    _updateGeosSet() {
        const geometries = this.adjustlayer.getGeometries()
        let geos = []
        geometries.forEach((geo) => {
            let geoArr = []
            const modeAuto = this._mode === 'auto'
            const modeVertux = this._mode === 'vertux'
            const modeBorder = this._mode === 'border'
            if (modeAuto || modeVertux) geoArr.push(...this._parseToPoints(geo))
            if (modeAuto || modeBorder) geoArr.push(...this._parseToLines(geo))
            geos.push(...geoArr)
        })
        this._geosSet = geos
    }

    _parseToPoints(geo) {
        if (this._skipGeoSelf(geo)) return []
        let geos = []
        let coordinates = geo.getCoordinates()
        if (coordinates[0] instanceof Array)
            coordinates.forEach((coords) => geos.push(...this._createMarkers(coords)))
        else {
            if (!(coordinates instanceof Array)) coordinates = [coordinates]
            geos.push(...this._createMarkers(coordinates))
        }
        return geos
    }

    _skipGeoSelf(geo) {
        if (geo.type === 'MultiPolygon') return false
        if (this.geometry) {
            const coordsNow = geo.toGeoJSON().geometry.coordinates
            const coordsThis = this.geometry.toGeoJSON().geometry.coordinates
            return isEqual(coordsNow, coordsThis)
        }
        return false
    }

    _createMarkers(coords) {
        const markers = []
        flattenDeep(coords).forEach((coord) =>
            markers.push(new maptalks.Marker(coord, { properties: {} }).toGeoJSON())
        )
        return markers
    }

    _parseToLines(geo) {
        if (this._skipGeoSelf(geo)) return []
        let geos = []
        if (geo.getType() === 'Point') {
            const feature = geo.toGeoJSON()
            feature.properties = {}
            geos.push(feature)
        } else geos.push(...this._parsePolygonToLine(geo))
        return geos
    }

    _parsePolygonToLine(geo) {
        const coordinates = geo.getCoordinates()
        let geos = []
        switch (geo.type) {
            case 'MultiPolygon':
                coordinates.forEach((coords) =>
                    coords.forEach((coordsItem) => geos.push(...this._createLine(coordsItem, geo)))
                )
                break
            case 'Polygon':
                coordinates.forEach((coords) => geos.push(...this._createLine(coords, geo)))
                break
            default:
                geos.push(...this._createLine(coordinates, geo))
                break
        }
        return geos
    }

    _createLine(coords, geo) {
        let lines = []
        for (let i = 0; i < coords.length - 1; i++) {
            const x = coords[i]
            const y = coords[i + 1]
            const line = new maptalks.LineString([x, y], { properties: { obj: geo } })
            lines.push(line.toGeoJSON())
        }
        return lines
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

        if (this._marker) this._marker.setCoordinates(coordinate)
        else
            this._marker = new maptalks.Marker(coordinate, {
                symbol: {}
            }).addTo(this._mousemoveLayer)

        this._updateAdjustPoint(coordinate)
    }

    _updateAdjustPoint(coordinate) {
        if (this._needFindGeometry) {
            const availGeos = this._findGeometry(coordinate)

            this.adjustPoint =
                availGeos && availGeos.features.length > 0 ? this._getAdjustPoint(availGeos) : null

            if (this.adjustPoint) {
                const { x, y } = this.adjustPoint
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
            const availGeos = this.tree.search(this.inspectExtent)
            return availGeos
        }
        return null
    }

    _createInspectExtent(coordinate) {
        const distance = this._distance
        const map = this._map
        const zoom = map.getZoom()
        const { x, y } = map.coordinateToPoint(coordinate, zoom)
        const lt = this._pointToCoordinateWithZoom([x - distance, y - distance], zoom)
        const rt = this._pointToCoordinateWithZoom([x + distance, y - distance], zoom)
        const rb = this._pointToCoordinateWithZoom([x + distance, y + distance], zoom)
        const lb = this._pointToCoordinateWithZoom([x - distance, y + distance], zoom)
        return {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Polygon',
                coordinates: [[[lt.x, lt.y], [rt.x, rt.y], [rb.x, rb.y], [lb.x, lb.y]]]
            }
        }
    }

    _pointToCoordinateWithZoom(point, zoom) {
        const map = this._map
        return map.pointToCoordinate(new maptalks.Point(point), zoom)
    }

    _getAdjustPoint(availGeos) {
        const nearestFeature = this._findNearestFeatures(availGeos.features)
        if (!nearestFeature) return null
        const { geoObject } = nearestFeature
        const { coordinates, type } = geoObject.geometry
        const coords0 = coordinates[0]
        switch (type) {
            case 'Point':
                return { x: coords0, y: coordinates[1] }
            case 'LineString':
                const nearestLine = this._setEquation(geoObject)
                const { A, B } = nearestLine
                const { x, y } = this._mousePoint
                if (A === 0) return { x, y: coords0[1] }
                else if (A === Infinity) return { x: coords0[0], y }
                else {
                    const k = B / A
                    const verticalLine = this._setVertiEquation(k)
                    return this._solveEquation(nearestLine, verticalLine)
                }
            default:
                return null
        }
    }

    _setEquation(geoObject) {
        const [from, to] = geoObject.geometry.coordinates
        const [fromX, fromY] = from
        const [toX, toY] = to
        let k = (fromY - toY) / (fromX - toX)
        k = k === -Infinity ? -k : k
        return {
            A: k,
            B: -1,
            C: fromY - k * fromX
        }
    }

    _setVertiEquation(k) {
        const { x, y } = this._mousePoint
        return {
            A: k,
            B: -1,
            C: y - k * x
        }
    }

    _solveEquation(equationW, equationU) {
        const A1 = equationW.A
        const B1 = equationW.B
        const C1 = equationW.C
        const A2 = equationU.A
        const B2 = equationU.B
        const C2 = equationU.C
        const x = (B1 * C2 - C1 * B2) / (A1 * B2 - A2 * B1)
        const y = (A1 * C2 - A2 * C1) / (B1 * A2 - B2 * A1)
        return { x, y }
    }

    _findNearestFeatures(features) {
        let geoObjects = this._setDistance(features)
        if (geoObjects.length === 0) return null
        geoObjects = geoObjects.sort(this._compare(geoObjects, 'distance'))
        return geoObjects[0]
    }

    _setDistance(features) {
        const geoObjects = []
        let noPoint = true
        features.forEach((geo) => {
            const { type } = geo.geometry
            noPoint = noPoint && type !== 'Point'
        })
        for (let i = 0; i < features.length; i++) {
            const geoObject = features[i]
            const { type } = geoObject.geometry
            let distance
            switch (type) {
                case 'Point':
                    distance = this._distToPoint(geoObject)
                    break
                case 'LineString':
                    if (noPoint) distance = this._distToPolyline(geoObject)
                    break
                default:
                    break
            }
            if (distance !== undefined) geoObjects.push({ geoObject, distance })
        }
        return geoObjects
    }

    _distToPoint(feature) {
        const { x, y } = this._mousePoint
        const from = [x, y]
        const to = feature.geometry.coordinates
        return Math.sqrt(Math.pow(from[0] - to[0], 2) + Math.pow(from[1] - to[1], 2))
    }

    _distToPolyline(feature) {
        const { x, y } = this._mousePoint
        const { A, B, C } = this._setEquation(feature)
        const distance = Math.abs((A * x + B * y + C) / Math.sqrt(Math.pow(A, 2) + Math.pow(B, 2)))
        return distance
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

    _resetCoordinates(geometry) {
        if (this.adjustPoint) {
            const { x, y } = this.adjustPoint
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
        if (this.adjustPoint) {
            const { x, y } = this.adjustPoint
            const { length } = clickCoords
            clickCoords[length - 1].x = x
            clickCoords[length - 1].y = y
        }
    }

    _getEditCoordinates(geometry) {
        if (this.adjustPoint && this._needDeal) {
            const { x, y } = this.adjustPoint
            const coordsOld0 = this.geometryCoords[0]
            if (!includes(coordsOld0, this.adjustPoint)) {
                const coords = geometry.getCoordinates()
                const coords0 = coords[0]
                const { length } = coords0

                const coordsNew = differenceWith(coords0, coordsOld0, isEqual)[0]
                const coordsIndex = findIndex(coords0, coordsNew)

                coords[0][coordsIndex].x = x
                coords[0][coordsIndex].y = y
                if (coordsIndex === 0) {
                    coords[0][length - 1].x = x
                    coords[0][length - 1].y = y
                }

                this._needDeal = false
                this._upGeoCoords(coords)
                geometry.setCoordinates(this.geometryCoords)
            }
            return geometry
        }
    }

    _findEditedMultiIndex(geometry) {
        let index = 0
        this.geometryCoords.forEach((coords, i) => {
            if (JSON.stringify(coords) !== JSON.stringify(geometry.getCoordinates())) index = i
        })
        return index
    }

    _upGeoCoords(coords) {
        this.geometryCoords = coords
    }
}

AdjustTo.mergeOptions(options)
