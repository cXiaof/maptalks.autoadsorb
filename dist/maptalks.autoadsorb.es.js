/*!
 * maptalks.autoadsorb v0.4.0
 * LICENSE : MIT
 * (c) 2016-2022 maptalks.org
 */
/*!
 * requires maptalks@>=0.46.0 
 */
import { Circle, Class, DrawTool, Ellipse, Geometry, GeometryCollection, INTERNAL_LAYER_PREFIX, LineString, Marker, MultiLineString, MultiPoint, Util, VectorLayer } from 'maptalks';
import isEqual from 'lodash.isequal';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * @module helpers
 */
/**
 * Earth Radius used with the Harvesine formula and approximates using a spherical (non-ellipsoid) Earth.
 *
 * @memberof helpers
 * @type {number}
 */
var earthRadius = 6371008.8;
/**
 * Unit of measurement factors using a spherical (non-ellipsoid) earth radius.
 *
 * @memberof helpers
 * @type {Object}
 */
var factors = {
    centimeters: earthRadius * 100,
    centimetres: earthRadius * 100,
    degrees: earthRadius / 111325,
    feet: earthRadius * 3.28084,
    inches: earthRadius * 39.37,
    kilometers: earthRadius / 1000,
    kilometres: earthRadius / 1000,
    meters: earthRadius,
    metres: earthRadius,
    miles: earthRadius / 1609.344,
    millimeters: earthRadius * 1000,
    millimetres: earthRadius * 1000,
    nauticalmiles: earthRadius / 1852,
    radians: 1,
    yards: earthRadius * 1.0936
};
/**
 * Units of measurement factors based on 1 meter.
 *
 * @memberof helpers
 * @type {Object}
 */
var unitsFactors = {
    centimeters: 100,
    centimetres: 100,
    degrees: 1 / 111325,
    feet: 3.28084,
    inches: 39.37,
    kilometers: 1 / 1000,
    kilometres: 1 / 1000,
    meters: 1,
    metres: 1,
    miles: 1 / 1609.344,
    millimeters: 1000,
    millimetres: 1000,
    nauticalmiles: 1 / 1852,
    radians: 1 / earthRadius,
    yards: 1.0936133
};
/**
 * Area of measurement factors based on 1 square meter.
 *
 * @memberof helpers
 * @type {Object}
 */
var areaFactors = {
    acres: 0.000247105,
    centimeters: 10000,
    centimetres: 10000,
    feet: 10.763910417,
    hectares: 0.0001,
    inches: 1550.003100006,
    kilometers: 0.000001,
    kilometres: 0.000001,
    meters: 1,
    metres: 1,
    miles: 3.86e-7,
    millimeters: 1000000,
    millimetres: 1000000,
    yards: 1.195990046
};
/**
 * Wraps a GeoJSON {@link Geometry} in a GeoJSON {@link Feature}.
 *
 * @name feature
 * @param {Geometry} geometry input geometry
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature} a GeoJSON Feature
 * @example
 * var geometry = {
 *   "type": "Point",
 *   "coordinates": [110, 50]
 * };
 *
 * var feature = turf.feature(geometry);
 *
 * //=feature
 */
function feature(geom, properties, options) {
    if (options === void 0) {
        options = {};
    }
    var feat = { type: "Feature" };
    if (options.id === 0 || options.id) {
        feat.id = options.id;
    }
    if (options.bbox) {
        feat.bbox = options.bbox;
    }
    feat.properties = properties || {};
    feat.geometry = geom;
    return feat;
}
/**
 * Creates a GeoJSON {@link Geometry} from a Geometry string type & coordinates.
 * For GeometryCollection type use `helpers.geometryCollection`
 *
 * @name geometry
 * @param {string} type Geometry Type
 * @param {Array<any>} coordinates Coordinates
 * @param {Object} [options={}] Optional Parameters
 * @returns {Geometry} a GeoJSON Geometry
 * @example
 * var type = "Point";
 * var coordinates = [110, 50];
 * var geometry = turf.geometry(type, coordinates);
 * // => geometry
 */
function geometry(type, coordinates, _options) {
    if (_options === void 0) {
        _options = {};
    }
    switch (type) {
        case "Point":
            return point(coordinates).geometry;
        case "LineString":
            return lineString(coordinates).geometry;
        case "Polygon":
            return polygon(coordinates).geometry;
        case "MultiPoint":
            return multiPoint(coordinates).geometry;
        case "MultiLineString":
            return multiLineString(coordinates).geometry;
        case "MultiPolygon":
            return multiPolygon(coordinates).geometry;
        default:
            throw new Error(type + " is invalid");
    }
}
/**
 * Creates a {@link Point} {@link Feature} from a Position.
 *
 * @name point
 * @param {Array<number>} coordinates longitude, latitude position (each in decimal degrees)
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<Point>} a Point feature
 * @example
 * var point = turf.point([-75.343, 39.984]);
 *
 * //=point
 */
function point(coordinates, properties, options) {
    if (options === void 0) {
        options = {};
    }
    if (!coordinates) {
        throw new Error("coordinates is required");
    }
    if (!Array.isArray(coordinates)) {
        throw new Error("coordinates must be an Array");
    }
    if (coordinates.length < 2) {
        throw new Error("coordinates must be at least 2 numbers long");
    }
    if (!isNumber(coordinates[0]) || !isNumber(coordinates[1])) {
        throw new Error("coordinates must contain numbers");
    }
    var geom = {
        type: "Point",
        coordinates: coordinates
    };
    return feature(geom, properties, options);
}
/**
 * Creates a {@link Point} {@link FeatureCollection} from an Array of Point coordinates.
 *
 * @name points
 * @param {Array<Array<number>>} coordinates an array of Points
 * @param {Object} [properties={}] Translate these properties to each Feature
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north]
 * associated with the FeatureCollection
 * @param {string|number} [options.id] Identifier associated with the FeatureCollection
 * @returns {FeatureCollection<Point>} Point Feature
 * @example
 * var points = turf.points([
 *   [-75, 39],
 *   [-80, 45],
 *   [-78, 50]
 * ]);
 *
 * //=points
 */
function points(coordinates, properties, options) {
    if (options === void 0) {
        options = {};
    }
    return featureCollection(coordinates.map(function (coords) {
        return point(coords, properties);
    }), options);
}
/**
 * Creates a {@link Polygon} {@link Feature} from an Array of LinearRings.
 *
 * @name polygon
 * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<Polygon>} Polygon Feature
 * @example
 * var polygon = turf.polygon([[[-5, 52], [-4, 56], [-2, 51], [-7, 54], [-5, 52]]], { name: 'poly1' });
 *
 * //=polygon
 */
function polygon(coordinates, properties, options) {
    if (options === void 0) {
        options = {};
    }
    for (var _i = 0, coordinates_1 = coordinates; _i < coordinates_1.length; _i++) {
        var ring = coordinates_1[_i];
        if (ring.length < 4) {
            throw new Error("Each LinearRing of a Polygon must have 4 or more Positions.");
        }
        for (var j = 0; j < ring[ring.length - 1].length; j++) {
            // Check if first point of Polygon contains two numbers
            if (ring[ring.length - 1][j] !== ring[0][j]) {
                throw new Error("First and last Position are not equivalent.");
            }
        }
    }
    var geom = {
        type: "Polygon",
        coordinates: coordinates
    };
    return feature(geom, properties, options);
}
/**
 * Creates a {@link Polygon} {@link FeatureCollection} from an Array of Polygon coordinates.
 *
 * @name polygons
 * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygon coordinates
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the FeatureCollection
 * @returns {FeatureCollection<Polygon>} Polygon FeatureCollection
 * @example
 * var polygons = turf.polygons([
 *   [[[-5, 52], [-4, 56], [-2, 51], [-7, 54], [-5, 52]]],
 *   [[[-15, 42], [-14, 46], [-12, 41], [-17, 44], [-15, 42]]],
 * ]);
 *
 * //=polygons
 */
function polygons(coordinates, properties, options) {
    if (options === void 0) {
        options = {};
    }
    return featureCollection(coordinates.map(function (coords) {
        return polygon(coords, properties);
    }), options);
}
/**
 * Creates a {@link LineString} {@link Feature} from an Array of Positions.
 *
 * @name lineString
 * @param {Array<Array<number>>} coordinates an array of Positions
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<LineString>} LineString Feature
 * @example
 * var linestring1 = turf.lineString([[-24, 63], [-23, 60], [-25, 65], [-20, 69]], {name: 'line 1'});
 * var linestring2 = turf.lineString([[-14, 43], [-13, 40], [-15, 45], [-10, 49]], {name: 'line 2'});
 *
 * //=linestring1
 * //=linestring2
 */
function lineString(coordinates, properties, options) {
    if (options === void 0) {
        options = {};
    }
    if (coordinates.length < 2) {
        throw new Error("coordinates must be an array of two or more positions");
    }
    var geom = {
        type: "LineString",
        coordinates: coordinates
    };
    return feature(geom, properties, options);
}
/**
 * Creates a {@link LineString} {@link FeatureCollection} from an Array of LineString coordinates.
 *
 * @name lineStrings
 * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north]
 * associated with the FeatureCollection
 * @param {string|number} [options.id] Identifier associated with the FeatureCollection
 * @returns {FeatureCollection<LineString>} LineString FeatureCollection
 * @example
 * var linestrings = turf.lineStrings([
 *   [[-24, 63], [-23, 60], [-25, 65], [-20, 69]],
 *   [[-14, 43], [-13, 40], [-15, 45], [-10, 49]]
 * ]);
 *
 * //=linestrings
 */
function lineStrings(coordinates, properties, options) {
    if (options === void 0) {
        options = {};
    }
    return featureCollection(coordinates.map(function (coords) {
        return lineString(coords, properties);
    }), options);
}
/**
 * Takes one or more {@link Feature|Features} and creates a {@link FeatureCollection}.
 *
 * @name featureCollection
 * @param {Feature[]} features input features
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {FeatureCollection} FeatureCollection of Features
 * @example
 * var locationA = turf.point([-75.343, 39.984], {name: 'Location A'});
 * var locationB = turf.point([-75.833, 39.284], {name: 'Location B'});
 * var locationC = turf.point([-75.534, 39.123], {name: 'Location C'});
 *
 * var collection = turf.featureCollection([
 *   locationA,
 *   locationB,
 *   locationC
 * ]);
 *
 * //=collection
 */
function featureCollection(features, options) {
    if (options === void 0) {
        options = {};
    }
    var fc = { type: "FeatureCollection" };
    if (options.id) {
        fc.id = options.id;
    }
    if (options.bbox) {
        fc.bbox = options.bbox;
    }
    fc.features = features;
    return fc;
}
/**
 * Creates a {@link Feature<MultiLineString>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiLineString
 * @param {Array<Array<Array<number>>>} coordinates an array of LineStrings
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<MultiLineString>} a MultiLineString feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiLine = turf.multiLineString([[[0,0],[10,10]]]);
 *
 * //=multiLine
 */
function multiLineString(coordinates, properties, options) {
    if (options === void 0) {
        options = {};
    }
    var geom = {
        type: "MultiLineString",
        coordinates: coordinates
    };
    return feature(geom, properties, options);
}
/**
 * Creates a {@link Feature<MultiPoint>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiPoint
 * @param {Array<Array<number>>} coordinates an array of Positions
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<MultiPoint>} a MultiPoint feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiPt = turf.multiPoint([[0,0],[10,10]]);
 *
 * //=multiPt
 */
function multiPoint(coordinates, properties, options) {
    if (options === void 0) {
        options = {};
    }
    var geom = {
        type: "MultiPoint",
        coordinates: coordinates
    };
    return feature(geom, properties, options);
}
/**
 * Creates a {@link Feature<MultiPolygon>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name multiPolygon
 * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygons
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<MultiPolygon>} a multipolygon feature
 * @throws {Error} if no coordinates are passed
 * @example
 * var multiPoly = turf.multiPolygon([[[[0,0],[0,10],[10,10],[10,0],[0,0]]]]);
 *
 * //=multiPoly
 *
 */
function multiPolygon(coordinates, properties, options) {
    if (options === void 0) {
        options = {};
    }
    var geom = {
        type: "MultiPolygon",
        coordinates: coordinates
    };
    return feature(geom, properties, options);
}
/**
 * Creates a {@link Feature<GeometryCollection>} based on a
 * coordinate array. Properties can be added optionally.
 *
 * @name geometryCollection
 * @param {Array<Geometry>} geometries an array of GeoJSON Geometries
 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
 * @param {Object} [options={}] Optional Parameters
 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
 * @param {string|number} [options.id] Identifier associated with the Feature
 * @returns {Feature<GeometryCollection>} a GeoJSON GeometryCollection Feature
 * @example
 * var pt = turf.geometry("Point", [100, 0]);
 * var line = turf.geometry("LineString", [[101, 0], [102, 1]]);
 * var collection = turf.geometryCollection([pt, line]);
 *
 * // => collection
 */
function geometryCollection(geometries, properties, options) {
    if (options === void 0) {
        options = {};
    }
    var geom = {
        type: "GeometryCollection",
        geometries: geometries
    };
    return feature(geom, properties, options);
}
/**
 * Round number to precision
 *
 * @param {number} num Number
 * @param {number} [precision=0] Precision
 * @returns {number} rounded number
 * @example
 * turf.round(120.4321)
 * //=120
 *
 * turf.round(120.4321, 2)
 * //=120.43
 */
function round(num, precision) {
    if (precision === void 0) {
        precision = 0;
    }
    if (precision && !(precision >= 0)) {
        throw new Error("precision must be a positive number");
    }
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(num * multiplier) / multiplier;
}
/**
 * Convert a distance measurement (assuming a spherical Earth) from radians to a more friendly unit.
 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
 *
 * @name radiansToLength
 * @param {number} radians in radians across the sphere
 * @param {string} [units="kilometers"] can be degrees, radians, miles, inches, yards, metres,
 * meters, kilometres, kilometers.
 * @returns {number} distance
 */
function radiansToLength(radians, units) {
    if (units === void 0) {
        units = "kilometers";
    }
    var factor = factors[units];
    if (!factor) {
        throw new Error(units + " units is invalid");
    }
    return radians * factor;
}
/**
 * Convert a distance measurement (assuming a spherical Earth) from a real-world unit into radians
 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
 *
 * @name lengthToRadians
 * @param {number} distance in real units
 * @param {string} [units="kilometers"] can be degrees, radians, miles, inches, yards, metres,
 * meters, kilometres, kilometers.
 * @returns {number} radians
 */
function lengthToRadians(distance, units) {
    if (units === void 0) {
        units = "kilometers";
    }
    var factor = factors[units];
    if (!factor) {
        throw new Error(units + " units is invalid");
    }
    return distance / factor;
}
/**
 * Convert a distance measurement (assuming a spherical Earth) from a real-world unit into degrees
 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, centimeters, kilometres, feet
 *
 * @name lengthToDegrees
 * @param {number} distance in real units
 * @param {string} [units="kilometers"] can be degrees, radians, miles, inches, yards, metres,
 * meters, kilometres, kilometers.
 * @returns {number} degrees
 */
function lengthToDegrees(distance, units) {
    return radiansToDegrees(lengthToRadians(distance, units));
}
/**
 * Converts any bearing angle from the north line direction (positive clockwise)
 * and returns an angle between 0-360 degrees (positive clockwise), 0 being the north line
 *
 * @name bearingToAzimuth
 * @param {number} bearing angle, between -180 and +180 degrees
 * @returns {number} angle between 0 and 360 degrees
 */
function bearingToAzimuth(bearing) {
    var angle = bearing % 360;
    if (angle < 0) {
        angle += 360;
    }
    return angle;
}
/**
 * Converts an angle in radians to degrees
 *
 * @name radiansToDegrees
 * @param {number} radians angle in radians
 * @returns {number} degrees between 0 and 360 degrees
 */
function radiansToDegrees(radians) {
    var degrees = radians % (2 * Math.PI);
    return degrees * 180 / Math.PI;
}
/**
 * Converts an angle in degrees to radians
 *
 * @name degreesToRadians
 * @param {number} degrees angle between 0 and 360 degrees
 * @returns {number} angle in radians
 */
function degreesToRadians(degrees) {
    var radians = degrees % 360;
    return radians * Math.PI / 180;
}
/**
 * Converts a length to the requested unit.
 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
 *
 * @param {number} length to be converted
 * @param {Units} [originalUnit="kilometers"] of the length
 * @param {Units} [finalUnit="kilometers"] returned unit
 * @returns {number} the converted length
 */
function convertLength(length, originalUnit, finalUnit) {
    if (originalUnit === void 0) {
        originalUnit = "kilometers";
    }
    if (finalUnit === void 0) {
        finalUnit = "kilometers";
    }
    if (!(length >= 0)) {
        throw new Error("length must be a positive number");
    }
    return radiansToLength(lengthToRadians(length, originalUnit), finalUnit);
}
/**
 * Converts a area to the requested unit.
 * Valid units: kilometers, kilometres, meters, metres, centimetres, millimeters, acres, miles, yards, feet, inches, hectares
 * @param {number} area to be converted
 * @param {Units} [originalUnit="meters"] of the distance
 * @param {Units} [finalUnit="kilometers"] returned unit
 * @returns {number} the converted area
 */
function convertArea(area, originalUnit, finalUnit) {
    if (originalUnit === void 0) {
        originalUnit = "meters";
    }
    if (finalUnit === void 0) {
        finalUnit = "kilometers";
    }
    if (!(area >= 0)) {
        throw new Error("area must be a positive number");
    }
    var startFactor = areaFactors[originalUnit];
    if (!startFactor) {
        throw new Error("invalid original units");
    }
    var finalFactor = areaFactors[finalUnit];
    if (!finalFactor) {
        throw new Error("invalid final units");
    }
    return area / startFactor * finalFactor;
}
/**
 * isNumber
 *
 * @param {*} num Number to validate
 * @returns {boolean} true/false
 * @example
 * turf.isNumber(123)
 * //=true
 * turf.isNumber('foo')
 * //=false
 */
function isNumber(num) {
    return !isNaN(num) && num !== null && !Array.isArray(num);
}
/**
 * isObject
 *
 * @param {*} input variable to validate
 * @returns {boolean} true/false
 * @example
 * turf.isObject({elevation: 10})
 * //=true
 * turf.isObject('foo')
 * //=false
 */
function isObject(input) {
    return !!input && input.constructor === Object;
}
/**
 * Validate BBox
 *
 * @private
 * @param {Array<number>} bbox BBox to validate
 * @returns {void}
 * @throws Error if BBox is not valid
 * @example
 * validateBBox([-180, -40, 110, 50])
 * //=OK
 * validateBBox([-180, -40])
 * //=Error
 * validateBBox('Foo')
 * //=Error
 * validateBBox(5)
 * //=Error
 * validateBBox(null)
 * //=Error
 * validateBBox(undefined)
 * //=Error
 */
function validateBBox(bbox) {
    if (!bbox) {
        throw new Error("bbox is required");
    }
    if (!Array.isArray(bbox)) {
        throw new Error("bbox must be an Array");
    }
    if (bbox.length !== 4 && bbox.length !== 6) {
        throw new Error("bbox must be an Array of 4 or 6 numbers");
    }
    bbox.forEach(function (num) {
        if (!isNumber(num)) {
            throw new Error("bbox must only contain numbers");
        }
    });
}
/**
 * Validate Id
 *
 * @private
 * @param {string|number} id Id to validate
 * @returns {void}
 * @throws Error if Id is not valid
 * @example
 * validateId([-180, -40, 110, 50])
 * //=Error
 * validateId([-180, -40])
 * //=Error
 * validateId('Foo')
 * //=OK
 * validateId(5)
 * //=OK
 * validateId(null)
 * //=Error
 * validateId(undefined)
 * //=Error
 */
function validateId(id) {
    if (!id) {
        throw new Error("id is required");
    }
    if (["string", "number"].indexOf(typeof id === "undefined" ? "undefined" : _typeof(id)) === -1) {
        throw new Error("id must be a number or a string");
    }
}

var es = Object.freeze({
	earthRadius: earthRadius,
	factors: factors,
	unitsFactors: unitsFactors,
	areaFactors: areaFactors,
	feature: feature,
	geometry: geometry,
	point: point,
	points: points,
	polygon: polygon,
	polygons: polygons,
	lineString: lineString,
	lineStrings: lineStrings,
	featureCollection: featureCollection,
	multiLineString: multiLineString,
	multiPoint: multiPoint,
	multiPolygon: multiPolygon,
	geometryCollection: geometryCollection,
	round: round,
	radiansToLength: radiansToLength,
	lengthToRadians: lengthToRadians,
	lengthToDegrees: lengthToDegrees,
	bearingToAzimuth: bearingToAzimuth,
	radiansToDegrees: radiansToDegrees,
	degreesToRadians: degreesToRadians,
	convertLength: convertLength,
	convertArea: convertArea,
	isNumber: isNumber,
	isObject: isObject,
	validateBBox: validateBBox,
	validateId: validateId
});

/**
 * Callback for coordEach
 *
 * @callback coordEachCallback
 * @param {Array<number>} currentCoord The current coordinate being processed.
 * @param {number} coordIndex The current index of the coordinate being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
 * @param {number} geometryIndex The current index of the Geometry being processed.
 */

/**
 * Iterate over coordinates in any GeoJSON object, similar to Array.forEach()
 *
 * @name coordEach
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @param {Function} callback a method that takes (currentCoord, coordIndex, featureIndex, multiFeatureIndex)
 * @param {boolean} [excludeWrapCoord=false] whether or not to include the final coordinate of LinearRings that wraps the ring in its iteration.
 * @returns {void}
 * @example
 * var features = turf.featureCollection([
 *   turf.point([26, 37], {"foo": "bar"}),
 *   turf.point([36, 53], {"hello": "world"})
 * ]);
 *
 * turf.coordEach(features, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
 *   //=currentCoord
 *   //=coordIndex
 *   //=featureIndex
 *   //=multiFeatureIndex
 *   //=geometryIndex
 * });
 */
function coordEach(geojson, callback, excludeWrapCoord) {
  // Handles null Geometry -- Skips this GeoJSON
  if (geojson === null) return;
  var j,
      k,
      l,
      geometry$$1,
      stopG,
      coords,
      geometryMaybeCollection,
      wrapShrink = 0,
      coordIndex = 0,
      isGeometryCollection,
      type = geojson.type,
      isFeatureCollection = type === "FeatureCollection",
      isFeature = type === "Feature",
      stop = isFeatureCollection ? geojson.features.length : 1;

  // This logic may look a little weird. The reason why it is that way
  // is because it's trying to be fast. GeoJSON supports multiple kinds
  // of objects at its root: FeatureCollection, Features, Geometries.
  // This function has the responsibility of handling all of them, and that
  // means that some of the `for` loops you see below actually just don't apply
  // to certain inputs. For instance, if you give this just a
  // Point geometry, then both loops are short-circuited and all we do
  // is gradually rename the input until it's called 'geometry'.
  //
  // This also aims to allocate as few resources as possible: just a
  // few numbers and booleans, rather than any temporary arrays as would
  // be required with the normalization approach.
  for (var featureIndex = 0; featureIndex < stop; featureIndex++) {
    geometryMaybeCollection = isFeatureCollection ? geojson.features[featureIndex].geometry : isFeature ? geojson.geometry : geojson;
    isGeometryCollection = geometryMaybeCollection ? geometryMaybeCollection.type === "GeometryCollection" : false;
    stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

    for (var geomIndex = 0; geomIndex < stopG; geomIndex++) {
      var multiFeatureIndex = 0;
      var geometryIndex = 0;
      geometry$$1 = isGeometryCollection ? geometryMaybeCollection.geometries[geomIndex] : geometryMaybeCollection;

      // Handles null Geometry -- Skips this geometry
      if (geometry$$1 === null) continue;
      coords = geometry$$1.coordinates;
      var geomType = geometry$$1.type;

      wrapShrink = excludeWrapCoord && (geomType === "Polygon" || geomType === "MultiPolygon") ? 1 : 0;

      switch (geomType) {
        case null:
          break;
        case "Point":
          if (callback(coords, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
          coordIndex++;
          multiFeatureIndex++;
          break;
        case "LineString":
        case "MultiPoint":
          for (j = 0; j < coords.length; j++) {
            if (callback(coords[j], coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
            coordIndex++;
            if (geomType === "MultiPoint") multiFeatureIndex++;
          }
          if (geomType === "LineString") multiFeatureIndex++;
          break;
        case "Polygon":
        case "MultiLineString":
          for (j = 0; j < coords.length; j++) {
            for (k = 0; k < coords[j].length - wrapShrink; k++) {
              if (callback(coords[j][k], coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
              coordIndex++;
            }
            if (geomType === "MultiLineString") multiFeatureIndex++;
            if (geomType === "Polygon") geometryIndex++;
          }
          if (geomType === "Polygon") multiFeatureIndex++;
          break;
        case "MultiPolygon":
          for (j = 0; j < coords.length; j++) {
            geometryIndex = 0;
            for (k = 0; k < coords[j].length; k++) {
              for (l = 0; l < coords[j][k].length - wrapShrink; l++) {
                if (callback(coords[j][k][l], coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
                coordIndex++;
              }
              geometryIndex++;
            }
            multiFeatureIndex++;
          }
          break;
        case "GeometryCollection":
          for (j = 0; j < geometry$$1.geometries.length; j++) {
            if (coordEach(geometry$$1.geometries[j], callback, excludeWrapCoord) === false) return false;
          }break;
        default:
          throw new Error("Unknown Geometry Type");
      }
    }
  }
}

/**
 * Callback for coordReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback coordReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Array<number>} currentCoord The current coordinate being processed.
 * @param {number} coordIndex The current index of the coordinate being processed.
 * Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
 * @param {number} featureIndex The current index of the Feature being processed.
 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
 * @param {number} geometryIndex The current index of the Geometry being processed.
 */

/**
 * Reduce coordinates in any GeoJSON object, similar to Array.reduce()
 *
 * @name coordReduce
 * @param {FeatureCollection|Geometry|Feature} geojson any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentCoord, coordIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @param {boolean} [excludeWrapCoord=false] whether or not to include the final coordinate of LinearRings that wraps the ring in its iteration.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = turf.featureCollection([
 *   turf.point([26, 37], {"foo": "bar"}),
 *   turf.point([36, 53], {"hello": "world"})
 * ]);
 *
 * turf.coordReduce(features, function (previousValue, currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
 *   //=previousValue
 *   //=currentCoord
 *   //=coordIndex
 *   //=featureIndex
 *   //=multiFeatureIndex
 *   //=geometryIndex
 *   return currentCoord;
 * });
 */
function coordReduce(geojson, callback, initialValue, excludeWrapCoord) {
  var previousValue = initialValue;
  coordEach(geojson, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
    if (coordIndex === 0 && initialValue === undefined) previousValue = currentCoord;else previousValue = callback(previousValue, currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex);
  }, excludeWrapCoord);
  return previousValue;
}

/**
 * Callback for propEach
 *
 * @callback propEachCallback
 * @param {Object} currentProperties The current Properties being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 */

/**
 * Iterate over properties in any GeoJSON object, similar to Array.forEach()
 *
 * @name propEach
 * @param {FeatureCollection|Feature} geojson any GeoJSON object
 * @param {Function} callback a method that takes (currentProperties, featureIndex)
 * @returns {void}
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * turf.propEach(features, function (currentProperties, featureIndex) {
 *   //=currentProperties
 *   //=featureIndex
 * });
 */
function propEach(geojson, callback) {
  var i;
  switch (geojson.type) {
    case "FeatureCollection":
      for (i = 0; i < geojson.features.length; i++) {
        if (callback(geojson.features[i].properties, i) === false) break;
      }
      break;
    case "Feature":
      callback(geojson.properties, 0);
      break;
  }
}

/**
 * Callback for propReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback propReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {*} currentProperties The current Properties being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 */

/**
 * Reduce properties in any GeoJSON object into a single value,
 * similar to how Array.reduce works. However, in this case we lazily run
 * the reduction, so an array of all properties is unnecessary.
 *
 * @name propReduce
 * @param {FeatureCollection|Feature} geojson any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentProperties, featureIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * turf.propReduce(features, function (previousValue, currentProperties, featureIndex) {
 *   //=previousValue
 *   //=currentProperties
 *   //=featureIndex
 *   return currentProperties
 * });
 */
function propReduce(geojson, callback, initialValue) {
  var previousValue = initialValue;
  propEach(geojson, function (currentProperties, featureIndex) {
    if (featureIndex === 0 && initialValue === undefined) previousValue = currentProperties;else previousValue = callback(previousValue, currentProperties, featureIndex);
  });
  return previousValue;
}

/**
 * Callback for featureEach
 *
 * @callback featureEachCallback
 * @param {Feature<any>} currentFeature The current Feature being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 */

/**
 * Iterate over features in any GeoJSON object, similar to
 * Array.forEach.
 *
 * @name featureEach
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @param {Function} callback a method that takes (currentFeature, featureIndex)
 * @returns {void}
 * @example
 * var features = turf.featureCollection([
 *   turf.point([26, 37], {foo: 'bar'}),
 *   turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * turf.featureEach(features, function (currentFeature, featureIndex) {
 *   //=currentFeature
 *   //=featureIndex
 * });
 */
function featureEach(geojson, callback) {
  if (geojson.type === "Feature") {
    callback(geojson, 0);
  } else if (geojson.type === "FeatureCollection") {
    for (var i = 0; i < geojson.features.length; i++) {
      if (callback(geojson.features[i], i) === false) break;
    }
  }
}

/**
 * Callback for featureReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback featureReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Feature} currentFeature The current Feature being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 */

/**
 * Reduce features in any GeoJSON object, similar to Array.reduce().
 *
 * @name featureReduce
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentFeature, featureIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = turf.featureCollection([
 *   turf.point([26, 37], {"foo": "bar"}),
 *   turf.point([36, 53], {"hello": "world"})
 * ]);
 *
 * turf.featureReduce(features, function (previousValue, currentFeature, featureIndex) {
 *   //=previousValue
 *   //=currentFeature
 *   //=featureIndex
 *   return currentFeature
 * });
 */
function featureReduce(geojson, callback, initialValue) {
  var previousValue = initialValue;
  featureEach(geojson, function (currentFeature, featureIndex) {
    if (featureIndex === 0 && initialValue === undefined) previousValue = currentFeature;else previousValue = callback(previousValue, currentFeature, featureIndex);
  });
  return previousValue;
}

/**
 * Get all coordinates from any GeoJSON object.
 *
 * @name coordAll
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @returns {Array<Array<number>>} coordinate position array
 * @example
 * var features = turf.featureCollection([
 *   turf.point([26, 37], {foo: 'bar'}),
 *   turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * var coords = turf.coordAll(features);
 * //= [[26, 37], [36, 53]]
 */
function coordAll(geojson) {
  var coords = [];
  coordEach(geojson, function (coord) {
    coords.push(coord);
  });
  return coords;
}

/**
 * Callback for geomEach
 *
 * @callback geomEachCallback
 * @param {Geometry} currentGeometry The current Geometry being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 * @param {Object} featureProperties The current Feature Properties being processed.
 * @param {Array<number>} featureBBox The current Feature BBox being processed.
 * @param {number|string} featureId The current Feature Id being processed.
 */

/**
 * Iterate over each geometry in any GeoJSON object, similar to Array.forEach()
 *
 * @name geomEach
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @param {Function} callback a method that takes (currentGeometry, featureIndex, featureProperties, featureBBox, featureId)
 * @returns {void}
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * turf.geomEach(features, function (currentGeometry, featureIndex, featureProperties, featureBBox, featureId) {
 *   //=currentGeometry
 *   //=featureIndex
 *   //=featureProperties
 *   //=featureBBox
 *   //=featureId
 * });
 */
function geomEach(geojson, callback) {
  var i,
      j,
      g,
      geometry$$1,
      stopG,
      geometryMaybeCollection,
      isGeometryCollection,
      featureProperties,
      featureBBox,
      featureId,
      featureIndex = 0,
      isFeatureCollection = geojson.type === "FeatureCollection",
      isFeature = geojson.type === "Feature",
      stop = isFeatureCollection ? geojson.features.length : 1;

  // This logic may look a little weird. The reason why it is that way
  // is because it's trying to be fast. GeoJSON supports multiple kinds
  // of objects at its root: FeatureCollection, Features, Geometries.
  // This function has the responsibility of handling all of them, and that
  // means that some of the `for` loops you see below actually just don't apply
  // to certain inputs. For instance, if you give this just a
  // Point geometry, then both loops are short-circuited and all we do
  // is gradually rename the input until it's called 'geometry'.
  //
  // This also aims to allocate as few resources as possible: just a
  // few numbers and booleans, rather than any temporary arrays as would
  // be required with the normalization approach.
  for (i = 0; i < stop; i++) {
    geometryMaybeCollection = isFeatureCollection ? geojson.features[i].geometry : isFeature ? geojson.geometry : geojson;
    featureProperties = isFeatureCollection ? geojson.features[i].properties : isFeature ? geojson.properties : {};
    featureBBox = isFeatureCollection ? geojson.features[i].bbox : isFeature ? geojson.bbox : undefined;
    featureId = isFeatureCollection ? geojson.features[i].id : isFeature ? geojson.id : undefined;
    isGeometryCollection = geometryMaybeCollection ? geometryMaybeCollection.type === "GeometryCollection" : false;
    stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

    for (g = 0; g < stopG; g++) {
      geometry$$1 = isGeometryCollection ? geometryMaybeCollection.geometries[g] : geometryMaybeCollection;

      // Handle null Geometry
      if (geometry$$1 === null) {
        if (callback(null, featureIndex, featureProperties, featureBBox, featureId) === false) return false;
        continue;
      }
      switch (geometry$$1.type) {
        case "Point":
        case "LineString":
        case "MultiPoint":
        case "Polygon":
        case "MultiLineString":
        case "MultiPolygon":
          {
            if (callback(geometry$$1, featureIndex, featureProperties, featureBBox, featureId) === false) return false;
            break;
          }
        case "GeometryCollection":
          {
            for (j = 0; j < geometry$$1.geometries.length; j++) {
              if (callback(geometry$$1.geometries[j], featureIndex, featureProperties, featureBBox, featureId) === false) return false;
            }
            break;
          }
        default:
          throw new Error("Unknown Geometry Type");
      }
    }
    // Only increase `featureIndex` per each feature
    featureIndex++;
  }
}

/**
 * Callback for geomReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback geomReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Geometry} currentGeometry The current Geometry being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 * @param {Object} featureProperties The current Feature Properties being processed.
 * @param {Array<number>} featureBBox The current Feature BBox being processed.
 * @param {number|string} featureId The current Feature Id being processed.
 */

/**
 * Reduce geometry in any GeoJSON object, similar to Array.reduce().
 *
 * @name geomReduce
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentGeometry, featureIndex, featureProperties, featureBBox, featureId)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.point([36, 53], {hello: 'world'})
 * ]);
 *
 * turf.geomReduce(features, function (previousValue, currentGeometry, featureIndex, featureProperties, featureBBox, featureId) {
 *   //=previousValue
 *   //=currentGeometry
 *   //=featureIndex
 *   //=featureProperties
 *   //=featureBBox
 *   //=featureId
 *   return currentGeometry
 * });
 */
function geomReduce(geojson, callback, initialValue) {
  var previousValue = initialValue;
  geomEach(geojson, function (currentGeometry, featureIndex, featureProperties, featureBBox, featureId) {
    if (featureIndex === 0 && initialValue === undefined) previousValue = currentGeometry;else previousValue = callback(previousValue, currentGeometry, featureIndex, featureProperties, featureBBox, featureId);
  });
  return previousValue;
}

/**
 * Callback for flattenEach
 *
 * @callback flattenEachCallback
 * @param {Feature} currentFeature The current flattened feature being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
 */

/**
 * Iterate over flattened features in any GeoJSON object, similar to
 * Array.forEach.
 *
 * @name flattenEach
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @param {Function} callback a method that takes (currentFeature, featureIndex, multiFeatureIndex)
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.multiPoint([[40, 30], [36, 53]], {hello: 'world'})
 * ]);
 *
 * turf.flattenEach(features, function (currentFeature, featureIndex, multiFeatureIndex) {
 *   //=currentFeature
 *   //=featureIndex
 *   //=multiFeatureIndex
 * });
 */
function flattenEach(geojson, callback) {
  geomEach(geojson, function (geometry$$1, featureIndex, properties, bbox, id) {
    // Callback for single geometry
    var type = geometry$$1 === null ? null : geometry$$1.type;
    switch (type) {
      case null:
      case "Point":
      case "LineString":
      case "Polygon":
        if (callback(feature(geometry$$1, properties, { bbox: bbox, id: id }), featureIndex, 0) === false) return false;
        return;
    }

    var geomType;

    // Callback for multi-geometry
    switch (type) {
      case "MultiPoint":
        geomType = "Point";
        break;
      case "MultiLineString":
        geomType = "LineString";
        break;
      case "MultiPolygon":
        geomType = "Polygon";
        break;
    }

    for (var multiFeatureIndex = 0; multiFeatureIndex < geometry$$1.coordinates.length; multiFeatureIndex++) {
      var coordinate = geometry$$1.coordinates[multiFeatureIndex];
      var geom = {
        type: geomType,
        coordinates: coordinate
      };
      if (callback(feature(geom, properties), featureIndex, multiFeatureIndex) === false) return false;
    }
  });
}

/**
 * Callback for flattenReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback flattenReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Feature} currentFeature The current Feature being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
 */

/**
 * Reduce flattened features in any GeoJSON object, similar to Array.reduce().
 *
 * @name flattenReduce
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
 * @param {Function} callback a method that takes (previousValue, currentFeature, featureIndex, multiFeatureIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var features = turf.featureCollection([
 *     turf.point([26, 37], {foo: 'bar'}),
 *     turf.multiPoint([[40, 30], [36, 53]], {hello: 'world'})
 * ]);
 *
 * turf.flattenReduce(features, function (previousValue, currentFeature, featureIndex, multiFeatureIndex) {
 *   //=previousValue
 *   //=currentFeature
 *   //=featureIndex
 *   //=multiFeatureIndex
 *   return currentFeature
 * });
 */
function flattenReduce(geojson, callback, initialValue) {
  var previousValue = initialValue;
  flattenEach(geojson, function (currentFeature, featureIndex, multiFeatureIndex) {
    if (featureIndex === 0 && multiFeatureIndex === 0 && initialValue === undefined) previousValue = currentFeature;else previousValue = callback(previousValue, currentFeature, featureIndex, multiFeatureIndex);
  });
  return previousValue;
}

/**
 * Callback for segmentEach
 *
 * @callback segmentEachCallback
 * @param {Feature<LineString>} currentSegment The current Segment being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
 * @param {number} geometryIndex The current index of the Geometry being processed.
 * @param {number} segmentIndex The current index of the Segment being processed.
 * @returns {void}
 */

/**
 * Iterate over 2-vertex line segment in any GeoJSON object, similar to Array.forEach()
 * (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
 *
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON
 * @param {Function} callback a method that takes (currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex)
 * @returns {void}
 * @example
 * var polygon = turf.polygon([[[-50, 5], [-40, -10], [-50, -10], [-40, 5], [-50, 5]]]);
 *
 * // Iterate over GeoJSON by 2-vertex segments
 * turf.segmentEach(polygon, function (currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) {
 *   //=currentSegment
 *   //=featureIndex
 *   //=multiFeatureIndex
 *   //=geometryIndex
 *   //=segmentIndex
 * });
 *
 * // Calculate the total number of segments
 * var total = 0;
 * turf.segmentEach(polygon, function () {
 *     total++;
 * });
 */
function segmentEach(geojson, callback) {
  flattenEach(geojson, function (feature$$1, featureIndex, multiFeatureIndex) {
    var segmentIndex = 0;

    // Exclude null Geometries
    if (!feature$$1.geometry) return;
    // (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
    var type = feature$$1.geometry.type;
    if (type === "Point" || type === "MultiPoint") return;

    // Generate 2-vertex line segments
    var previousCoords;
    var previousFeatureIndex = 0;
    var previousMultiIndex = 0;
    var prevGeomIndex = 0;
    if (coordEach(feature$$1, function (currentCoord, coordIndex, featureIndexCoord, multiPartIndexCoord, geometryIndex) {
      // Simulating a meta.coordReduce() since `reduce` operations cannot be stopped by returning `false`
      if (previousCoords === undefined || featureIndex > previousFeatureIndex || multiPartIndexCoord > previousMultiIndex || geometryIndex > prevGeomIndex) {
        previousCoords = currentCoord;
        previousFeatureIndex = featureIndex;
        previousMultiIndex = multiPartIndexCoord;
        prevGeomIndex = geometryIndex;
        segmentIndex = 0;
        return;
      }
      var currentSegment = lineString([previousCoords, currentCoord], feature$$1.properties);
      if (callback(currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) === false) return false;
      segmentIndex++;
      previousCoords = currentCoord;
    }) === false) return false;
  });
}

/**
 * Callback for segmentReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback segmentReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Feature<LineString>} currentSegment The current Segment being processed.
 * @param {number} featureIndex The current index of the Feature being processed.
 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
 * @param {number} geometryIndex The current index of the Geometry being processed.
 * @param {number} segmentIndex The current index of the Segment being processed.
 */

/**
 * Reduce 2-vertex line segment in any GeoJSON object, similar to Array.reduce()
 * (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
 *
 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON
 * @param {Function} callback a method that takes (previousValue, currentSegment, currentIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {void}
 * @example
 * var polygon = turf.polygon([[[-50, 5], [-40, -10], [-50, -10], [-40, 5], [-50, 5]]]);
 *
 * // Iterate over GeoJSON by 2-vertex segments
 * turf.segmentReduce(polygon, function (previousSegment, currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) {
 *   //= previousSegment
 *   //= currentSegment
 *   //= featureIndex
 *   //= multiFeatureIndex
 *   //= geometryIndex
 *   //= segmentIndex
 *   return currentSegment
 * });
 *
 * // Calculate the total number of segments
 * var initialValue = 0
 * var total = turf.segmentReduce(polygon, function (previousValue) {
 *     previousValue++;
 *     return previousValue;
 * }, initialValue);
 */
function segmentReduce(geojson, callback, initialValue) {
  var previousValue = initialValue;
  var started = false;
  segmentEach(geojson, function (currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) {
    if (started === false && initialValue === undefined) previousValue = currentSegment;else previousValue = callback(previousValue, currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex);
    started = true;
  });
  return previousValue;
}

/**
 * Callback for lineEach
 *
 * @callback lineEachCallback
 * @param {Feature<LineString>} currentLine The current LineString|LinearRing being processed
 * @param {number} featureIndex The current index of the Feature being processed
 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed
 * @param {number} geometryIndex The current index of the Geometry being processed
 */

/**
 * Iterate over line or ring coordinates in LineString, Polygon, MultiLineString, MultiPolygon Features or Geometries,
 * similar to Array.forEach.
 *
 * @name lineEach
 * @param {Geometry|Feature<LineString|Polygon|MultiLineString|MultiPolygon>} geojson object
 * @param {Function} callback a method that takes (currentLine, featureIndex, multiFeatureIndex, geometryIndex)
 * @example
 * var multiLine = turf.multiLineString([
 *   [[26, 37], [35, 45]],
 *   [[36, 53], [38, 50], [41, 55]]
 * ]);
 *
 * turf.lineEach(multiLine, function (currentLine, featureIndex, multiFeatureIndex, geometryIndex) {
 *   //=currentLine
 *   //=featureIndex
 *   //=multiFeatureIndex
 *   //=geometryIndex
 * });
 */
function lineEach(geojson, callback) {
  // validation
  if (!geojson) throw new Error("geojson is required");

  flattenEach(geojson, function (feature$$1, featureIndex, multiFeatureIndex) {
    if (feature$$1.geometry === null) return;
    var type = feature$$1.geometry.type;
    var coords = feature$$1.geometry.coordinates;
    switch (type) {
      case "LineString":
        if (callback(feature$$1, featureIndex, multiFeatureIndex, 0, 0) === false) return false;
        break;
      case "Polygon":
        for (var geometryIndex = 0; geometryIndex < coords.length; geometryIndex++) {
          if (callback(lineString(coords[geometryIndex], feature$$1.properties), featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
        }
        break;
    }
  });
}

/**
 * Callback for lineReduce
 *
 * The first time the callback function is called, the values provided as arguments depend
 * on whether the reduce method has an initialValue argument.
 *
 * If an initialValue is provided to the reduce method:
 *  - The previousValue argument is initialValue.
 *  - The currentValue argument is the value of the first element present in the array.
 *
 * If an initialValue is not provided:
 *  - The previousValue argument is the value of the first element present in the array.
 *  - The currentValue argument is the value of the second element present in the array.
 *
 * @callback lineReduceCallback
 * @param {*} previousValue The accumulated value previously returned in the last invocation
 * of the callback, or initialValue, if supplied.
 * @param {Feature<LineString>} currentLine The current LineString|LinearRing being processed.
 * @param {number} featureIndex The current index of the Feature being processed
 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed
 * @param {number} geometryIndex The current index of the Geometry being processed
 */

/**
 * Reduce features in any GeoJSON object, similar to Array.reduce().
 *
 * @name lineReduce
 * @param {Geometry|Feature<LineString|Polygon|MultiLineString|MultiPolygon>} geojson object
 * @param {Function} callback a method that takes (previousValue, currentLine, featureIndex, multiFeatureIndex, geometryIndex)
 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
 * @returns {*} The value that results from the reduction.
 * @example
 * var multiPoly = turf.multiPolygon([
 *   turf.polygon([[[12,48],[2,41],[24,38],[12,48]], [[9,44],[13,41],[13,45],[9,44]]]),
 *   turf.polygon([[[5, 5], [0, 0], [2, 2], [4, 4], [5, 5]]])
 * ]);
 *
 * turf.lineReduce(multiPoly, function (previousValue, currentLine, featureIndex, multiFeatureIndex, geometryIndex) {
 *   //=previousValue
 *   //=currentLine
 *   //=featureIndex
 *   //=multiFeatureIndex
 *   //=geometryIndex
 *   return currentLine
 * });
 */
function lineReduce(geojson, callback, initialValue) {
  var previousValue = initialValue;
  lineEach(geojson, function (currentLine, featureIndex, multiFeatureIndex, geometryIndex) {
    if (featureIndex === 0 && initialValue === undefined) previousValue = currentLine;else previousValue = callback(previousValue, currentLine, featureIndex, multiFeatureIndex, geometryIndex);
  });
  return previousValue;
}

/**
 * Finds a particular 2-vertex LineString Segment from a GeoJSON using `@turf/meta` indexes.
 *
 * Negative indexes are permitted.
 * Point & MultiPoint will always return null.
 *
 * @param {FeatureCollection|Feature|Geometry} geojson Any GeoJSON Feature or Geometry
 * @param {Object} [options={}] Optional parameters
 * @param {number} [options.featureIndex=0] Feature Index
 * @param {number} [options.multiFeatureIndex=0] Multi-Feature Index
 * @param {number} [options.geometryIndex=0] Geometry Index
 * @param {number} [options.segmentIndex=0] Segment Index
 * @param {Object} [options.properties={}] Translate Properties to output LineString
 * @param {BBox} [options.bbox={}] Translate BBox to output LineString
 * @param {number|string} [options.id={}] Translate Id to output LineString
 * @returns {Feature<LineString>} 2-vertex GeoJSON Feature LineString
 * @example
 * var multiLine = turf.multiLineString([
 *     [[10, 10], [50, 30], [30, 40]],
 *     [[-10, -10], [-50, -30], [-30, -40]]
 * ]);
 *
 * // First Segment (defaults are 0)
 * turf.findSegment(multiLine);
 * // => Feature<LineString<[[10, 10], [50, 30]]>>
 *
 * // First Segment of 2nd Multi Feature
 * turf.findSegment(multiLine, {multiFeatureIndex: 1});
 * // => Feature<LineString<[[-10, -10], [-50, -30]]>>
 *
 * // Last Segment of Last Multi Feature
 * turf.findSegment(multiLine, {multiFeatureIndex: -1, segmentIndex: -1});
 * // => Feature<LineString<[[-50, -30], [-30, -40]]>>
 */
function findSegment(geojson, options) {
  // Optional Parameters
  options = options || {};
  if (!isObject(options)) throw new Error("options is invalid");
  var featureIndex = options.featureIndex || 0;
  var multiFeatureIndex = options.multiFeatureIndex || 0;
  var geometryIndex = options.geometryIndex || 0;
  var segmentIndex = options.segmentIndex || 0;

  // Find FeatureIndex
  var properties = options.properties;
  var geometry$$1;

  switch (geojson.type) {
    case "FeatureCollection":
      if (featureIndex < 0) featureIndex = geojson.features.length + featureIndex;
      properties = properties || geojson.features[featureIndex].properties;
      geometry$$1 = geojson.features[featureIndex].geometry;
      break;
    case "Feature":
      properties = properties || geojson.properties;
      geometry$$1 = geojson.geometry;
      break;
    case "Point":
    case "MultiPoint":
      return null;
    case "LineString":
    case "Polygon":
    case "MultiLineString":
    case "MultiPolygon":
      geometry$$1 = geojson;
      break;
    default:
      throw new Error("geojson is invalid");
  }

  // Find SegmentIndex
  if (geometry$$1 === null) return null;
  var coords = geometry$$1.coordinates;
  switch (geometry$$1.type) {
    case "Point":
    case "MultiPoint":
      return null;
    case "LineString":
      if (segmentIndex < 0) segmentIndex = coords.length + segmentIndex - 1;
      return lineString([coords[segmentIndex], coords[segmentIndex + 1]], properties, options);
    case "Polygon":
      if (geometryIndex < 0) geometryIndex = coords.length + geometryIndex;
      if (segmentIndex < 0) segmentIndex = coords[geometryIndex].length + segmentIndex - 1;
      return lineString([coords[geometryIndex][segmentIndex], coords[geometryIndex][segmentIndex + 1]], properties, options);
    case "MultiLineString":
      if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
      if (segmentIndex < 0) segmentIndex = coords[multiFeatureIndex].length + segmentIndex - 1;
      return lineString([coords[multiFeatureIndex][segmentIndex], coords[multiFeatureIndex][segmentIndex + 1]], properties, options);
    case "MultiPolygon":
      if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
      if (geometryIndex < 0) geometryIndex = coords[multiFeatureIndex].length + geometryIndex;
      if (segmentIndex < 0) segmentIndex = coords[multiFeatureIndex][geometryIndex].length - segmentIndex - 1;
      return lineString([coords[multiFeatureIndex][geometryIndex][segmentIndex], coords[multiFeatureIndex][geometryIndex][segmentIndex + 1]], properties, options);
  }
  throw new Error("geojson is invalid");
}

/**
 * Finds a particular Point from a GeoJSON using `@turf/meta` indexes.
 *
 * Negative indexes are permitted.
 *
 * @param {FeatureCollection|Feature|Geometry} geojson Any GeoJSON Feature or Geometry
 * @param {Object} [options={}] Optional parameters
 * @param {number} [options.featureIndex=0] Feature Index
 * @param {number} [options.multiFeatureIndex=0] Multi-Feature Index
 * @param {number} [options.geometryIndex=0] Geometry Index
 * @param {number} [options.coordIndex=0] Coord Index
 * @param {Object} [options.properties={}] Translate Properties to output Point
 * @param {BBox} [options.bbox={}] Translate BBox to output Point
 * @param {number|string} [options.id={}] Translate Id to output Point
 * @returns {Feature<Point>} 2-vertex GeoJSON Feature Point
 * @example
 * var multiLine = turf.multiLineString([
 *     [[10, 10], [50, 30], [30, 40]],
 *     [[-10, -10], [-50, -30], [-30, -40]]
 * ]);
 *
 * // First Segment (defaults are 0)
 * turf.findPoint(multiLine);
 * // => Feature<Point<[10, 10]>>
 *
 * // First Segment of the 2nd Multi-Feature
 * turf.findPoint(multiLine, {multiFeatureIndex: 1});
 * // => Feature<Point<[-10, -10]>>
 *
 * // Last Segment of last Multi-Feature
 * turf.findPoint(multiLine, {multiFeatureIndex: -1, coordIndex: -1});
 * // => Feature<Point<[-30, -40]>>
 */
function findPoint(geojson, options) {
  // Optional Parameters
  options = options || {};
  if (!isObject(options)) throw new Error("options is invalid");
  var featureIndex = options.featureIndex || 0;
  var multiFeatureIndex = options.multiFeatureIndex || 0;
  var geometryIndex = options.geometryIndex || 0;
  var coordIndex = options.coordIndex || 0;

  // Find FeatureIndex
  var properties = options.properties;
  var geometry$$1;

  switch (geojson.type) {
    case "FeatureCollection":
      if (featureIndex < 0) featureIndex = geojson.features.length + featureIndex;
      properties = properties || geojson.features[featureIndex].properties;
      geometry$$1 = geojson.features[featureIndex].geometry;
      break;
    case "Feature":
      properties = properties || geojson.properties;
      geometry$$1 = geojson.geometry;
      break;
    case "Point":
    case "MultiPoint":
      return null;
    case "LineString":
    case "Polygon":
    case "MultiLineString":
    case "MultiPolygon":
      geometry$$1 = geojson;
      break;
    default:
      throw new Error("geojson is invalid");
  }

  // Find Coord Index
  if (geometry$$1 === null) return null;
  var coords = geometry$$1.coordinates;
  switch (geometry$$1.type) {
    case "Point":
      return point(coords, properties, options);
    case "MultiPoint":
      if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
      return point(coords[multiFeatureIndex], properties, options);
    case "LineString":
      if (coordIndex < 0) coordIndex = coords.length + coordIndex;
      return point(coords[coordIndex], properties, options);
    case "Polygon":
      if (geometryIndex < 0) geometryIndex = coords.length + geometryIndex;
      if (coordIndex < 0) coordIndex = coords[geometryIndex].length + coordIndex;
      return point(coords[geometryIndex][coordIndex], properties, options);
    case "MultiLineString":
      if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
      if (coordIndex < 0) coordIndex = coords[multiFeatureIndex].length + coordIndex;
      return point(coords[multiFeatureIndex][coordIndex], properties, options);
    case "MultiPolygon":
      if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
      if (geometryIndex < 0) geometryIndex = coords[multiFeatureIndex].length + geometryIndex;
      if (coordIndex < 0) coordIndex = coords[multiFeatureIndex][geometryIndex].length - coordIndex;
      return point(coords[multiFeatureIndex][geometryIndex][coordIndex], properties, options);
  }
  throw new Error("geojson is invalid");
}



var es$1 = Object.freeze({
	coordAll: coordAll,
	coordEach: coordEach,
	coordReduce: coordReduce,
	featureEach: featureEach,
	featureReduce: featureReduce,
	findPoint: findPoint,
	findSegment: findSegment,
	flattenEach: flattenEach,
	flattenReduce: flattenReduce,
	geomEach: geomEach,
	geomReduce: geomReduce,
	lineEach: lineEach,
	lineReduce: lineReduce,
	propEach: propEach,
	propReduce: propReduce,
	segmentEach: segmentEach,
	segmentReduce: segmentReduce
});

/**
 * Combines a {@link FeatureCollection} of {@link Point}, {@link LineString}, or {@link Polygon} features
 * into {@link MultiPoint}, {@link MultiLineString}, or {@link MultiPolygon} features.
 *
 * @name combine
 * @param {FeatureCollection<Point|LineString|Polygon>} fc a FeatureCollection of any type
 * @returns {FeatureCollection<MultiPoint|MultiLineString|MultiPolygon>} a FeatureCollection of corresponding type to input
 * @example
 * var fc = turf.featureCollection([
 *   turf.point([19.026432, 47.49134]),
 *   turf.point([19.074497, 47.509548])
 * ]);
 *
 * var combined = turf.combine(fc);
 *
 * //addToMap
 * var addToMap = [combined]
 */
function combine(fc) {
    var groups = {
        MultiPoint: {
            coordinates: [],
            properties: []
        },
        MultiLineString: {
            coordinates: [],
            properties: []
        },
        MultiPolygon: {
            coordinates: [],
            properties: []
        }
    };
    featureEach(fc, function (feature$$1) {
        var _a, _b, _c;
        var _d;
        switch ((_d = feature$$1.geometry) === null || _d === void 0 ? void 0 : _d.type) {
            case "Point":
                groups.MultiPoint.coordinates.push(feature$$1.geometry.coordinates);
                groups.MultiPoint.properties.push(feature$$1.properties);
                break;
            case "MultiPoint":
                (_a = groups.MultiPoint.coordinates).push.apply(_a, feature$$1.geometry.coordinates);
                groups.MultiPoint.properties.push(feature$$1.properties);
                break;
            case "LineString":
                groups.MultiLineString.coordinates.push(feature$$1.geometry.coordinates);
                groups.MultiLineString.properties.push(feature$$1.properties);
                break;
            case "MultiLineString":
                (_b = groups.MultiLineString.coordinates).push.apply(_b, feature$$1.geometry.coordinates);
                groups.MultiLineString.properties.push(feature$$1.properties);
                break;
            case "Polygon":
                groups.MultiPolygon.coordinates.push(feature$$1.geometry.coordinates);
                groups.MultiPolygon.properties.push(feature$$1.properties);
                break;
            case "MultiPolygon":
                (_c = groups.MultiPolygon.coordinates).push.apply(_c, feature$$1.geometry.coordinates);
                groups.MultiPolygon.properties.push(feature$$1.properties);
                break;
            default:
                break;
        }
    });
    return featureCollection(Object.keys(groups).filter(function (key) {
        return groups[key].coordinates.length;
    }).sort().map(function (key) {
        var geometry$$1 = { type: key, coordinates: groups[key].coordinates };
        var properties = { collectedProperties: groups[key].properties };
        return feature(geometry$$1, properties);
    }));
}

/**
 * Takes a feature or set of features and returns all positions as {@link Point|points}.
 *
 * @name explode
 * @param {GeoJSON} geojson input features
 * @returns {FeatureCollection<point>} points representing the exploded input features
 * @throws {Error} if it encounters an unknown geometry type
 * @example
 * var polygon = turf.polygon([[[-81, 41], [-88, 36], [-84, 31], [-80, 33], [-77, 39], [-81, 41]]]);
 *
 * var explode = turf.explode(polygon);
 *
 * //addToMap
 * var addToMap = [polygon, explode]
 */
function explode(geojson) {
  var points$$1 = [];
  if (geojson.type === "FeatureCollection") {
    featureEach(geojson, function (feature$$1) {
      coordEach(feature$$1, function (coord) {
        points$$1.push(point(coord, feature$$1.properties));
      });
    });
  } else {
    coordEach(geojson, function (coord) {
      points$$1.push(point(coord, geojson.properties));
    });
  }
  return featureCollection(points$$1);
}

/**
 * Flattens any {@link GeoJSON} to a {@link FeatureCollection} inspired by [geojson-flatten](https://github.com/tmcw/geojson-flatten).
 *
 * @name flatten
 * @param {GeoJSON} geojson any valid GeoJSON Object
 * @returns {FeatureCollection<any>} all Multi-Geometries are flattened into single Features
 * @example
 * var multiGeometry = turf.multiPolygon([
 *   [[[102.0, 2.0], [103.0, 2.0], [103.0, 3.0], [102.0, 3.0], [102.0, 2.0]]],
 *   [[[100.0, 0.0], [101.0, 0.0], [101.0, 1.0], [100.0, 1.0], [100.0, 0.0]],
 *   [[100.2, 0.2], [100.8, 0.2], [100.8, 0.8], [100.2, 0.8], [100.2, 0.2]]]
 * ]);
 *
 * var flatten = turf.flatten(multiGeometry);
 *
 * //addToMap
 * var addToMap = [flatten]
 */
function flatten(geojson) {
  if (!geojson) throw new Error("geojson is required");

  var results = [];
  flattenEach(geojson, function (feature$$1) {
    results.push(feature$$1);
  });
  return featureCollection(results);
}

var _typeof$1 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Returns a cloned copy of the passed GeoJSON Object, including possible 'Foreign Members'.
 * ~3-5x faster than the common JSON.parse + JSON.stringify combo method.
 *
 * @name clone
 * @param {GeoJSON} geojson GeoJSON Object
 * @returns {GeoJSON} cloned GeoJSON Object
 * @example
 * var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]], {color: 'red'});
 *
 * var lineCloned = turf.clone(line);
 */
function clone(geojson) {
    if (!geojson) {
        throw new Error("geojson is required");
    }
    switch (geojson.type) {
        case "Feature":
            return cloneFeature(geojson);
        case "FeatureCollection":
            return cloneFeatureCollection(geojson);
        case "Point":
        case "LineString":
        case "Polygon":
        case "MultiPoint":
        case "MultiLineString":
        case "MultiPolygon":
        case "GeometryCollection":
            return cloneGeometry(geojson);
        default:
            throw new Error("unknown GeoJSON type");
    }
}
/**
 * Clone Feature
 *
 * @private
 * @param {Feature<any>} geojson GeoJSON Feature
 * @returns {Feature<any>} cloned Feature
 */
function cloneFeature(geojson) {
    var cloned = { type: "Feature" };
    // Preserve Foreign Members
    Object.keys(geojson).forEach(function (key) {
        switch (key) {
            case "type":
            case "properties":
            case "geometry":
                return;
            default:
                cloned[key] = geojson[key];
        }
    });
    // Add properties & geometry last
    cloned.properties = cloneProperties(geojson.properties);
    cloned.geometry = cloneGeometry(geojson.geometry);
    return cloned;
}
/**
 * Clone Properties
 *
 * @private
 * @param {Object} properties GeoJSON Properties
 * @returns {Object} cloned Properties
 */
function cloneProperties(properties) {
    var cloned = {};
    if (!properties) {
        return cloned;
    }
    Object.keys(properties).forEach(function (key) {
        var value = properties[key];
        if ((typeof value === "undefined" ? "undefined" : _typeof$1(value)) === "object") {
            if (value === null) {
                // handle null
                cloned[key] = null;
            } else if (Array.isArray(value)) {
                // handle Array
                cloned[key] = value.map(function (item) {
                    return item;
                });
            } else {
                // handle generic Object
                cloned[key] = cloneProperties(value);
            }
        } else {
            cloned[key] = value;
        }
    });
    return cloned;
}
/**
 * Clone Feature Collection
 *
 * @private
 * @param {FeatureCollection<any>} geojson GeoJSON Feature Collection
 * @returns {FeatureCollection<any>} cloned Feature Collection
 */
function cloneFeatureCollection(geojson) {
    var cloned = { type: "FeatureCollection" };
    // Preserve Foreign Members
    Object.keys(geojson).forEach(function (key) {
        switch (key) {
            case "type":
            case "features":
                return;
            default:
                cloned[key] = geojson[key];
        }
    });
    // Add features
    cloned.features = geojson.features.map(function (feature) {
        return cloneFeature(feature);
    });
    return cloned;
}
/**
 * Clone Geometry
 *
 * @private
 * @param {Geometry<any>} geometry GeoJSON Geometry
 * @returns {Geometry<any>} cloned Geometry
 */
function cloneGeometry(geometry) {
    var geom = { type: geometry.type };
    if (geometry.bbox) {
        geom.bbox = geometry.bbox;
    }
    if (geometry.type === "GeometryCollection") {
        geom.geometries = geometry.geometries.map(function (g) {
            return cloneGeometry(g);
        });
        return geom;
    }
    geom.coordinates = deepSlice(geometry.coordinates);
    return geom;
}
/**
 * Deep Slice coordinates
 *
 * @private
 * @param {Coordinates} coords Coordinates
 * @returns {Coordinates} all coordinates sliced
 */
function deepSlice(coords) {
    var cloned = coords;
    if (_typeof$1(cloned[0]) !== "object") {
        return cloned.slice();
    }
    return cloned.map(function (coord) {
        return deepSlice(coord);
    });
}

/**
 * Unwrap a coordinate from a Point Feature, Geometry or a single coordinate.
 *
 * @name getCoord
 * @param {Array<number>|Geometry<Point>|Feature<Point>} coord GeoJSON Point or an Array of numbers
 * @returns {Array<number>} coordinates
 * @example
 * var pt = turf.point([10, 10]);
 *
 * var coord = turf.getCoord(pt);
 * //= [10, 10]
 */
function getCoord(coord) {
    if (!coord) {
        throw new Error("coord is required");
    }
    if (!Array.isArray(coord)) {
        if (coord.type === "Feature" && coord.geometry !== null && coord.geometry.type === "Point") {
            return coord.geometry.coordinates;
        }
        if (coord.type === "Point") {
            return coord.coordinates;
        }
    }
    if (Array.isArray(coord) && coord.length >= 2 && !Array.isArray(coord[0]) && !Array.isArray(coord[1])) {
        return coord;
    }
    throw new Error("coord must be GeoJSON Point or an Array of numbers");
}
/**
 * Unwrap coordinates from a Feature, Geometry Object or an Array
 *
 * @name getCoords
 * @param {Array<any>|Geometry|Feature} coords Feature, Geometry Object or an Array
 * @returns {Array<any>} coordinates
 * @example
 * var poly = turf.polygon([[[119.32, -8.7], [119.55, -8.69], [119.51, -8.54], [119.32, -8.7]]]);
 *
 * var coords = turf.getCoords(poly);
 * //= [[[119.32, -8.7], [119.55, -8.69], [119.51, -8.54], [119.32, -8.7]]]
 */
function getCoords(coords) {
    if (Array.isArray(coords)) {
        return coords;
    }
    // Feature
    if (coords.type === "Feature") {
        if (coords.geometry !== null) {
            return coords.geometry.coordinates;
        }
    } else {
        // Geometry
        if (coords.coordinates) {
            return coords.coordinates;
        }
    }
    throw new Error("coords must be GeoJSON Feature, Geometry Object or an Array");
}
/**
 * Checks if coordinates contains a number
 *
 * @name containsNumber
 * @param {Array<any>} coordinates GeoJSON Coordinates
 * @returns {boolean} true if Array contains a number
 */

/**
 * Enforce expectations about types of GeoJSON objects for Turf.
 *
 * @name geojsonType
 * @param {GeoJSON} value any GeoJSON object
 * @param {string} type expected GeoJSON type
 * @param {string} name name of calling function
 * @throws {Error} if value is not the expected type.
 */

/**
 * Enforce expectations about types of {@link Feature} inputs for Turf.
 * Internally this uses {@link geojsonType} to judge geometry types.
 *
 * @name featureOf
 * @param {Feature} feature a feature with an expected geometry type
 * @param {string} type expected GeoJSON type
 * @param {string} name name of calling function
 * @throws {Error} error if value is not the expected type.
 */

/**
 * Enforce expectations about types of {@link FeatureCollection} inputs for Turf.
 * Internally this uses {@link geojsonType} to judge geometry types.
 *
 * @name collectionOf
 * @param {FeatureCollection} featureCollection a FeatureCollection for which features will be judged
 * @param {string} type expected GeoJSON type
 * @param {string} name name of calling function
 * @throws {Error} if value is not the expected type.
 */

/**
 * Get Geometry from Feature or Geometry Object
 *
 * @param {Feature|Geometry} geojson GeoJSON Feature or Geometry Object
 * @returns {Geometry|null} GeoJSON Geometry Object
 * @throws {Error} if geojson is not a Feature or Geometry Object
 * @example
 * var point = {
 *   "type": "Feature",
 *   "properties": {},
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [110, 40]
 *   }
 * }
 * var geom = turf.getGeom(point)
 * //={"type": "Point", "coordinates": [110, 40]}
 */
function getGeom(geojson) {
    if (geojson.type === "Feature") {
        return geojson.geometry;
    }
    return geojson;
}
/**
 * Get GeoJSON object's type, Geometry type is prioritize.
 *
 * @param {GeoJSON} geojson GeoJSON object
 * @param {string} [name="geojson"] name of the variable to display in error message (unused)
 * @returns {string} GeoJSON type
 * @example
 * var point = {
 *   "type": "Feature",
 *   "properties": {},
 *   "geometry": {
 *     "type": "Point",
 *     "coordinates": [110, 40]
 *   }
 * }
 * var geom = turf.getType(point)
 * //="Point"
 */

//http://en.wikipedia.org/wiki/Haversine_formula
//http://www.movable-type.co.uk/scripts/latlong.html
/**
 * Calculates the distance between two {@link Point|points} in degrees, radians, miles, or kilometers.
 * This uses the [Haversine formula](http://en.wikipedia.org/wiki/Haversine_formula) to account for global curvature.
 *
 * @name distance
 * @param {Coord | Point} from origin point or coordinate
 * @param {Coord | Point} to destination point or coordinate
 * @param {Object} [options={}] Optional parameters
 * @param {string} [options.units='kilometers'] can be degrees, radians, miles, or kilometers
 * @returns {number} distance between the two points
 * @example
 * var from = turf.point([-75.343, 39.984]);
 * var to = turf.point([-75.534, 39.123]);
 * var options = {units: 'miles'};
 *
 * var distance = turf.distance(from, to, options);
 *
 * //addToMap
 * var addToMap = [from, to];
 * from.properties.distance = distance;
 * to.properties.distance = distance;
 */
function distance(from, to, options) {
    if (options === void 0) {
        options = {};
    }
    var coordinates1 = getCoord(from);
    var coordinates2 = getCoord(to);
    var dLat = degreesToRadians(coordinates2[1] - coordinates1[1]);
    var dLon = degreesToRadians(coordinates2[0] - coordinates1[0]);
    var lat1 = degreesToRadians(coordinates1[1]);
    var lat2 = degreesToRadians(coordinates2[1]);
    var a = Math.pow(Math.sin(dLat / 2), 2) + Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
    return radiansToLength(2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)), options.units);
}

/**
 * Takes a reference {@link Point|point} and a FeatureCollection of Features
 * with Point geometries and returns the
 * point from the FeatureCollection closest to the reference. This calculation
 * is geodesic.
 *
 * @name nearestPoint
 * @param {Coord} targetPoint the reference point
 * @param {FeatureCollection<Point>} points against input point set
 * @returns {Feature<Point>} the closest point in the set to the reference point
 * @example
 * var targetPoint = turf.point([28.965797, 41.010086], {"marker-color": "#0F0"});
 * var points = turf.featureCollection([
 *     turf.point([28.973865, 41.011122]),
 *     turf.point([28.948459, 41.024204]),
 *     turf.point([28.938674, 41.013324])
 * ]);
 *
 * var nearest = turf.nearestPoint(targetPoint, points);
 *
 * //addToMap
 * var addToMap = [targetPoint, points, nearest];
 * nearest.properties['marker-color'] = '#F00';
 */
function nearestPoint(targetPoint, points) {
    // Input validation
    if (!targetPoint) throw new Error("targetPoint is required");
    if (!points) throw new Error("points is required");
    var nearest;
    var minDist = Infinity;
    var bestFeatureIndex = 0;
    featureEach(points, function (pt, featureIndex) {
        var distanceToPoint = distance(targetPoint, pt);
        if (distanceToPoint < minDist) {
            bestFeatureIndex = featureIndex;
            minDist = distanceToPoint;
        }
    });
    nearest = clone(points.features[bestFeatureIndex]);
    nearest.properties.featureIndex = bestFeatureIndex;
    nearest.properties.distanceToPoint = minDist;
    return nearest;
}

// http://en.wikipedia.org/wiki/Haversine_formula
// http://www.movable-type.co.uk/scripts/latlong.html
/**
 * Takes two {@link Point|points} and finds the geographic bearing between them,
 * i.e. the angle measured in degrees from the north line (0 degrees)
 *
 * @name bearing
 * @param {Coord} start starting Point
 * @param {Coord} end ending Point
 * @param {Object} [options={}] Optional parameters
 * @param {boolean} [options.final=false] calculates the final bearing if true
 * @returns {number} bearing in decimal degrees, between -180 and 180 degrees (positive clockwise)
 * @example
 * var point1 = turf.point([-75.343, 39.984]);
 * var point2 = turf.point([-75.534, 39.123]);
 *
 * var bearing = turf.bearing(point1, point2);
 *
 * //addToMap
 * var addToMap = [point1, point2]
 * point1.properties['marker-color'] = '#f00'
 * point2.properties['marker-color'] = '#0f0'
 * point1.properties.bearing = bearing
 */
function bearing(start, end, options) {
    if (options === void 0) {
        options = {};
    }
    // Reverse calculation
    if (options.final === true) {
        return calculateFinalBearing(start, end);
    }
    var coordinates1 = getCoord(start);
    var coordinates2 = getCoord(end);
    var lon1 = degreesToRadians(coordinates1[0]);
    var lon2 = degreesToRadians(coordinates2[0]);
    var lat1 = degreesToRadians(coordinates1[1]);
    var lat2 = degreesToRadians(coordinates2[1]);
    var a = Math.sin(lon2 - lon1) * Math.cos(lat2);
    var b = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    return radiansToDegrees(Math.atan2(a, b));
}
/**
 * Calculates Final Bearing
 *
 * @private
 * @param {Coord} start starting Point
 * @param {Coord} end ending Point
 * @returns {number} bearing
 */
function calculateFinalBearing(start, end) {
    // Swap start & end
    var bear = bearing(end, start);
    bear = (bear + 180) % 360;
    return bear;
}

// http://en.wikipedia.org/wiki/Haversine_formula
// http://www.movable-type.co.uk/scripts/latlong.html
/**
 * Takes a {@link Point} and calculates the location of a destination point given a distance in
 * degrees, radians, miles, or kilometers; and bearing in degrees.
 * This uses the [Haversine formula](http://en.wikipedia.org/wiki/Haversine_formula) to account for global curvature.
 *
 * @name destination
 * @param {Coord} origin starting point
 * @param {number} distance distance from the origin point
 * @param {number} bearing ranging from -180 to 180
 * @param {Object} [options={}] Optional parameters
 * @param {string} [options.units='kilometers'] miles, kilometers, degrees, or radians
 * @param {Object} [options.properties={}] Translate properties to Point
 * @returns {Feature<Point>} destination point
 * @example
 * var point = turf.point([-75.343, 39.984]);
 * var distance = 50;
 * var bearing = 90;
 * var options = {units: 'miles'};
 *
 * var destination = turf.destination(point, distance, bearing, options);
 *
 * //addToMap
 * var addToMap = [point, destination]
 * destination.properties['marker-color'] = '#f00';
 * point.properties['marker-color'] = '#0f0';
 */
function destination(origin, distance, bearing, options) {
    if (options === void 0) {
        options = {};
    }
    // Handle input
    var coordinates1 = getCoord(origin);
    var longitude1 = degreesToRadians(coordinates1[0]);
    var latitude1 = degreesToRadians(coordinates1[1]);
    var bearingRad = degreesToRadians(bearing);
    var radians = lengthToRadians(distance, options.units);
    // Main
    var latitude2 = Math.asin(Math.sin(latitude1) * Math.cos(radians) + Math.cos(latitude1) * Math.sin(radians) * Math.cos(bearingRad));
    var longitude2 = longitude1 + Math.atan2(Math.sin(bearingRad) * Math.sin(radians) * Math.cos(latitude1), Math.cos(radians) - Math.sin(latitude1) * Math.sin(latitude2));
    var lng = radiansToDegrees(longitude2);
    var lat = radiansToDegrees(latitude2);
    return point([lng, lat], options.properties);
}

/**
 * Creates a {@link FeatureCollection} of 2-vertex {@link LineString} segments from a
 * {@link LineString|(Multi)LineString} or {@link Polygon|(Multi)Polygon}.
 *
 * @name lineSegment
 * @param {GeoJSON} geojson GeoJSON Polygon or LineString
 * @returns {FeatureCollection<LineString>} 2-vertex line segments
 * @example
 * var polygon = turf.polygon([[[-50, 5], [-40, -10], [-50, -10], [-40, 5], [-50, 5]]]);
 * var segments = turf.lineSegment(polygon);
 *
 * //addToMap
 * var addToMap = [polygon, segments]
 */
function lineSegment(geojson) {
    if (!geojson) {
        throw new Error("geojson is required");
    }
    var results = [];
    flattenEach(geojson, function (feature$$1) {
        lineSegmentFeature(feature$$1, results);
    });
    return featureCollection(results);
}
/**
 * Line Segment
 *
 * @private
 * @param {Feature<LineString|Polygon>} geojson Line or polygon feature
 * @param {Array} results push to results
 * @returns {void}
 */
function lineSegmentFeature(geojson, results) {
    var coords = [];
    var geometry$$1 = geojson.geometry;
    if (geometry$$1 !== null) {
        switch (geometry$$1.type) {
            case "Polygon":
                coords = getCoords(geometry$$1);
                break;
            case "LineString":
                coords = [getCoords(geometry$$1)];
        }
        coords.forEach(function (coord) {
            var segments = createSegments(coord, geojson.properties);
            segments.forEach(function (segment) {
                segment.id = results.length;
                results.push(segment);
            });
        });
    }
}
/**
 * Create Segments from LineString coordinates
 *
 * @private
 * @param {Array<Array<number>>} coords LineString coordinates
 * @param {*} properties GeoJSON properties
 * @returns {Array<Feature<LineString>>} line segments
 */
function createSegments(coords, properties) {
    var segments = [];
    coords.reduce(function (previousCoords, currentCoords) {
        var segment = lineString([previousCoords, currentCoords], properties);
        segment.bbox = bbox(previousCoords, currentCoords);
        segments.push(segment);
        return currentCoords;
    });
    return segments;
}
/**
 * Create BBox between two coordinates (faster than @turf/bbox)
 *
 * @private
 * @param {Array<number>} coords1 Point coordinate
 * @param {Array<number>} coords2 Point coordinate
 * @returns {BBox} [west, south, east, north]
 */
function bbox(coords1, coords2) {
    var x1 = coords1[0];
    var y1 = coords1[1];
    var x2 = coords2[0];
    var y2 = coords2[1];
    var west = x1 < x2 ? x1 : x2;
    var south = y1 < y2 ? y1 : y2;
    var east = x1 > x2 ? x1 : x2;
    var north = y1 > y2 ? y1 : y2;
    return [west, south, east, north];
}

function quickselect(arr, k, left, right, compare) {
    quickselectStep(arr, k, left || 0, right || arr.length - 1, compare || defaultCompare);
}

function quickselectStep(arr, k, left, right, compare) {

    while (right > left) {
        if (right - left > 600) {
            var n = right - left + 1;
            var m = k - left + 1;
            var z = Math.log(n);
            var s = 0.5 * Math.exp(2 * z / 3);
            var sd = 0.5 * Math.sqrt(z * s * (n - s) / n) * (m - n / 2 < 0 ? -1 : 1);
            var newLeft = Math.max(left, Math.floor(k - m * s / n + sd));
            var newRight = Math.min(right, Math.floor(k + (n - m) * s / n + sd));
            quickselectStep(arr, k, newLeft, newRight, compare);
        }

        var t = arr[k];
        var i = left;
        var j = right;

        swap(arr, left, k);
        if (compare(arr[right], t) > 0) swap(arr, left, right);

        while (i < j) {
            swap(arr, i, j);
            i++;
            j--;
            while (compare(arr[i], t) < 0) {
                i++;
            }while (compare(arr[j], t) > 0) {
                j--;
            }
        }

        if (compare(arr[left], t) === 0) swap(arr, left, j);else {
            j++;
            swap(arr, j, right);
        }

        if (j <= k) left = j + 1;
        if (k <= j) right = j - 1;
    }
}

function swap(arr, i, j) {
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
}

function defaultCompare(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}

function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RBush = function () {
    function RBush() {
        var maxEntries = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 9;

        _classCallCheck$1(this, RBush);

        // max entries in a node is 9 by default; min node fill is 40% for best performance
        this._maxEntries = Math.max(4, maxEntries);
        this._minEntries = Math.max(2, Math.ceil(this._maxEntries * 0.4));
        this.clear();
    }

    RBush.prototype.all = function all() {
        return this._all(this.data, []);
    };

    RBush.prototype.search = function search(bbox) {
        var node = this.data;
        var result = [];

        if (!intersects$1(bbox, node)) return result;

        var toBBox = this.toBBox;
        var nodesToSearch = [];

        while (node) {
            for (var i = 0; i < node.children.length; i++) {
                var child = node.children[i];
                var childBBox = node.leaf ? toBBox(child) : child;

                if (intersects$1(bbox, childBBox)) {
                    if (node.leaf) result.push(child);else if (contains(bbox, childBBox)) this._all(child, result);else nodesToSearch.push(child);
                }
            }
            node = nodesToSearch.pop();
        }

        return result;
    };

    RBush.prototype.collides = function collides(bbox) {
        var node = this.data;

        if (!intersects$1(bbox, node)) return false;

        var nodesToSearch = [];
        while (node) {
            for (var i = 0; i < node.children.length; i++) {
                var child = node.children[i];
                var childBBox = node.leaf ? this.toBBox(child) : child;

                if (intersects$1(bbox, childBBox)) {
                    if (node.leaf || contains(bbox, childBBox)) return true;
                    nodesToSearch.push(child);
                }
            }
            node = nodesToSearch.pop();
        }

        return false;
    };

    RBush.prototype.load = function load(data) {
        if (!(data && data.length)) return this;

        if (data.length < this._minEntries) {
            for (var i = 0; i < data.length; i++) {
                this.insert(data[i]);
            }
            return this;
        }

        // recursively build the tree with the given data from scratch using OMT algorithm
        var node = this._build(data.slice(), 0, data.length - 1, 0);

        if (!this.data.children.length) {
            // save as is if tree is empty
            this.data = node;
        } else if (this.data.height === node.height) {
            // split root if trees have the same height
            this._splitRoot(this.data, node);
        } else {
            if (this.data.height < node.height) {
                // swap trees if inserted one is bigger
                var tmpNode = this.data;
                this.data = node;
                node = tmpNode;
            }

            // insert the small tree into the large tree at appropriate level
            this._insert(node, this.data.height - node.height - 1, true);
        }

        return this;
    };

    RBush.prototype.insert = function insert(item) {
        if (item) this._insert(item, this.data.height - 1);
        return this;
    };

    RBush.prototype.clear = function clear() {
        this.data = createNode([]);
        return this;
    };

    RBush.prototype.remove = function remove(item, equalsFn) {
        if (!item) return this;

        var node = this.data;
        var bbox = this.toBBox(item);
        var path = [];
        var indexes = [];
        var i = void 0,
            parent = void 0,
            goingUp = void 0;

        // depth-first iterative tree traversal
        while (node || path.length) {

            if (!node) {
                // go up
                node = path.pop();
                parent = path[path.length - 1];
                i = indexes.pop();
                goingUp = true;
            }

            if (node.leaf) {
                // check current node
                var index = findItem(item, node.children, equalsFn);

                if (index !== -1) {
                    // item found, remove the item and condense tree upwards
                    node.children.splice(index, 1);
                    path.push(node);
                    this._condense(path);
                    return this;
                }
            }

            if (!goingUp && !node.leaf && contains(node, bbox)) {
                // go down
                path.push(node);
                indexes.push(i);
                i = 0;
                parent = node;
                node = node.children[0];
            } else if (parent) {
                // go right
                i++;
                node = parent.children[i];
                goingUp = false;
            } else node = null; // nothing found
        }

        return this;
    };

    RBush.prototype.toBBox = function toBBox(item) {
        return item;
    };

    RBush.prototype.compareMinX = function compareMinX(a, b) {
        return a.minX - b.minX;
    };

    RBush.prototype.compareMinY = function compareMinY(a, b) {
        return a.minY - b.minY;
    };

    RBush.prototype.toJSON = function toJSON() {
        return this.data;
    };

    RBush.prototype.fromJSON = function fromJSON(data) {
        this.data = data;
        return this;
    };

    RBush.prototype._all = function _all(node, result) {
        var nodesToSearch = [];
        while (node) {
            if (node.leaf) result.push.apply(result, node.children);else nodesToSearch.push.apply(nodesToSearch, node.children);

            node = nodesToSearch.pop();
        }
        return result;
    };

    RBush.prototype._build = function _build(items, left, right, height) {

        var N = right - left + 1;
        var M = this._maxEntries;
        var node = void 0;

        if (N <= M) {
            // reached leaf level; return leaf
            node = createNode(items.slice(left, right + 1));
            calcBBox(node, this.toBBox);
            return node;
        }

        if (!height) {
            // target height of the bulk-loaded tree
            height = Math.ceil(Math.log(N) / Math.log(M));

            // target number of root entries to maximize storage utilization
            M = Math.ceil(N / Math.pow(M, height - 1));
        }

        node = createNode([]);
        node.leaf = false;
        node.height = height;

        // split the items into M mostly square tiles

        var N2 = Math.ceil(N / M);
        var N1 = N2 * Math.ceil(Math.sqrt(M));

        multiSelect(items, left, right, N1, this.compareMinX);

        for (var i = left; i <= right; i += N1) {

            var right2 = Math.min(i + N1 - 1, right);

            multiSelect(items, i, right2, N2, this.compareMinY);

            for (var j = i; j <= right2; j += N2) {

                var right3 = Math.min(j + N2 - 1, right2);

                // pack each entry recursively
                node.children.push(this._build(items, j, right3, height - 1));
            }
        }

        calcBBox(node, this.toBBox);

        return node;
    };

    RBush.prototype._chooseSubtree = function _chooseSubtree(bbox, node, level, path) {
        while (true) {
            path.push(node);

            if (node.leaf || path.length - 1 === level) break;

            var minArea = Infinity;
            var minEnlargement = Infinity;
            var targetNode = void 0;

            for (var i = 0; i < node.children.length; i++) {
                var child = node.children[i];
                var area = bboxArea(child);
                var enlargement = enlargedArea(bbox, child) - area;

                // choose entry with the least area enlargement
                if (enlargement < minEnlargement) {
                    minEnlargement = enlargement;
                    minArea = area < minArea ? area : minArea;
                    targetNode = child;
                } else if (enlargement === minEnlargement) {
                    // otherwise choose one with the smallest area
                    if (area < minArea) {
                        minArea = area;
                        targetNode = child;
                    }
                }
            }

            node = targetNode || node.children[0];
        }

        return node;
    };

    RBush.prototype._insert = function _insert(item, level, isNode) {
        var bbox = isNode ? item : this.toBBox(item);
        var insertPath = [];

        // find the best node for accommodating the item, saving all nodes along the path too
        var node = this._chooseSubtree(bbox, this.data, level, insertPath);

        // put the item into the node
        node.children.push(item);
        extend(node, bbox);

        // split on node overflow; propagate upwards if necessary
        while (level >= 0) {
            if (insertPath[level].children.length > this._maxEntries) {
                this._split(insertPath, level);
                level--;
            } else break;
        }

        // adjust bboxes along the insertion path
        this._adjustParentBBoxes(bbox, insertPath, level);
    };

    // split overflowed node into two


    RBush.prototype._split = function _split(insertPath, level) {
        var node = insertPath[level];
        var M = node.children.length;
        var m = this._minEntries;

        this._chooseSplitAxis(node, m, M);

        var splitIndex = this._chooseSplitIndex(node, m, M);

        var newNode = createNode(node.children.splice(splitIndex, node.children.length - splitIndex));
        newNode.height = node.height;
        newNode.leaf = node.leaf;

        calcBBox(node, this.toBBox);
        calcBBox(newNode, this.toBBox);

        if (level) insertPath[level - 1].children.push(newNode);else this._splitRoot(node, newNode);
    };

    RBush.prototype._splitRoot = function _splitRoot(node, newNode) {
        // split root node
        this.data = createNode([node, newNode]);
        this.data.height = node.height + 1;
        this.data.leaf = false;
        calcBBox(this.data, this.toBBox);
    };

    RBush.prototype._chooseSplitIndex = function _chooseSplitIndex(node, m, M) {
        var index = void 0;
        var minOverlap = Infinity;
        var minArea = Infinity;

        for (var i = m; i <= M - m; i++) {
            var bbox1 = distBBox(node, 0, i, this.toBBox);
            var bbox2 = distBBox(node, i, M, this.toBBox);

            var overlap = intersectionArea(bbox1, bbox2);
            var area = bboxArea(bbox1) + bboxArea(bbox2);

            // choose distribution with minimum overlap
            if (overlap < minOverlap) {
                minOverlap = overlap;
                index = i;

                minArea = area < minArea ? area : minArea;
            } else if (overlap === minOverlap) {
                // otherwise choose distribution with minimum area
                if (area < minArea) {
                    minArea = area;
                    index = i;
                }
            }
        }

        return index || M - m;
    };

    // sorts node children by the best axis for split


    RBush.prototype._chooseSplitAxis = function _chooseSplitAxis(node, m, M) {
        var compareMinX = node.leaf ? this.compareMinX : compareNodeMinX;
        var compareMinY = node.leaf ? this.compareMinY : compareNodeMinY;
        var xMargin = this._allDistMargin(node, m, M, compareMinX);
        var yMargin = this._allDistMargin(node, m, M, compareMinY);

        // if total distributions margin value is minimal for x, sort by minX,
        // otherwise it's already sorted by minY
        if (xMargin < yMargin) node.children.sort(compareMinX);
    };

    // total margin of all possible split distributions where each node is at least m full


    RBush.prototype._allDistMargin = function _allDistMargin(node, m, M, compare) {
        node.children.sort(compare);

        var toBBox = this.toBBox;
        var leftBBox = distBBox(node, 0, m, toBBox);
        var rightBBox = distBBox(node, M - m, M, toBBox);
        var margin = bboxMargin(leftBBox) + bboxMargin(rightBBox);

        for (var i = m; i < M - m; i++) {
            var child = node.children[i];
            extend(leftBBox, node.leaf ? toBBox(child) : child);
            margin += bboxMargin(leftBBox);
        }

        for (var _i = M - m - 1; _i >= m; _i--) {
            var _child = node.children[_i];
            extend(rightBBox, node.leaf ? toBBox(_child) : _child);
            margin += bboxMargin(rightBBox);
        }

        return margin;
    };

    RBush.prototype._adjustParentBBoxes = function _adjustParentBBoxes(bbox, path, level) {
        // adjust bboxes along the given tree path
        for (var i = level; i >= 0; i--) {
            extend(path[i], bbox);
        }
    };

    RBush.prototype._condense = function _condense(path) {
        // go through the path, removing empty nodes and updating bboxes
        for (var i = path.length - 1, siblings; i >= 0; i--) {
            if (path[i].children.length === 0) {
                if (i > 0) {
                    siblings = path[i - 1].children;
                    siblings.splice(siblings.indexOf(path[i]), 1);
                } else this.clear();
            } else calcBBox(path[i], this.toBBox);
        }
    };

    return RBush;
}();

function findItem(item, items, equalsFn) {
    if (!equalsFn) return items.indexOf(item);

    for (var i = 0; i < items.length; i++) {
        if (equalsFn(item, items[i])) return i;
    }
    return -1;
}

// calculate node's bbox from bboxes of its children
function calcBBox(node, toBBox) {
    distBBox(node, 0, node.children.length, toBBox, node);
}

// min bounding rectangle of node children from k to p-1
function distBBox(node, k, p, toBBox, destNode) {
    if (!destNode) destNode = createNode(null);
    destNode.minX = Infinity;
    destNode.minY = Infinity;
    destNode.maxX = -Infinity;
    destNode.maxY = -Infinity;

    for (var i = k; i < p; i++) {
        var child = node.children[i];
        extend(destNode, node.leaf ? toBBox(child) : child);
    }

    return destNode;
}

function extend(a, b) {
    a.minX = Math.min(a.minX, b.minX);
    a.minY = Math.min(a.minY, b.minY);
    a.maxX = Math.max(a.maxX, b.maxX);
    a.maxY = Math.max(a.maxY, b.maxY);
    return a;
}

function compareNodeMinX(a, b) {
    return a.minX - b.minX;
}
function compareNodeMinY(a, b) {
    return a.minY - b.minY;
}

function bboxArea(a) {
    return (a.maxX - a.minX) * (a.maxY - a.minY);
}
function bboxMargin(a) {
    return a.maxX - a.minX + (a.maxY - a.minY);
}

function enlargedArea(a, b) {
    return (Math.max(b.maxX, a.maxX) - Math.min(b.minX, a.minX)) * (Math.max(b.maxY, a.maxY) - Math.min(b.minY, a.minY));
}

function intersectionArea(a, b) {
    var minX = Math.max(a.minX, b.minX);
    var minY = Math.max(a.minY, b.minY);
    var maxX = Math.min(a.maxX, b.maxX);
    var maxY = Math.min(a.maxY, b.maxY);

    return Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
}

function contains(a, b) {
    return a.minX <= b.minX && a.minY <= b.minY && b.maxX <= a.maxX && b.maxY <= a.maxY;
}

function intersects$1(a, b) {
    return b.minX <= a.maxX && b.minY <= a.maxY && b.maxX >= a.minX && b.maxY >= a.minY;
}

function createNode(children) {
    return {
        children: children,
        height: 1,
        leaf: true,
        minX: Infinity,
        minY: Infinity,
        maxX: -Infinity,
        maxY: -Infinity
    };
}

// sort an array so that items come in groups of n unsorted items, with groups sorted between each other;
// combines selection algorithm with binary divide & conquer approach

function multiSelect(arr, left, right, n, compare) {
    var stack = [left, right];

    while (stack.length) {
        right = stack.pop();
        left = stack.pop();

        if (right - left <= n) continue;

        var mid = left + Math.ceil((right - left) / n / 2) * n;
        quickselect(arr, mid, left, right, compare);

        stack.push(left, mid, mid, right);
    }
}

var rbush$1 = Object.freeze({
	default: RBush
});

/**
 * Takes a set of features, calculates the bbox of all input features, and returns a bounding box.
 *
 * @name bbox
 * @param {GeoJSON} geojson any GeoJSON object
 * @returns {BBox} bbox extent in [minX, minY, maxX, maxY] order
 * @example
 * var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]]);
 * var bbox = turf.bbox(line);
 * var bboxPolygon = turf.bboxPolygon(bbox);
 *
 * //addToMap
 * var addToMap = [line, bboxPolygon]
 */
function bbox$1(geojson) {
    var result = [Infinity, Infinity, -Infinity, -Infinity];
    coordEach(geojson, function (coord) {
        if (result[0] > coord[0]) {
            result[0] = coord[0];
        }
        if (result[1] > coord[1]) {
            result[1] = coord[1];
        }
        if (result[2] < coord[0]) {
            result[2] = coord[0];
        }
        if (result[3] < coord[1]) {
            result[3] = coord[1];
        }
    });
    return result;
}
bbox$1["default"] = bbox$1;


var es$2 = Object.freeze({
	default: bbox$1
});

var rbush$2 = ( rbush$1 && RBush ) || rbush$1;

var require$$0 = ( es$2 && bbox$1 ) || es$2;

var turfBBox = require$$0.default;
var featureEach$1 = es$1.featureEach;
var featureCollection$1 = es.featureCollection;

/**
 * GeoJSON implementation of [RBush](https://github.com/mourner/rbush#rbush) spatial index.
 *
 * @name rbush
 * @param {number} [maxEntries=9] defines the maximum number of entries in a tree node. 9 (used by default) is a
 * reasonable choice for most applications. Higher value means faster insertion and slower search, and vice versa.
 * @returns {RBush} GeoJSON RBush
 * @example
 * var geojsonRbush = require('geojson-rbush').default;
 * var tree = geojsonRbush();
 */
function geojsonRbush(maxEntries) {
    var tree = new rbush$2(maxEntries);
    /**
     * [insert](https://github.com/mourner/rbush#data-format)
     *
     * @param {Feature} feature insert single GeoJSON Feature
     * @returns {RBush} GeoJSON RBush
     * @example
     * var poly = turf.polygon([[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]);
     * tree.insert(poly)
     */
    tree.insert = function (feature) {
        if (feature.type !== 'Feature') throw new Error('invalid feature');
        feature.bbox = feature.bbox ? feature.bbox : turfBBox(feature);
        return rbush$2.prototype.insert.call(this, feature);
    };

    /**
     * [load](https://github.com/mourner/rbush#bulk-inserting-data)
     *
     * @param {FeatureCollection|Array<Feature>} features load entire GeoJSON FeatureCollection
     * @returns {RBush} GeoJSON RBush
     * @example
     * var polys = turf.polygons([
     *     [[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]],
     *     [[[-93, 32], [-83, 32], [-83, 39], [-93, 39], [-93, 32]]]
     * ]);
     * tree.load(polys);
     */
    tree.load = function (features) {
        var load = [];
        // Load an Array of Features
        if (Array.isArray(features)) {
            features.forEach(function (feature) {
                if (feature.type !== 'Feature') throw new Error('invalid features');
                feature.bbox = feature.bbox ? feature.bbox : turfBBox(feature);
                load.push(feature);
            });
        } else {
            // Load a FeatureCollection
            featureEach$1(features, function (feature) {
                if (feature.type !== 'Feature') throw new Error('invalid features');
                feature.bbox = feature.bbox ? feature.bbox : turfBBox(feature);
                load.push(feature);
            });
        }
        return rbush$2.prototype.load.call(this, load);
    };

    /**
     * [remove](https://github.com/mourner/rbush#removing-data)
     *
     * @param {Feature} feature remove single GeoJSON Feature
     * @param {Function} equals Pass a custom equals function to compare by value for removal.
     * @returns {RBush} GeoJSON RBush
     * @example
     * var poly = turf.polygon([[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]);
     *
     * tree.remove(poly);
     */
    tree.remove = function (feature, equals) {
        if (feature.type !== 'Feature') throw new Error('invalid feature');
        feature.bbox = feature.bbox ? feature.bbox : turfBBox(feature);
        return rbush$2.prototype.remove.call(this, feature, equals);
    };

    /**
     * [clear](https://github.com/mourner/rbush#removing-data)
     *
     * @returns {RBush} GeoJSON Rbush
     * @example
     * tree.clear()
     */
    tree.clear = function () {
        return rbush$2.prototype.clear.call(this);
    };

    /**
     * [search](https://github.com/mourner/rbush#search)
     *
     * @param {BBox|FeatureCollection|Feature} geojson search with GeoJSON
     * @returns {FeatureCollection} all features that intersects with the given GeoJSON.
     * @example
     * var poly = turf.polygon([[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]);
     *
     * tree.search(poly);
     */
    tree.search = function (geojson) {
        var features = rbush$2.prototype.search.call(this, this.toBBox(geojson));
        return featureCollection$1(features);
    };

    /**
     * [collides](https://github.com/mourner/rbush#collisions)
     *
     * @param {BBox|FeatureCollection|Feature} geojson collides with GeoJSON
     * @returns {boolean} true if there are any items intersecting the given GeoJSON, otherwise false.
     * @example
     * var poly = turf.polygon([[[-78, 41], [-67, 41], [-67, 48], [-78, 48], [-78, 41]]]);
     *
     * tree.collides(poly);
     */
    tree.collides = function (geojson) {
        return rbush$2.prototype.collides.call(this, this.toBBox(geojson));
    };

    /**
     * [all](https://github.com/mourner/rbush#search)
     *
     * @returns {FeatureCollection} all the features in RBush
     * @example
     * tree.all()
     */
    tree.all = function () {
        var features = rbush$2.prototype.all.call(this);
        return featureCollection$1(features);
    };

    /**
     * [toJSON](https://github.com/mourner/rbush#export-and-import)
     *
     * @returns {any} export data as JSON object
     * @example
     * var exported = tree.toJSON()
     */
    tree.toJSON = function () {
        return rbush$2.prototype.toJSON.call(this);
    };

    /**
     * [fromJSON](https://github.com/mourner/rbush#export-and-import)
     *
     * @param {any} json import previously exported data
     * @returns {RBush} GeoJSON RBush
     * @example
     * var exported = {
     *   "children": [
     *     {
     *       "type": "Feature",
     *       "geometry": {
     *         "type": "Point",
     *         "coordinates": [110, 50]
     *       },
     *       "properties": {},
     *       "bbox": [110, 50, 110, 50]
     *     }
     *   ],
     *   "height": 1,
     *   "leaf": true,
     *   "minX": 110,
     *   "minY": 50,
     *   "maxX": 110,
     *   "maxY": 50
     * }
     * tree.fromJSON(exported)
     */
    tree.fromJSON = function (json) {
        return rbush$2.prototype.fromJSON.call(this, json);
    };

    /**
     * Converts GeoJSON to {minX, minY, maxX, maxY} schema
     *
     * @private
     * @param {BBox|FeatureCollection|Feature} geojson feature(s) to retrieve BBox from
     * @returns {Object} converted to {minX, minY, maxX, maxY}
     */
    tree.toBBox = function (geojson) {
        var bbox;
        if (geojson.bbox) bbox = geojson.bbox;else if (Array.isArray(geojson) && geojson.length === 4) bbox = geojson;else if (Array.isArray(geojson) && geojson.length === 6) bbox = [geojson[0], geojson[1], geojson[3], geojson[4]];else if (geojson.type === 'Feature') bbox = turfBBox(geojson);else if (geojson.type === 'FeatureCollection') bbox = turfBBox(geojson);else throw new Error('invalid geojson');

        return {
            minX: bbox[0],
            minY: bbox[1],
            maxX: bbox[2],
            maxY: bbox[3]
        };
    };
    return tree;
}

var geojsonRbush_1 = geojsonRbush;
var default_1 = geojsonRbush;

geojsonRbush_1.default = default_1;

/**
 * Takes any LineString or Polygon GeoJSON and returns the intersecting point(s).
 *
 * @name lineIntersect
 * @param {GeoJSON} line1 any LineString or Polygon
 * @param {GeoJSON} line2 any LineString or Polygon
 * @returns {FeatureCollection<Point>} point(s) that intersect both
 * @example
 * var line1 = turf.lineString([[126, -11], [129, -21]]);
 * var line2 = turf.lineString([[123, -18], [131, -14]]);
 * var intersects = turf.lineIntersect(line1, line2);
 *
 * //addToMap
 * var addToMap = [line1, line2, intersects]
 */
function lineIntersect(line1, line2) {
    var unique = {};
    var results = [];
    // First, normalize geometries to features
    // Then, handle simple 2-vertex segments
    if (line1.type === "LineString") {
        line1 = feature(line1);
    }
    if (line2.type === "LineString") {
        line2 = feature(line2);
    }
    if (line1.type === "Feature" && line2.type === "Feature" && line1.geometry !== null && line2.geometry !== null && line1.geometry.type === "LineString" && line2.geometry.type === "LineString" && line1.geometry.coordinates.length === 2 && line2.geometry.coordinates.length === 2) {
        var intersect = intersects(line1, line2);
        if (intersect) {
            results.push(intersect);
        }
        return featureCollection(results);
    }
    // Handles complex GeoJSON Geometries
    var tree = geojsonRbush_1();
    tree.load(lineSegment(line2));
    featureEach(lineSegment(line1), function (segment) {
        featureEach(tree.search(segment), function (match) {
            var intersect = intersects(segment, match);
            if (intersect) {
                // prevent duplicate points https://github.com/Turfjs/turf/issues/688
                var key = getCoords(intersect).join(",");
                if (!unique[key]) {
                    unique[key] = true;
                    results.push(intersect);
                }
            }
        });
    });
    return featureCollection(results);
}
/**
 * Find a point that intersects LineStrings with two coordinates each
 *
 * @private
 * @param {Feature<LineString>} line1 GeoJSON LineString (Must only contain 2 coordinates)
 * @param {Feature<LineString>} line2 GeoJSON LineString (Must only contain 2 coordinates)
 * @returns {Feature<Point>} intersecting GeoJSON Point
 */
function intersects(line1, line2) {
    var coords1 = getCoords(line1);
    var coords2 = getCoords(line2);
    if (coords1.length !== 2) {
        throw new Error("<intersects> line1 must only contain 2 coordinates");
    }
    if (coords2.length !== 2) {
        throw new Error("<intersects> line2 must only contain 2 coordinates");
    }
    var x1 = coords1[0][0];
    var y1 = coords1[0][1];
    var x2 = coords1[1][0];
    var y2 = coords1[1][1];
    var x3 = coords2[0][0];
    var y3 = coords2[0][1];
    var x4 = coords2[1][0];
    var y4 = coords2[1][1];
    var denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    var numeA = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
    var numeB = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);
    if (denom === 0) {
        if (numeA === 0 && numeB === 0) {
            return null;
        }
        return null;
    }
    var uA = numeA / denom;
    var uB = numeB / denom;
    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
        var x = x1 + uA * (x2 - x1);
        var y = y1 + uA * (y2 - y1);
        return point([x, y]);
    }
    return null;
}

/**
 * Takes a {@link Point} and a {@link LineString} and calculates the closest Point on the (Multi)LineString.
 *
 * @name nearestPointOnLine
 * @param {Geometry|Feature<LineString|MultiLineString>} lines lines to snap to
 * @param {Geometry|Feature<Point>|number[]} pt point to snap from
 * @param {Object} [options={}] Optional parameters
 * @param {string} [options.units='kilometers'] can be degrees, radians, miles, or kilometers
 * @returns {Feature<Point>} closest point on the `line` to `point`. The properties object will contain three values: `index`: closest point was found on nth line part, `dist`: distance between pt and the closest point, `location`: distance along the line between start and the closest point.
 * @example
 * var line = turf.lineString([
 *     [-77.031669, 38.878605],
 *     [-77.029609, 38.881946],
 *     [-77.020339, 38.884084],
 *     [-77.025661, 38.885821],
 *     [-77.021884, 38.889563],
 *     [-77.019824, 38.892368]
 * ]);
 * var pt = turf.point([-77.037076, 38.884017]);
 *
 * var snapped = turf.nearestPointOnLine(line, pt, {units: 'miles'});
 *
 * //addToMap
 * var addToMap = [line, pt, snapped];
 * snapped.properties['marker-color'] = '#00f';
 */
function nearestPointOnLine(lines, pt, options) {
    if (options === void 0) {
        options = {};
    }
    var closestPt = point([Infinity, Infinity], {
        dist: Infinity
    });
    var length = 0.0;
    flattenEach(lines, function (line) {
        var coords = getCoords(line);
        for (var i = 0; i < coords.length - 1; i++) {
            //start
            var start = point(coords[i]);
            start.properties.dist = distance(pt, start, options);
            //stop
            var stop_1 = point(coords[i + 1]);
            stop_1.properties.dist = distance(pt, stop_1, options);
            // sectionLength
            var sectionLength = distance(start, stop_1, options);
            //perpendicular
            var heightDistance = Math.max(start.properties.dist, stop_1.properties.dist);
            var direction = bearing(start, stop_1);
            var perpendicularPt1 = destination(pt, heightDistance, direction + 90, options);
            var perpendicularPt2 = destination(pt, heightDistance, direction - 90, options);
            var intersect = lineIntersect(lineString([perpendicularPt1.geometry.coordinates, perpendicularPt2.geometry.coordinates]), lineString([start.geometry.coordinates, stop_1.geometry.coordinates]));
            var intersectPt = null;
            if (intersect.features.length > 0) {
                intersectPt = intersect.features[0];
                intersectPt.properties.dist = distance(pt, intersectPt, options);
                intersectPt.properties.location = length + distance(start, intersectPt, options);
            }
            if (start.properties.dist < closestPt.properties.dist) {
                closestPt = start;
                closestPt.properties.index = i;
                closestPt.properties.location = length;
            }
            if (stop_1.properties.dist < closestPt.properties.dist) {
                closestPt = stop_1;
                closestPt.properties.index = i + 1;
                closestPt.properties.location = length + sectionLength;
            }
            if (intersectPt && intersectPt.properties.dist < closestPt.properties.dist) {
                closestPt = intersectPt;
                closestPt.properties.index = i;
            }
            // update length
            length += sectionLength;
        }
    });
    return closestPt;
}

/**
 * Converts a {@link Polygon} to {@link LineString|(Multi)LineString} or {@link MultiPolygon} to a
 * {@link FeatureCollection} of {@link LineString|(Multi)LineString}.
 *
 * @name polygonToLine
 * @param {Feature<Polygon|MultiPolygon>} poly Feature to convert
 * @param {Object} [options={}] Optional parameters
 * @param {Object} [options.properties={}] translates GeoJSON properties to Feature
 * @returns {FeatureCollection|Feature<LineString|MultiLinestring>} converted (Multi)Polygon to (Multi)LineString
 * @example
 * var poly = turf.polygon([[[125, -30], [145, -30], [145, -20], [125, -20], [125, -30]]]);
 *
 * var line = turf.polygonToLine(poly);
 *
 * //addToMap
 * var addToMap = [line];
 */
var polygonToLine = function (poly, options) {
    if (options === void 0) {
        options = {};
    }
    var geom = getGeom(poly);
    if (!options.properties && poly.type === "Feature") {
        options.properties = poly.properties;
    }
    switch (geom.type) {
        case "Polygon":
            return polygonToLine$1(geom, options);
        case "MultiPolygon":
            return multiPolygonToLine(geom, options);
        default:
            throw new Error("invalid poly");
    }
};
/**
 * @private
 */
function polygonToLine$1(poly, options) {
    if (options === void 0) {
        options = {};
    }
    var geom = getGeom(poly);
    var coords = geom.coordinates;
    var properties = options.properties ? options.properties : poly.type === "Feature" ? poly.properties : {};
    return coordsToLine(coords, properties);
}
/**
 * @private
 */
function multiPolygonToLine(multiPoly, options) {
    if (options === void 0) {
        options = {};
    }
    var geom = getGeom(multiPoly);
    var coords = geom.coordinates;
    var properties = options.properties ? options.properties : multiPoly.type === "Feature" ? multiPoly.properties : {};
    var lines = [];
    coords.forEach(function (coord) {
        lines.push(coordsToLine(coord, properties));
    });
    return featureCollection(lines);
}
/**
 * @private
 */
function coordsToLine(coords, properties) {
    if (coords.length > 1) {
        return multiLineString(coords, properties);
    }
    return lineString(coords[0], properties);
}

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var _typeof$2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE = 200;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';
var funcTag = '[object Function]';
var genTag = '[object GeneratorFunction]';

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Detect free variable `global` from Node.js. */
var freeGlobal = _typeof$2(commonjsGlobal) == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

/** Detect free variable `self`. */
var freeSelf = (typeof self === 'undefined' ? 'undefined' : _typeof$2(self)) == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);
    case 1:
      return func.call(thisArg, args[0]);
    case 2:
      return func.call(thisArg, args[0], args[1]);
    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

/**
 * A specialized version of `_.includes` for arrays without support for
 * specifying an index to search from.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludes(array, value) {
  var length = array ? array.length : 0;
  return !!length && baseIndexOf(array, value, 0) > -1;
}

/**
 * This function is like `arrayIncludes` except that it accepts a comparator.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @param {Function} comparator The comparator invoked per element.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludesWith(array, value, comparator) {
  var index = -1,
      length = array ? array.length : 0;

  while (++index < length) {
    if (comparator(value, array[index])) {
      return true;
    }
  }
  return false;
}

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array ? array.length : 0,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while (fromRight ? index-- : ++index < length) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf(array, value, fromIndex) {
  if (value !== value) {
    return baseFindIndex(array, baseIsNaN, fromIndex);
  }
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.isNaN` without support for number objects.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 */
function baseIsNaN(value) {
  return value !== value;
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function (value) {
    return func(value);
  };
}

/**
 * Checks if a cache value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas(cache, key) {
  return cache.has(key);
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

/** Used for built-in method references. */
var arrayProto = Array.prototype;
var funcProto = Function.prototype;
var objectProto = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey = function () {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? 'Symbol(src)_1.' + uid : '';
}();

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' + funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');

/** Built-in value references. */
var _Symbol = root.Symbol;
var propertyIsEnumerable = objectProto.propertyIsEnumerable;
var splice = arrayProto.splice;
var spreadableSymbol = _Symbol ? _Symbol.isConcatSpreadable : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map');
var nativeCreate = getNative(Object, 'create');

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  return this.has(key) && delete this.__data__[key];
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED : value;
  return this;
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.__data__ = {
    'hash': new Hash(),
    'map': new (Map || ListCache)(),
    'string': new Hash()
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  return getMapData(this, key)['delete'](key);
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  getMapData(this, key).set(key, value);
  return this;
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache(values) {
  var index = -1,
      length = values ? values.length : 0;

  this.__data__ = new MapCache();
  while (++index < length) {
    this.add(values[index]);
  }
}

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas(value) {
  return this.__data__.has(value);
}

// Add methods to `SetCache`.
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * The base implementation of methods like `_.difference` without support
 * for excluding multiple arrays or iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Array} values The values to exclude.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new array of filtered values.
 */
function baseDifference(array, values, iteratee, comparator) {
  var index = -1,
      includes = arrayIncludes,
      isCommon = true,
      length = array.length,
      result = [],
      valuesLength = values.length;

  if (!length) {
    return result;
  }
  if (iteratee) {
    values = arrayMap(values, baseUnary(iteratee));
  }
  if (comparator) {
    includes = arrayIncludesWith;
    isCommon = false;
  } else if (values.length >= LARGE_ARRAY_SIZE) {
    includes = cacheHas;
    isCommon = false;
    values = new SetCache(values);
  }
  outer: while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value) : value;

    value = comparator || value !== 0 ? value : 0;
    if (isCommon && computed === computed) {
      var valuesIndex = valuesLength;
      while (valuesIndex--) {
        if (values[valuesIndex] === computed) {
          continue outer;
        }
      }
      result.push(value);
    } else if (!includes(values, computed, comparator)) {
      result.push(value);
    }
  }
  return result;
}

/**
 * The base implementation of `_.flatten` with support for restricting flattening.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {number} depth The maximum recursion depth.
 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten(array, depth, predicate, isStrict, result) {
  var index = -1,
      length = array.length;

  predicate || (predicate = isFlattenable);
  result || (result = []);

  while (++index < length) {
    var value = array[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject$1(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) || isHostObject(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  start = nativeMax(start === undefined ? func.length - 1 : start, 0);
  return function () {
    var args = arguments,
        index = -1,
        length = nativeMax(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = array;
    return apply(func, this, otherArgs);
  };
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

/**
 * Checks if `value` is a flattenable `arguments` object or array.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
 */
function isFlattenable(value) {
  return isArray(value) || isArguments(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof$2(value);
  return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && maskSrcKey in func;
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to process.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return func + '';
    } catch (e) {}
  }
  return '';
}

/**
 * Creates an array of `array` values not included in the other given arrays
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons. The order of result values is determined by the
 * order they occur in the first array.
 *
 * **Note:** Unlike `_.pullAll`, this method returns a new array.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to inspect.
 * @param {...Array} [values] The values to exclude.
 * @returns {Array} Returns the new array of filtered values.
 * @see _.without, _.xor
 * @example
 *
 * _.difference([2, 1], [2, 3]);
 * // => [1]
 */
var difference = baseRest(function (array, values) {
  return isArrayLikeObject(array) ? baseDifference(array, baseFlatten(values, 1, isArrayLikeObject, true)) : [];
});

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || value !== value && other !== other;
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments(value) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') && (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject$1(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject$1(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof$2(value);
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof$2(value)) == 'object';
}

var lodash_difference = difference;

var _typeof$3 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * lodash (Custom Build) <https://lodash.com/>
 * Build: `lodash modularize exports="npm" -o ./`
 * Copyright jQuery Foundation and other contributors <https://jquery.org/>
 * Released under MIT license <https://lodash.com/license>
 * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
 * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
 */

/** Used as the size to enable large array optimizations. */
var LARGE_ARRAY_SIZE$1 = 200;

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED$1 = '__lodash_hash_undefined__';

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$1 = 9007199254740991;

/** `Object#toString` result references. */
var argsTag$1 = '[object Arguments]';
var funcTag$1 = '[object Function]';
var genTag$1 = '[object GeneratorFunction]';

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar$1 = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor$1 = /^\[object .+?Constructor\]$/;

/** Detect free variable `global` from Node.js. */
var freeGlobal$1 = _typeof$3(commonjsGlobal) == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

/** Detect free variable `self`. */
var freeSelf$1 = (typeof self === 'undefined' ? 'undefined' : _typeof$3(self)) == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root$1 = freeGlobal$1 || freeSelf$1 || Function('return this')();

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply$1(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);
    case 1:
      return func.call(thisArg, args[0]);
    case 2:
      return func.call(thisArg, args[0], args[1]);
    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

/**
 * A specialized version of `_.includes` for arrays without support for
 * specifying an index to search from.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludes$1(array, value) {
  var length = array ? array.length : 0;
  return !!length && baseIndexOf$1(array, value, 0) > -1;
}

/**
 * This function is like `arrayIncludes` except that it accepts a comparator.
 *
 * @private
 * @param {Array} [array] The array to inspect.
 * @param {*} target The value to search for.
 * @param {Function} comparator The comparator invoked per element.
 * @returns {boolean} Returns `true` if `target` is found, else `false`.
 */
function arrayIncludesWith$1(array, value, comparator) {
  var index = -1,
      length = array ? array.length : 0;

  while (++index < length) {
    if (comparator(value, array[index])) {
      return true;
    }
  }
  return false;
}

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap$1(array, iteratee) {
  var index = -1,
      length = array ? array.length : 0,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

/**
 * Appends the elements of `values` to `array`.
 *
 * @private
 * @param {Array} array The array to modify.
 * @param {Array} values The values to append.
 * @returns {Array} Returns `array`.
 */
function arrayPush$1(array, values) {
  var index = -1,
      length = values.length,
      offset = array.length;

  while (++index < length) {
    array[offset + index] = values[index];
  }
  return array;
}

/**
 * The base implementation of `_.findIndex` and `_.findLastIndex` without
 * support for iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Function} predicate The function invoked per iteration.
 * @param {number} fromIndex The index to search from.
 * @param {boolean} [fromRight] Specify iterating from right to left.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseFindIndex$1(array, predicate, fromIndex, fromRight) {
  var length = array.length,
      index = fromIndex + (fromRight ? 1 : -1);

  while (fromRight ? index-- : ++index < length) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} value The value to search for.
 * @param {number} fromIndex The index to search from.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function baseIndexOf$1(array, value, fromIndex) {
  if (value !== value) {
    return baseFindIndex$1(array, baseIsNaN$1, fromIndex);
  }
  var index = fromIndex - 1,
      length = array.length;

  while (++index < length) {
    if (array[index] === value) {
      return index;
    }
  }
  return -1;
}

/**
 * The base implementation of `_.isNaN` without support for number objects.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
 */
function baseIsNaN$1(value) {
  return value !== value;
}

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary$1(func) {
  return function (value) {
    return func(value);
  };
}

/**
 * Checks if a cache value for `key` exists.
 *
 * @private
 * @param {Object} cache The cache to query.
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function cacheHas$1(cache, key) {
  return cache.has(key);
}

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue$1(object, key) {
  return object == null ? undefined : object[key];
}

/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject$1(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

/** Used for built-in method references. */
var arrayProto$1 = Array.prototype;
var funcProto$1 = Function.prototype;
var objectProto$1 = Object.prototype;

/** Used to detect overreaching core-js shims. */
var coreJsData$1 = root$1['__core-js_shared__'];

/** Used to detect methods masquerading as native. */
var maskSrcKey$1 = function () {
  var uid = /[^.]+$/.exec(coreJsData$1 && coreJsData$1.keys && coreJsData$1.keys.IE_PROTO || '');
  return uid ? 'Symbol(src)_1.' + uid : '';
}();

/** Used to resolve the decompiled source of functions. */
var funcToString$1 = funcProto$1.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$1.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString$1 = objectProto$1.toString;

/** Used to detect if a method is native. */
var reIsNative$1 = RegExp('^' + funcToString$1.call(hasOwnProperty$1).replace(reRegExpChar$1, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');

/** Built-in value references. */
var _Symbol$1 = root$1.Symbol;
var propertyIsEnumerable$1 = objectProto$1.propertyIsEnumerable;
var splice$1 = arrayProto$1.splice;
var spreadableSymbol$1 = _Symbol$1 ? _Symbol$1.isConcatSpreadable : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax$1 = Math.max;

/* Built-in method references that are verified to be native. */
var Map$1 = getNative$1(root$1, 'Map');
var nativeCreate$1 = getNative$1(Object, 'create');

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash$1(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear$1() {
  this.__data__ = nativeCreate$1 ? nativeCreate$1(null) : {};
}

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete$1(key) {
  return this.has(key) && delete this.__data__[key];
}

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet$1(key) {
  var data = this.__data__;
  if (nativeCreate$1) {
    var result = data[key];
    return result === HASH_UNDEFINED$1 ? undefined : result;
  }
  return hasOwnProperty$1.call(data, key) ? data[key] : undefined;
}

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas$1(key) {
  var data = this.__data__;
  return nativeCreate$1 ? data[key] !== undefined : hasOwnProperty$1.call(data, key);
}

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet$1(key, value) {
  var data = this.__data__;
  data[key] = nativeCreate$1 && value === undefined ? HASH_UNDEFINED$1 : value;
  return this;
}

// Add methods to `Hash`.
Hash$1.prototype.clear = hashClear$1;
Hash$1.prototype['delete'] = hashDelete$1;
Hash$1.prototype.get = hashGet$1;
Hash$1.prototype.has = hashHas$1;
Hash$1.prototype.set = hashSet$1;

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache$1(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear$1() {
  this.__data__ = [];
}

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete$1(key) {
  var data = this.__data__,
      index = assocIndexOf$1(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice$1.call(data, index, 1);
  }
  return true;
}

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet$1(key) {
  var data = this.__data__,
      index = assocIndexOf$1(data, key);

  return index < 0 ? undefined : data[index][1];
}

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas$1(key) {
  return assocIndexOf$1(this.__data__, key) > -1;
}

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet$1(key, value) {
  var data = this.__data__,
      index = assocIndexOf$1(data, key);

  if (index < 0) {
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

// Add methods to `ListCache`.
ListCache$1.prototype.clear = listCacheClear$1;
ListCache$1.prototype['delete'] = listCacheDelete$1;
ListCache$1.prototype.get = listCacheGet$1;
ListCache$1.prototype.has = listCacheHas$1;
ListCache$1.prototype.set = listCacheSet$1;

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache$1(entries) {
  var index = -1,
      length = entries ? entries.length : 0;

  this.clear();
  while (++index < length) {
    var entry = entries[index];
    this.set(entry[0], entry[1]);
  }
}

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear$1() {
  this.__data__ = {
    'hash': new Hash$1(),
    'map': new (Map$1 || ListCache$1)(),
    'string': new Hash$1()
  };
}

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete$1(key) {
  return getMapData$1(this, key)['delete'](key);
}

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet$1(key) {
  return getMapData$1(this, key).get(key);
}

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas$1(key) {
  return getMapData$1(this, key).has(key);
}

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet$1(key, value) {
  getMapData$1(this, key).set(key, value);
  return this;
}

// Add methods to `MapCache`.
MapCache$1.prototype.clear = mapCacheClear$1;
MapCache$1.prototype['delete'] = mapCacheDelete$1;
MapCache$1.prototype.get = mapCacheGet$1;
MapCache$1.prototype.has = mapCacheHas$1;
MapCache$1.prototype.set = mapCacheSet$1;

/**
 *
 * Creates an array cache object to store unique values.
 *
 * @private
 * @constructor
 * @param {Array} [values] The values to cache.
 */
function SetCache$1(values) {
  var index = -1,
      length = values ? values.length : 0;

  this.__data__ = new MapCache$1();
  while (++index < length) {
    this.add(values[index]);
  }
}

/**
 * Adds `value` to the array cache.
 *
 * @private
 * @name add
 * @memberOf SetCache
 * @alias push
 * @param {*} value The value to cache.
 * @returns {Object} Returns the cache instance.
 */
function setCacheAdd$1(value) {
  this.__data__.set(value, HASH_UNDEFINED$1);
  return this;
}

/**
 * Checks if `value` is in the array cache.
 *
 * @private
 * @name has
 * @memberOf SetCache
 * @param {*} value The value to search for.
 * @returns {number} Returns `true` if `value` is found, else `false`.
 */
function setCacheHas$1(value) {
  return this.__data__.has(value);
}

// Add methods to `SetCache`.
SetCache$1.prototype.add = SetCache$1.prototype.push = setCacheAdd$1;
SetCache$1.prototype.has = setCacheHas$1;

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf$1(array, key) {
  var length = array.length;
  while (length--) {
    if (eq$1(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

/**
 * The base implementation of methods like `_.difference` without support
 * for excluding multiple arrays or iteratee shorthands.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {Array} values The values to exclude.
 * @param {Function} [iteratee] The iteratee invoked per element.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new array of filtered values.
 */
function baseDifference$1(array, values, iteratee, comparator) {
  var index = -1,
      includes = arrayIncludes$1,
      isCommon = true,
      length = array.length,
      result = [],
      valuesLength = values.length;

  if (!length) {
    return result;
  }
  if (iteratee) {
    values = arrayMap$1(values, baseUnary$1(iteratee));
  }
  if (comparator) {
    includes = arrayIncludesWith$1;
    isCommon = false;
  } else if (values.length >= LARGE_ARRAY_SIZE$1) {
    includes = cacheHas$1;
    isCommon = false;
    values = new SetCache$1(values);
  }
  outer: while (++index < length) {
    var value = array[index],
        computed = iteratee ? iteratee(value) : value;

    value = comparator || value !== 0 ? value : 0;
    if (isCommon && computed === computed) {
      var valuesIndex = valuesLength;
      while (valuesIndex--) {
        if (values[valuesIndex] === computed) {
          continue outer;
        }
      }
      result.push(value);
    } else if (!includes(values, computed, comparator)) {
      result.push(value);
    }
  }
  return result;
}

/**
 * The base implementation of `_.flatten` with support for restricting flattening.
 *
 * @private
 * @param {Array} array The array to flatten.
 * @param {number} depth The maximum recursion depth.
 * @param {boolean} [predicate=isFlattenable] The function invoked per iteration.
 * @param {boolean} [isStrict] Restrict to values that pass `predicate` checks.
 * @param {Array} [result=[]] The initial result value.
 * @returns {Array} Returns the new flattened array.
 */
function baseFlatten$1(array, depth, predicate, isStrict, result) {
  var index = -1,
      length = array.length;

  predicate || (predicate = isFlattenable$1);
  result || (result = []);

  while (++index < length) {
    var value = array[index];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        // Recursively flatten arrays (susceptible to call stack limits).
        baseFlatten$1(value, depth - 1, predicate, isStrict, result);
      } else {
        arrayPush$1(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative$1(value) {
  if (!isObject$2(value) || isMasked$1(value)) {
    return false;
  }
  var pattern = isFunction$1(value) || isHostObject$1(value) ? reIsNative$1 : reIsHostCtor$1;
  return pattern.test(toSource$1(value));
}

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest$1(func, start) {
  start = nativeMax$1(start === undefined ? func.length - 1 : start, 0);
  return function () {
    var args = arguments,
        index = -1,
        length = nativeMax$1(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = array;
    return apply$1(func, this, otherArgs);
  };
}

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData$1(map, key) {
  var data = map.__data__;
  return isKeyable$1(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
}

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative$1(object, key) {
  var value = getValue$1(object, key);
  return baseIsNative$1(value) ? value : undefined;
}

/**
 * Checks if `value` is a flattenable `arguments` object or array.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is flattenable, else `false`.
 */
function isFlattenable$1(value) {
  return isArray$1(value) || isArguments$1(value) || !!(spreadableSymbol$1 && value && value[spreadableSymbol$1]);
}

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable$1(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof$3(value);
  return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
}

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked$1(func) {
  return !!maskSrcKey$1 && maskSrcKey$1 in func;
}

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to process.
 * @returns {string} Returns the source code.
 */
function toSource$1(func) {
  if (func != null) {
    try {
      return funcToString$1.call(func);
    } catch (e) {}
    try {
      return func + '';
    } catch (e) {}
  }
  return '';
}

/**
 * This method is like `_.difference` except that it accepts `comparator`
 * which is invoked to compare elements of `array` to `values`. Result values
 * are chosen from the first array. The comparator is invoked with two arguments:
 * (arrVal, othVal).
 *
 * **Note:** Unlike `_.pullAllWith`, this method returns a new array.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Array
 * @param {Array} array The array to inspect.
 * @param {...Array} [values] The values to exclude.
 * @param {Function} [comparator] The comparator invoked per element.
 * @returns {Array} Returns the new array of filtered values.
 * @example
 *
 * var objects = [{ 'x': 1, 'y': 2 }, { 'x': 2, 'y': 1 }];
 *
 * _.differenceWith(objects, [{ 'x': 1, 'y': 2 }], _.isEqual);
 * // => [{ 'x': 2, 'y': 1 }]
 */
var differenceWith = baseRest$1(function (array, values) {
  var comparator = last(values);
  if (isArrayLikeObject$1(comparator)) {
    comparator = undefined;
  }
  return isArrayLikeObject$1(array) ? baseDifference$1(array, baseFlatten$1(values, 1, isArrayLikeObject$1, true), undefined, comparator) : [];
});

/**
 * Gets the last element of `array`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Array
 * @param {Array} array The array to query.
 * @returns {*} Returns the last element of `array`.
 * @example
 *
 * _.last([1, 2, 3]);
 * // => 3
 */
function last(array) {
  var length = array ? array.length : 0;
  return length ? array[length - 1] : undefined;
}

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq$1(value, other) {
  return value === other || value !== value && other !== other;
}

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
function isArguments$1(value) {
  // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
  return isArrayLikeObject$1(value) && hasOwnProperty$1.call(value, 'callee') && (!propertyIsEnumerable$1.call(value, 'callee') || objectToString$1.call(value) == argsTag$1);
}

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray$1 = Array.isArray;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike$1(value) {
  return value != null && isLength$1(value.length) && !isFunction$1(value);
}

/**
 * This method is like `_.isArrayLike` except that it also checks if `value`
 * is an object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array-like object,
 *  else `false`.
 * @example
 *
 * _.isArrayLikeObject([1, 2, 3]);
 * // => true
 *
 * _.isArrayLikeObject(document.body.children);
 * // => true
 *
 * _.isArrayLikeObject('abc');
 * // => false
 *
 * _.isArrayLikeObject(_.noop);
 * // => false
 */
function isArrayLikeObject$1(value) {
  return isObjectLike$1(value) && isArrayLike$1(value);
}

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction$1(value) {
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8-9 which returns 'object' for typed array and other constructors.
  var tag = isObject$2(value) ? objectToString$1.call(value) : '';
  return tag == funcTag$1 || tag == genTag$1;
}

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength$1(value) {
  return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER$1;
}

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject$2(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof$3(value);
  return !!value && (type == 'object' || type == 'function');
}

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike$1(value) {
  return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof$3(value)) == 'object';
}

var lodash_differencewith = differenceWith;

var _typeof$4 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var lodash_findindex = createCommonjsModule(function (module, exports) {
  /**
   * lodash (Custom Build) <https://lodash.com/>
   * Build: `lodash modularize exports="npm" -o ./`
   * Copyright jQuery Foundation and other contributors <https://jquery.org/>
   * Released under MIT license <https://lodash.com/license>
   * Based on Underscore.js 1.8.3 <http://underscorejs.org/LICENSE>
   * Copyright Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
   */

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /** Used as the `TypeError` message for "Functions" methods. */
  var FUNC_ERROR_TEXT = 'Expected a function';

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = '__lodash_hash_undefined__';

  /** Used to compose bitmasks for comparison styles. */
  var UNORDERED_COMPARE_FLAG = 1,
      PARTIAL_COMPARE_FLAG = 2;

  /** Used as references for various `Number` constants. */
  var INFINITY = 1 / 0,
      MAX_SAFE_INTEGER = 9007199254740991,
      MAX_INTEGER = 1.7976931348623157e+308,
      NAN = 0 / 0;

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      funcTag = '[object Function]',
      genTag = '[object GeneratorFunction]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      objectTag = '[object Object]',
      promiseTag = '[object Promise]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      symbolTag = '[object Symbol]',
      weakMapTag = '[object WeakMap]';

  var arrayBufferTag = '[object ArrayBuffer]',
      dataViewTag = '[object DataView]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /** Used to match property names within property paths. */
  var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
      reIsPlainProp = /^\w*$/,
      reLeadingDot = /^\./,
      rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

  /**
   * Used to match `RegExp`
   * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
   */
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

  /** Used to match leading and trailing whitespace. */
  var reTrim = /^\s+|\s+$/g;

  /** Used to match backslashes in property paths. */
  var reEscapeChar = /\\(\\)?/g;

  /** Used to detect bad signed hexadecimal string values. */
  var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

  /** Used to detect binary string values. */
  var reIsBinary = /^0b[01]+$/i;

  /** Used to detect host constructors (Safari). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used to detect octal string values. */
  var reIsOctal = /^0o[0-7]+$/i;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^(?:0|[1-9]\d*)$/;

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

  /** Built-in method references without a dependency on `root`. */
  var freeParseInt = parseInt;

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = _typeof$4(commonjsGlobal) == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

  /** Detect free variable `self`. */
  var freeSelf = (typeof self === 'undefined' ? 'undefined' : _typeof$4(self)) == 'object' && self && self.Object === Object && self;

  /** Used as a reference to the global object. */
  var root = freeGlobal || freeSelf || Function('return this')();

  /** Detect free variable `exports`. */
  var freeExports = 'object' == 'object' && exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Detect free variable `process` from Node.js. */
  var freeProcess = moduleExports && freeGlobal.process;

  /** Used to access faster Node.js helpers. */
  var nodeUtil = function () {
    try {
      return freeProcess && freeProcess.binding('util');
    } catch (e) {}
  }();

  /* Node.js helper references. */
  var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

  /**
   * A specialized version of `_.some` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {boolean} Returns `true` if any element passes the predicate check,
   *  else `false`.
   */
  function arraySome(array, predicate) {
    var index = -1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true;
      }
    }
    return false;
  }

  /**
   * The base implementation of `_.findIndex` and `_.findLastIndex` without
   * support for iteratee shorthands.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {Function} predicate The function invoked per iteration.
   * @param {number} fromIndex The index to search from.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseFindIndex(array, predicate, fromIndex, fromRight) {
    var length = array.length,
        index = fromIndex + (fromRight ? 1 : -1);

    while (fromRight ? index-- : ++index < length) {
      if (predicate(array[index], index, array)) {
        return index;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `_.property` without support for deep paths.
   *
   * @private
   * @param {string} key The key of the property to get.
   * @returns {Function} Returns the new accessor function.
   */
  function baseProperty(key) {
    return function (object) {
      return object == null ? undefined : object[key];
    };
  }

  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */
  function baseTimes(n, iteratee) {
    var index = -1,
        result = Array(n);

    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }

  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */
  function baseUnary(func) {
    return function (value) {
      return func(value);
    };
  }

  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function getValue(object, key) {
    return object == null ? undefined : object[key];
  }

  /**
   * Checks if `value` is a host object in IE < 9.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
   */
  function isHostObject(value) {
    // Many host objects are `Object` objects that can coerce to strings
    // despite having improperly defined `toString` methods.
    var result = false;
    if (value != null && typeof value.toString != 'function') {
      try {
        result = !!(value + '');
      } catch (e) {}
    }
    return result;
  }

  /**
   * Converts `map` to its key-value pairs.
   *
   * @private
   * @param {Object} map The map to convert.
   * @returns {Array} Returns the key-value pairs.
   */
  function mapToArray(map) {
    var index = -1,
        result = Array(map.size);

    map.forEach(function (value, key) {
      result[++index] = [key, value];
    });
    return result;
  }

  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function (arg) {
      return func(transform(arg));
    };
  }

  /**
   * Converts `set` to an array of its values.
   *
   * @private
   * @param {Object} set The set to convert.
   * @returns {Array} Returns the values.
   */
  function setToArray(set) {
    var index = -1,
        result = Array(set.size);

    set.forEach(function (value) {
      result[++index] = value;
    });
    return result;
  }

  /** Used for built-in method references. */
  var arrayProto = Array.prototype,
      funcProto = Function.prototype,
      objectProto = Object.prototype;

  /** Used to detect overreaching core-js shims. */
  var coreJsData = root['__core-js_shared__'];

  /** Used to detect methods masquerading as native. */
  var maskSrcKey = function () {
    var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
    return uid ? 'Symbol(src)_1.' + uid : '';
  }();

  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;

  /** Used to detect if a method is native. */
  var reIsNative = RegExp('^' + funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');

  /** Built-in value references. */
  var _Symbol = root.Symbol,
      Uint8Array = root.Uint8Array,
      propertyIsEnumerable = objectProto.propertyIsEnumerable,
      splice = arrayProto.splice;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeKeys = overArg(Object.keys, Object),
      nativeMax = Math.max;

  /* Built-in method references that are verified to be native. */
  var DataView = getNative(root, 'DataView'),
      Map = getNative(root, 'Map'),
      Promise = getNative(root, 'Promise'),
      Set = getNative(root, 'Set'),
      WeakMap = getNative(root, 'WeakMap'),
      nativeCreate = getNative(Object, 'create');

  /** Used to detect maps, sets, and weakmaps. */
  var dataViewCtorString = toSource(DataView),
      mapCtorString = toSource(Map),
      promiseCtorString = toSource(Promise),
      setCtorString = toSource(Set),
      weakMapCtorString = toSource(WeakMap);

  /** Used to convert symbols to primitives and strings. */
  var symbolProto = _Symbol ? _Symbol.prototype : undefined,
      symbolValueOf = symbolProto ? symbolProto.valueOf : undefined,
      symbolToString = symbolProto ? symbolProto.toString : undefined;

  /**
   * Creates a hash object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Hash(entries) {
    var index = -1,
        length = entries ? entries.length : 0;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  /**
   * Removes all key-value entries from the hash.
   *
   * @private
   * @name clear
   * @memberOf Hash
   */
  function hashClear() {
    this.__data__ = nativeCreate ? nativeCreate(null) : {};
  }

  /**
   * Removes `key` and its value from the hash.
   *
   * @private
   * @name delete
   * @memberOf Hash
   * @param {Object} hash The hash to modify.
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function hashDelete(key) {
    return this.has(key) && delete this.__data__[key];
  }

  /**
   * Gets the hash value for `key`.
   *
   * @private
   * @name get
   * @memberOf Hash
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function hashGet(key) {
    var data = this.__data__;
    if (nativeCreate) {
      var result = data[key];
      return result === HASH_UNDEFINED ? undefined : result;
    }
    return hasOwnProperty.call(data, key) ? data[key] : undefined;
  }

  /**
   * Checks if a hash value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Hash
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function hashHas(key) {
    var data = this.__data__;
    return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
  }

  /**
   * Sets the hash `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Hash
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the hash instance.
   */
  function hashSet(key, value) {
    var data = this.__data__;
    data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED : value;
    return this;
  }

  // Add methods to `Hash`.
  Hash.prototype.clear = hashClear;
  Hash.prototype['delete'] = hashDelete;
  Hash.prototype.get = hashGet;
  Hash.prototype.has = hashHas;
  Hash.prototype.set = hashSet;

  /**
   * Creates an list cache object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function ListCache(entries) {
    var index = -1,
        length = entries ? entries.length : 0;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  /**
   * Removes all key-value entries from the list cache.
   *
   * @private
   * @name clear
   * @memberOf ListCache
   */
  function listCacheClear() {
    this.__data__ = [];
  }

  /**
   * Removes `key` and its value from the list cache.
   *
   * @private
   * @name delete
   * @memberOf ListCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function listCacheDelete(key) {
    var data = this.__data__,
        index = assocIndexOf(data, key);

    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    return true;
  }

  /**
   * Gets the list cache value for `key`.
   *
   * @private
   * @name get
   * @memberOf ListCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function listCacheGet(key) {
    var data = this.__data__,
        index = assocIndexOf(data, key);

    return index < 0 ? undefined : data[index][1];
  }

  /**
   * Checks if a list cache value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf ListCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function listCacheHas(key) {
    return assocIndexOf(this.__data__, key) > -1;
  }

  /**
   * Sets the list cache `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf ListCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the list cache instance.
   */
  function listCacheSet(key, value) {
    var data = this.__data__,
        index = assocIndexOf(data, key);

    if (index < 0) {
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  }

  // Add methods to `ListCache`.
  ListCache.prototype.clear = listCacheClear;
  ListCache.prototype['delete'] = listCacheDelete;
  ListCache.prototype.get = listCacheGet;
  ListCache.prototype.has = listCacheHas;
  ListCache.prototype.set = listCacheSet;

  /**
   * Creates a map cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function MapCache(entries) {
    var index = -1,
        length = entries ? entries.length : 0;

    this.clear();
    while (++index < length) {
      var entry = entries[index];
      this.set(entry[0], entry[1]);
    }
  }

  /**
   * Removes all key-value entries from the map.
   *
   * @private
   * @name clear
   * @memberOf MapCache
   */
  function mapCacheClear() {
    this.__data__ = {
      'hash': new Hash(),
      'map': new (Map || ListCache)(),
      'string': new Hash()
    };
  }

  /**
   * Removes `key` and its value from the map.
   *
   * @private
   * @name delete
   * @memberOf MapCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function mapCacheDelete(key) {
    return getMapData(this, key)['delete'](key);
  }

  /**
   * Gets the map value for `key`.
   *
   * @private
   * @name get
   * @memberOf MapCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function mapCacheGet(key) {
    return getMapData(this, key).get(key);
  }

  /**
   * Checks if a map value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf MapCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function mapCacheHas(key) {
    return getMapData(this, key).has(key);
  }

  /**
   * Sets the map `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf MapCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the map cache instance.
   */
  function mapCacheSet(key, value) {
    getMapData(this, key).set(key, value);
    return this;
  }

  // Add methods to `MapCache`.
  MapCache.prototype.clear = mapCacheClear;
  MapCache.prototype['delete'] = mapCacheDelete;
  MapCache.prototype.get = mapCacheGet;
  MapCache.prototype.has = mapCacheHas;
  MapCache.prototype.set = mapCacheSet;

  /**
   *
   * Creates an array cache object to store unique values.
   *
   * @private
   * @constructor
   * @param {Array} [values] The values to cache.
   */
  function SetCache(values) {
    var index = -1,
        length = values ? values.length : 0;

    this.__data__ = new MapCache();
    while (++index < length) {
      this.add(values[index]);
    }
  }

  /**
   * Adds `value` to the array cache.
   *
   * @private
   * @name add
   * @memberOf SetCache
   * @alias push
   * @param {*} value The value to cache.
   * @returns {Object} Returns the cache instance.
   */
  function setCacheAdd(value) {
    this.__data__.set(value, HASH_UNDEFINED);
    return this;
  }

  /**
   * Checks if `value` is in the array cache.
   *
   * @private
   * @name has
   * @memberOf SetCache
   * @param {*} value The value to search for.
   * @returns {number} Returns `true` if `value` is found, else `false`.
   */
  function setCacheHas(value) {
    return this.__data__.has(value);
  }

  // Add methods to `SetCache`.
  SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
  SetCache.prototype.has = setCacheHas;

  /**
   * Creates a stack cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Stack(entries) {
    this.__data__ = new ListCache(entries);
  }

  /**
   * Removes all key-value entries from the stack.
   *
   * @private
   * @name clear
   * @memberOf Stack
   */
  function stackClear() {
    this.__data__ = new ListCache();
  }

  /**
   * Removes `key` and its value from the stack.
   *
   * @private
   * @name delete
   * @memberOf Stack
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function stackDelete(key) {
    return this.__data__['delete'](key);
  }

  /**
   * Gets the stack value for `key`.
   *
   * @private
   * @name get
   * @memberOf Stack
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function stackGet(key) {
    return this.__data__.get(key);
  }

  /**
   * Checks if a stack value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Stack
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function stackHas(key) {
    return this.__data__.has(key);
  }

  /**
   * Sets the stack `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Stack
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the stack cache instance.
   */
  function stackSet(key, value) {
    var cache = this.__data__;
    if (cache instanceof ListCache) {
      var pairs = cache.__data__;
      if (!Map || pairs.length < LARGE_ARRAY_SIZE - 1) {
        pairs.push([key, value]);
        return this;
      }
      cache = this.__data__ = new MapCache(pairs);
    }
    cache.set(key, value);
    return this;
  }

  // Add methods to `Stack`.
  Stack.prototype.clear = stackClear;
  Stack.prototype['delete'] = stackDelete;
  Stack.prototype.get = stackGet;
  Stack.prototype.has = stackHas;
  Stack.prototype.set = stackSet;

  /**
   * Creates an array of the enumerable property names of the array-like `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @param {boolean} inherited Specify returning inherited property names.
   * @returns {Array} Returns the array of property names.
   */
  function arrayLikeKeys(value, inherited) {
    // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
    // Safari 9 makes `arguments.length` enumerable in strict mode.
    var result = isArray(value) || isArguments(value) ? baseTimes(value.length, String) : [];

    var length = result.length,
        skipIndexes = !!length;

    for (var key in value) {
      if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == 'length' || isIndex(key, length)))) {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * Gets the index at which the `key` is found in `array` of key-value pairs.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} key The key to search for.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
      if (eq(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }

  /**
   * The base implementation of `_.get` without support for default values.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @returns {*} Returns the resolved value.
   */
  function baseGet(object, path) {
    path = isKey(path, object) ? [path] : castPath(path);

    var index = 0,
        length = path.length;

    while (object != null && index < length) {
      object = object[toKey(path[index++])];
    }
    return index && index == length ? object : undefined;
  }

  /**
   * The base implementation of `getTag`.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  function baseGetTag(value) {
    return objectToString.call(value);
  }

  /**
   * The base implementation of `_.hasIn` without support for deep paths.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {Array|string} key The key to check.
   * @returns {boolean} Returns `true` if `key` exists, else `false`.
   */
  function baseHasIn(object, key) {
    return object != null && key in Object(object);
  }

  /**
   * The base implementation of `_.isEqual` which supports partial comparisons
   * and tracks traversed objects.
   *
   * @private
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @param {Function} [customizer] The function to customize comparisons.
   * @param {boolean} [bitmask] The bitmask of comparison flags.
   *  The bitmask may be composed of the following flags:
   *     1 - Unordered comparison
   *     2 - Partial comparison
   * @param {Object} [stack] Tracks traversed `value` and `other` objects.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   */
  function baseIsEqual(value, other, customizer, bitmask, stack) {
    if (value === other) {
      return true;
    }
    if (value == null || other == null || !isObject(value) && !isObjectLike(other)) {
      return value !== value && other !== other;
    }
    return baseIsEqualDeep(value, other, baseIsEqual, customizer, bitmask, stack);
  }

  /**
   * A specialized version of `baseIsEqual` for arrays and objects which performs
   * deep comparisons and tracks traversed objects enabling objects with circular
   * references to be compared.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Function} [customizer] The function to customize comparisons.
   * @param {number} [bitmask] The bitmask of comparison flags. See `baseIsEqual`
   *  for more details.
   * @param {Object} [stack] Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function baseIsEqualDeep(object, other, equalFunc, customizer, bitmask, stack) {
    var objIsArr = isArray(object),
        othIsArr = isArray(other),
        objTag = arrayTag,
        othTag = arrayTag;

    if (!objIsArr) {
      objTag = getTag(object);
      objTag = objTag == argsTag ? objectTag : objTag;
    }
    if (!othIsArr) {
      othTag = getTag(other);
      othTag = othTag == argsTag ? objectTag : othTag;
    }
    var objIsObj = objTag == objectTag && !isHostObject(object),
        othIsObj = othTag == objectTag && !isHostObject(other),
        isSameTag = objTag == othTag;

    if (isSameTag && !objIsObj) {
      stack || (stack = new Stack());
      return objIsArr || isTypedArray(object) ? equalArrays(object, other, equalFunc, customizer, bitmask, stack) : equalByTag(object, other, objTag, equalFunc, customizer, bitmask, stack);
    }
    if (!(bitmask & PARTIAL_COMPARE_FLAG)) {
      var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
          othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

      if (objIsWrapped || othIsWrapped) {
        var objUnwrapped = objIsWrapped ? object.value() : object,
            othUnwrapped = othIsWrapped ? other.value() : other;

        stack || (stack = new Stack());
        return equalFunc(objUnwrapped, othUnwrapped, customizer, bitmask, stack);
      }
    }
    if (!isSameTag) {
      return false;
    }
    stack || (stack = new Stack());
    return equalObjects(object, other, equalFunc, customizer, bitmask, stack);
  }

  /**
   * The base implementation of `_.isMatch` without support for iteratee shorthands.
   *
   * @private
   * @param {Object} object The object to inspect.
   * @param {Object} source The object of property values to match.
   * @param {Array} matchData The property names, values, and compare flags to match.
   * @param {Function} [customizer] The function to customize comparisons.
   * @returns {boolean} Returns `true` if `object` is a match, else `false`.
   */
  function baseIsMatch(object, source, matchData, customizer) {
    var index = matchData.length,
        length = index,
        noCustomizer = !customizer;

    if (object == null) {
      return !length;
    }
    object = Object(object);
    while (index--) {
      var data = matchData[index];
      if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
        return false;
      }
    }
    while (++index < length) {
      data = matchData[index];
      var key = data[0],
          objValue = object[key],
          srcValue = data[1];

      if (noCustomizer && data[2]) {
        if (objValue === undefined && !(key in object)) {
          return false;
        }
      } else {
        var stack = new Stack();
        if (customizer) {
          var result = customizer(objValue, srcValue, key, object, source, stack);
        }
        if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, UNORDERED_COMPARE_FLAG | PARTIAL_COMPARE_FLAG, stack) : result)) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * The base implementation of `_.isNative` without bad shim checks.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a native function,
   *  else `false`.
   */
  function baseIsNative(value) {
    if (!isObject(value) || isMasked(value)) {
      return false;
    }
    var pattern = isFunction(value) || isHostObject(value) ? reIsNative : reIsHostCtor;
    return pattern.test(toSource(value));
  }

  /**
   * The base implementation of `_.isTypedArray` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   */
  function baseIsTypedArray(value) {
    return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objectToString.call(value)];
  }

  /**
   * The base implementation of `_.iteratee`.
   *
   * @private
   * @param {*} [value=_.identity] The value to convert to an iteratee.
   * @returns {Function} Returns the iteratee.
   */
  function baseIteratee(value) {
    // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
    // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
    if (typeof value == 'function') {
      return value;
    }
    if (value == null) {
      return identity;
    }
    if ((typeof value === 'undefined' ? 'undefined' : _typeof$4(value)) == 'object') {
      return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
    }
    return property(value);
  }

  /**
   * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeys(object) {
    if (!isPrototype(object)) {
      return nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty.call(object, key) && key != 'constructor') {
        result.push(key);
      }
    }
    return result;
  }

  /**
   * The base implementation of `_.matches` which doesn't clone `source`.
   *
   * @private
   * @param {Object} source The object of property values to match.
   * @returns {Function} Returns the new spec function.
   */
  function baseMatches(source) {
    var matchData = getMatchData(source);
    if (matchData.length == 1 && matchData[0][2]) {
      return matchesStrictComparable(matchData[0][0], matchData[0][1]);
    }
    return function (object) {
      return object === source || baseIsMatch(object, source, matchData);
    };
  }

  /**
   * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
   *
   * @private
   * @param {string} path The path of the property to get.
   * @param {*} srcValue The value to match.
   * @returns {Function} Returns the new spec function.
   */
  function baseMatchesProperty(path, srcValue) {
    if (isKey(path) && isStrictComparable(srcValue)) {
      return matchesStrictComparable(toKey(path), srcValue);
    }
    return function (object) {
      var objValue = get(object, path);
      return objValue === undefined && objValue === srcValue ? hasIn(object, path) : baseIsEqual(srcValue, objValue, undefined, UNORDERED_COMPARE_FLAG | PARTIAL_COMPARE_FLAG);
    };
  }

  /**
   * A specialized version of `baseProperty` which supports deep paths.
   *
   * @private
   * @param {Array|string} path The path of the property to get.
   * @returns {Function} Returns the new accessor function.
   */
  function basePropertyDeep(path) {
    return function (object) {
      return baseGet(object, path);
    };
  }

  /**
   * The base implementation of `_.toString` which doesn't convert nullish
   * values to empty strings.
   *
   * @private
   * @param {*} value The value to process.
   * @returns {string} Returns the string.
   */
  function baseToString(value) {
    // Exit early for strings to avoid a performance hit in some environments.
    if (typeof value == 'string') {
      return value;
    }
    if (isSymbol(value)) {
      return symbolToString ? symbolToString.call(value) : '';
    }
    var result = value + '';
    return result == '0' && 1 / value == -INFINITY ? '-0' : result;
  }

  /**
   * Casts `value` to a path array if it's not one.
   *
   * @private
   * @param {*} value The value to inspect.
   * @returns {Array} Returns the cast property path array.
   */
  function castPath(value) {
    return isArray(value) ? value : stringToPath(value);
  }

  /**
   * A specialized version of `baseIsEqualDeep` for arrays with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Array} array The array to compare.
   * @param {Array} other The other array to compare.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Function} customizer The function to customize comparisons.
   * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
   *  for more details.
   * @param {Object} stack Tracks traversed `array` and `other` objects.
   * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
   */
  function equalArrays(array, other, equalFunc, customizer, bitmask, stack) {
    var isPartial = bitmask & PARTIAL_COMPARE_FLAG,
        arrLength = array.length,
        othLength = other.length;

    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
      return false;
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(array);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var index = -1,
        result = true,
        seen = bitmask & UNORDERED_COMPARE_FLAG ? new SetCache() : undefined;

    stack.set(array, other);
    stack.set(other, array);

    // Ignore non-index properties.
    while (++index < arrLength) {
      var arrValue = array[index],
          othValue = other[index];

      if (customizer) {
        var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
      }
      if (compared !== undefined) {
        if (compared) {
          continue;
        }
        result = false;
        break;
      }
      // Recursively compare arrays (susceptible to call stack limits).
      if (seen) {
        if (!arraySome(other, function (othValue, othIndex) {
          if (!seen.has(othIndex) && (arrValue === othValue || equalFunc(arrValue, othValue, customizer, bitmask, stack))) {
            return seen.add(othIndex);
          }
        })) {
          result = false;
          break;
        }
      } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, bitmask, stack))) {
        result = false;
        break;
      }
    }
    stack['delete'](array);
    stack['delete'](other);
    return result;
  }

  /**
   * A specialized version of `baseIsEqualDeep` for comparing objects of
   * the same `toStringTag`.
   *
   * **Note:** This function only supports comparing values with tags of
   * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {string} tag The `toStringTag` of the objects to compare.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Function} customizer The function to customize comparisons.
   * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
   *  for more details.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalByTag(object, other, tag, equalFunc, customizer, bitmask, stack) {
    switch (tag) {
      case dataViewTag:
        if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
          return false;
        }
        object = object.buffer;
        other = other.buffer;

      case arrayBufferTag:
        if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
          return false;
        }
        return true;

      case boolTag:
      case dateTag:
      case numberTag:
        // Coerce booleans to `1` or `0` and dates to milliseconds.
        // Invalid dates are coerced to `NaN`.
        return eq(+object, +other);

      case errorTag:
        return object.name == other.name && object.message == other.message;

      case regexpTag:
      case stringTag:
        // Coerce regexes to strings and treat strings, primitives and objects,
        // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
        // for more details.
        return object == other + '';

      case mapTag:
        var convert = mapToArray;

      case setTag:
        var isPartial = bitmask & PARTIAL_COMPARE_FLAG;
        convert || (convert = setToArray);

        if (object.size != other.size && !isPartial) {
          return false;
        }
        // Assume cyclic values are equal.
        var stacked = stack.get(object);
        if (stacked) {
          return stacked == other;
        }
        bitmask |= UNORDERED_COMPARE_FLAG;

        // Recursively compare objects (susceptible to call stack limits).
        stack.set(object, other);
        var result = equalArrays(convert(object), convert(other), equalFunc, customizer, bitmask, stack);
        stack['delete'](object);
        return result;

      case symbolTag:
        if (symbolValueOf) {
          return symbolValueOf.call(object) == symbolValueOf.call(other);
        }
    }
    return false;
  }

  /**
   * A specialized version of `baseIsEqualDeep` for objects with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Function} customizer The function to customize comparisons.
   * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
   *  for more details.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalObjects(object, other, equalFunc, customizer, bitmask, stack) {
    var isPartial = bitmask & PARTIAL_COMPARE_FLAG,
        objProps = keys(object),
        objLength = objProps.length,
        othProps = keys(other),
        othLength = othProps.length;

    if (objLength != othLength && !isPartial) {
      return false;
    }
    var index = objLength;
    while (index--) {
      var key = objProps[index];
      if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
        return false;
      }
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(object);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var result = true;
    stack.set(object, other);
    stack.set(other, object);

    var skipCtor = isPartial;
    while (++index < objLength) {
      key = objProps[index];
      var objValue = object[key],
          othValue = other[key];

      if (customizer) {
        var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
      }
      // Recursively compare objects (susceptible to call stack limits).
      if (!(compared === undefined ? objValue === othValue || equalFunc(objValue, othValue, customizer, bitmask, stack) : compared)) {
        result = false;
        break;
      }
      skipCtor || (skipCtor = key == 'constructor');
    }
    if (result && !skipCtor) {
      var objCtor = object.constructor,
          othCtor = other.constructor;

      // Non `Object` object instances with different constructors are not equal.
      if (objCtor != othCtor && 'constructor' in object && 'constructor' in other && !(typeof objCtor == 'function' && objCtor instanceof objCtor && typeof othCtor == 'function' && othCtor instanceof othCtor)) {
        result = false;
      }
    }
    stack['delete'](object);
    stack['delete'](other);
    return result;
  }

  /**
   * Gets the data for `map`.
   *
   * @private
   * @param {Object} map The map to query.
   * @param {string} key The reference key.
   * @returns {*} Returns the map data.
   */
  function getMapData(map, key) {
    var data = map.__data__;
    return isKeyable(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
  }

  /**
   * Gets the property names, values, and compare flags of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the match data of `object`.
   */
  function getMatchData(object) {
    var result = keys(object),
        length = result.length;

    while (length--) {
      var key = result[length],
          value = object[key];

      result[length] = [key, value, isStrictComparable(value)];
    }
    return result;
  }

  /**
   * Gets the native function at `key` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the method to get.
   * @returns {*} Returns the function if it's native, else `undefined`.
   */
  function getNative(object, key) {
    var value = getValue(object, key);
    return baseIsNative(value) ? value : undefined;
  }

  /**
   * Gets the `toStringTag` of `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  var getTag = baseGetTag;

  // Fallback for data views, maps, sets, and weak maps in IE 11,
  // for data views in Edge < 14, and promises in Node.js.
  if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map && getTag(new Map()) != mapTag || Promise && getTag(Promise.resolve()) != promiseTag || Set && getTag(new Set()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
    getTag = function getTag(value) {
      var result = objectToString.call(value),
          Ctor = result == objectTag ? value.constructor : undefined,
          ctorString = Ctor ? toSource(Ctor) : undefined;

      if (ctorString) {
        switch (ctorString) {
          case dataViewCtorString:
            return dataViewTag;
          case mapCtorString:
            return mapTag;
          case promiseCtorString:
            return promiseTag;
          case setCtorString:
            return setTag;
          case weakMapCtorString:
            return weakMapTag;
        }
      }
      return result;
    };
  }

  /**
   * Checks if `path` exists on `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array|string} path The path to check.
   * @param {Function} hasFunc The function to check properties.
   * @returns {boolean} Returns `true` if `path` exists, else `false`.
   */
  function hasPath(object, path, hasFunc) {
    path = isKey(path, object) ? [path] : castPath(path);

    var result,
        index = -1,
        length = path.length;

    while (++index < length) {
      var key = toKey(path[index]);
      if (!(result = object != null && hasFunc(object, key))) {
        break;
      }
      object = object[key];
    }
    if (result) {
      return result;
    }
    var length = object ? object.length : 0;
    return !!length && isLength(length) && isIndex(key, length) && (isArray(object) || isArguments(object));
  }

  /**
   * Checks if `value` is a valid array-like index.
   *
   * @private
   * @param {*} value The value to check.
   * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
   */
  function isIndex(value, length) {
    length = length == null ? MAX_SAFE_INTEGER : length;
    return !!length && (typeof value == 'number' || reIsUint.test(value)) && value > -1 && value % 1 == 0 && value < length;
  }

  /**
   * Checks if `value` is a property name and not a property path.
   *
   * @private
   * @param {*} value The value to check.
   * @param {Object} [object] The object to query keys on.
   * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
   */
  function isKey(value, object) {
    if (isArray(value)) {
      return false;
    }
    var type = typeof value === 'undefined' ? 'undefined' : _typeof$4(value);
    if (type == 'number' || type == 'symbol' || type == 'boolean' || value == null || isSymbol(value)) {
      return true;
    }
    return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
  }

  /**
   * Checks if `value` is suitable for use as unique object key.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
   */
  function isKeyable(value) {
    var type = typeof value === 'undefined' ? 'undefined' : _typeof$4(value);
    return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
  }

  /**
   * Checks if `func` has its source masked.
   *
   * @private
   * @param {Function} func The function to check.
   * @returns {boolean} Returns `true` if `func` is masked, else `false`.
   */
  function isMasked(func) {
    return !!maskSrcKey && maskSrcKey in func;
  }

  /**
   * Checks if `value` is likely a prototype object.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
   */
  function isPrototype(value) {
    var Ctor = value && value.constructor,
        proto = typeof Ctor == 'function' && Ctor.prototype || objectProto;

    return value === proto;
  }

  /**
   * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` if suitable for strict
   *  equality comparisons, else `false`.
   */
  function isStrictComparable(value) {
    return value === value && !isObject(value);
  }

  /**
   * A specialized version of `matchesProperty` for source values suitable
   * for strict equality comparisons, i.e. `===`.
   *
   * @private
   * @param {string} key The key of the property to get.
   * @param {*} srcValue The value to match.
   * @returns {Function} Returns the new spec function.
   */
  function matchesStrictComparable(key, srcValue) {
    return function (object) {
      if (object == null) {
        return false;
      }
      return object[key] === srcValue && (srcValue !== undefined || key in Object(object));
    };
  }

  /**
   * Converts `string` to a property path array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the property path array.
   */
  var stringToPath = memoize(function (string) {
    string = toString(string);

    var result = [];
    if (reLeadingDot.test(string)) {
      result.push('');
    }
    string.replace(rePropName, function (match, number, quote, string) {
      result.push(quote ? string.replace(reEscapeChar, '$1') : number || match);
    });
    return result;
  });

  /**
   * Converts `value` to a string key if it's not a string or symbol.
   *
   * @private
   * @param {*} value The value to inspect.
   * @returns {string|symbol} Returns the key.
   */
  function toKey(value) {
    if (typeof value == 'string' || isSymbol(value)) {
      return value;
    }
    var result = value + '';
    return result == '0' && 1 / value == -INFINITY ? '-0' : result;
  }

  /**
   * Converts `func` to its source code.
   *
   * @private
   * @param {Function} func The function to process.
   * @returns {string} Returns the source code.
   */
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString.call(func);
      } catch (e) {}
      try {
        return func + '';
      } catch (e) {}
    }
    return '';
  }

  /**
   * This method is like `_.find` except that it returns the index of the first
   * element `predicate` returns truthy for instead of the element itself.
   *
   * @static
   * @memberOf _
   * @since 1.1.0
   * @category Array
   * @param {Array} array The array to inspect.
   * @param {Function} [predicate=_.identity]
   *  The function invoked per iteration.
   * @param {number} [fromIndex=0] The index to search from.
   * @returns {number} Returns the index of the found element, else `-1`.
   * @example
   *
   * var users = [
   *   { 'user': 'barney',  'active': false },
   *   { 'user': 'fred',    'active': false },
   *   { 'user': 'pebbles', 'active': true }
   * ];
   *
   * _.findIndex(users, function(o) { return o.user == 'barney'; });
   * // => 0
   *
   * // The `_.matches` iteratee shorthand.
   * _.findIndex(users, { 'user': 'fred', 'active': false });
   * // => 1
   *
   * // The `_.matchesProperty` iteratee shorthand.
   * _.findIndex(users, ['active', false]);
   * // => 0
   *
   * // The `_.property` iteratee shorthand.
   * _.findIndex(users, 'active');
   * // => 2
   */
  function findIndex(array, predicate, fromIndex) {
    var length = array ? array.length : 0;
    if (!length) {
      return -1;
    }
    var index = fromIndex == null ? 0 : toInteger(fromIndex);
    if (index < 0) {
      index = nativeMax(length + index, 0);
    }
    return baseFindIndex(array, baseIteratee(predicate, 3), index);
  }

  /**
   * Creates a function that memoizes the result of `func`. If `resolver` is
   * provided, it determines the cache key for storing the result based on the
   * arguments provided to the memoized function. By default, the first argument
   * provided to the memoized function is used as the map cache key. The `func`
   * is invoked with the `this` binding of the memoized function.
   *
   * **Note:** The cache is exposed as the `cache` property on the memoized
   * function. Its creation may be customized by replacing the `_.memoize.Cache`
   * constructor with one whose instances implement the
   * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
   * method interface of `delete`, `get`, `has`, and `set`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Function
   * @param {Function} func The function to have its output memoized.
   * @param {Function} [resolver] The function to resolve the cache key.
   * @returns {Function} Returns the new memoized function.
   * @example
   *
   * var object = { 'a': 1, 'b': 2 };
   * var other = { 'c': 3, 'd': 4 };
   *
   * var values = _.memoize(_.values);
   * values(object);
   * // => [1, 2]
   *
   * values(other);
   * // => [3, 4]
   *
   * object.a = 2;
   * values(object);
   * // => [1, 2]
   *
   * // Modify the result cache.
   * values.cache.set(object, ['a', 'b']);
   * values(object);
   * // => ['a', 'b']
   *
   * // Replace `_.memoize.Cache`.
   * _.memoize.Cache = WeakMap;
   */
  function memoize(func, resolver) {
    if (typeof func != 'function' || resolver && typeof resolver != 'function') {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    var memoized = function memoized() {
      var args = arguments,
          key = resolver ? resolver.apply(this, args) : args[0],
          cache = memoized.cache;

      if (cache.has(key)) {
        return cache.get(key);
      }
      var result = func.apply(this, args);
      memoized.cache = cache.set(key, result);
      return result;
    };
    memoized.cache = new (memoize.Cache || MapCache)();
    return memoized;
  }

  // Assign cache to `_.memoize`.
  memoize.Cache = MapCache;

  /**
   * Performs a
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * comparison between two values to determine if they are equivalent.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   * @example
   *
   * var object = { 'a': 1 };
   * var other = { 'a': 1 };
   *
   * _.eq(object, object);
   * // => true
   *
   * _.eq(object, other);
   * // => false
   *
   * _.eq('a', 'a');
   * // => true
   *
   * _.eq('a', Object('a'));
   * // => false
   *
   * _.eq(NaN, NaN);
   * // => true
   */
  function eq(value, other) {
    return value === other || value !== value && other !== other;
  }

  /**
   * Checks if `value` is likely an `arguments` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   *  else `false`.
   * @example
   *
   * _.isArguments(function() { return arguments; }());
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  function isArguments(value) {
    // Safari 8.1 makes `arguments.callee` enumerable in strict mode.
    return isArrayLikeObject(value) && hasOwnProperty.call(value, 'callee') && (!propertyIsEnumerable.call(value, 'callee') || objectToString.call(value) == argsTag);
  }

  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(document.body.children);
   * // => false
   *
   * _.isArray('abc');
   * // => false
   *
   * _.isArray(_.noop);
   * // => false
   */
  var isArray = Array.isArray;

  /**
   * Checks if `value` is array-like. A value is considered array-like if it's
   * not a function and has a `value.length` that's an integer greater than or
   * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
   * @example
   *
   * _.isArrayLike([1, 2, 3]);
   * // => true
   *
   * _.isArrayLike(document.body.children);
   * // => true
   *
   * _.isArrayLike('abc');
   * // => true
   *
   * _.isArrayLike(_.noop);
   * // => false
   */
  function isArrayLike(value) {
    return value != null && isLength(value.length) && !isFunction(value);
  }

  /**
   * This method is like `_.isArrayLike` except that it also checks if `value`
   * is an object.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array-like object,
   *  else `false`.
   * @example
   *
   * _.isArrayLikeObject([1, 2, 3]);
   * // => true
   *
   * _.isArrayLikeObject(document.body.children);
   * // => true
   *
   * _.isArrayLikeObject('abc');
   * // => false
   *
   * _.isArrayLikeObject(_.noop);
   * // => false
   */
  function isArrayLikeObject(value) {
    return isObjectLike(value) && isArrayLike(value);
  }

  /**
   * Checks if `value` is classified as a `Function` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   *
   * _.isFunction(/abc/);
   * // => false
   */
  function isFunction(value) {
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 8-9 which returns 'object' for typed array and other constructors.
    var tag = isObject(value) ? objectToString.call(value) : '';
    return tag == funcTag || tag == genTag;
  }

  /**
   * Checks if `value` is a valid array-like length.
   *
   * **Note:** This method is loosely based on
   * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
   * @example
   *
   * _.isLength(3);
   * // => true
   *
   * _.isLength(Number.MIN_VALUE);
   * // => false
   *
   * _.isLength(Infinity);
   * // => false
   *
   * _.isLength('3');
   * // => false
   */
  function isLength(value) {
    return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
  }

  /**
   * Checks if `value` is the
   * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
   * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(_.noop);
   * // => true
   *
   * _.isObject(null);
   * // => false
   */
  function isObject(value) {
    var type = typeof value === 'undefined' ? 'undefined' : _typeof$4(value);
    return !!value && (type == 'object' || type == 'function');
  }

  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof$4(value)) == 'object';
  }

  /**
   * Checks if `value` is classified as a `Symbol` primitive or object.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
   * @example
   *
   * _.isSymbol(Symbol.iterator);
   * // => true
   *
   * _.isSymbol('abc');
   * // => false
   */
  function isSymbol(value) {
    return (typeof value === 'undefined' ? 'undefined' : _typeof$4(value)) == 'symbol' || isObjectLike(value) && objectToString.call(value) == symbolTag;
  }

  /**
   * Checks if `value` is classified as a typed array.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   * @example
   *
   * _.isTypedArray(new Uint8Array);
   * // => true
   *
   * _.isTypedArray([]);
   * // => false
   */
  var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

  /**
   * Converts `value` to a finite number.
   *
   * @static
   * @memberOf _
   * @since 4.12.0
   * @category Lang
   * @param {*} value The value to convert.
   * @returns {number} Returns the converted number.
   * @example
   *
   * _.toFinite(3.2);
   * // => 3.2
   *
   * _.toFinite(Number.MIN_VALUE);
   * // => 5e-324
   *
   * _.toFinite(Infinity);
   * // => 1.7976931348623157e+308
   *
   * _.toFinite('3.2');
   * // => 3.2
   */
  function toFinite(value) {
    if (!value) {
      return value === 0 ? value : 0;
    }
    value = toNumber(value);
    if (value === INFINITY || value === -INFINITY) {
      var sign = value < 0 ? -1 : 1;
      return sign * MAX_INTEGER;
    }
    return value === value ? value : 0;
  }

  /**
   * Converts `value` to an integer.
   *
   * **Note:** This method is loosely based on
   * [`ToInteger`](http://www.ecma-international.org/ecma-262/7.0/#sec-tointeger).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to convert.
   * @returns {number} Returns the converted integer.
   * @example
   *
   * _.toInteger(3.2);
   * // => 3
   *
   * _.toInteger(Number.MIN_VALUE);
   * // => 0
   *
   * _.toInteger(Infinity);
   * // => 1.7976931348623157e+308
   *
   * _.toInteger('3.2');
   * // => 3
   */
  function toInteger(value) {
    var result = toFinite(value),
        remainder = result % 1;

    return result === result ? remainder ? result - remainder : result : 0;
  }

  /**
   * Converts `value` to a number.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to process.
   * @returns {number} Returns the number.
   * @example
   *
   * _.toNumber(3.2);
   * // => 3.2
   *
   * _.toNumber(Number.MIN_VALUE);
   * // => 5e-324
   *
   * _.toNumber(Infinity);
   * // => Infinity
   *
   * _.toNumber('3.2');
   * // => 3.2
   */
  function toNumber(value) {
    if (typeof value == 'number') {
      return value;
    }
    if (isSymbol(value)) {
      return NAN;
    }
    if (isObject(value)) {
      var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
      value = isObject(other) ? other + '' : other;
    }
    if (typeof value != 'string') {
      return value === 0 ? value : +value;
    }
    value = value.replace(reTrim, '');
    var isBinary = reIsBinary.test(value);
    return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
  }

  /**
   * Converts `value` to a string. An empty string is returned for `null`
   * and `undefined` values. The sign of `-0` is preserved.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to process.
   * @returns {string} Returns the string.
   * @example
   *
   * _.toString(null);
   * // => ''
   *
   * _.toString(-0);
   * // => '-0'
   *
   * _.toString([1, 2, 3]);
   * // => '1,2,3'
   */
  function toString(value) {
    return value == null ? '' : baseToString(value);
  }

  /**
   * Gets the value at `path` of `object`. If the resolved value is
   * `undefined`, the `defaultValue` is returned in its place.
   *
   * @static
   * @memberOf _
   * @since 3.7.0
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @param {*} [defaultValue] The value returned for `undefined` resolved values.
   * @returns {*} Returns the resolved value.
   * @example
   *
   * var object = { 'a': [{ 'b': { 'c': 3 } }] };
   *
   * _.get(object, 'a[0].b.c');
   * // => 3
   *
   * _.get(object, ['a', '0', 'b', 'c']);
   * // => 3
   *
   * _.get(object, 'a.b.c', 'default');
   * // => 'default'
   */
  function get(object, path, defaultValue) {
    var result = object == null ? undefined : baseGet(object, path);
    return result === undefined ? defaultValue : result;
  }

  /**
   * Checks if `path` is a direct or inherited property of `object`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path to check.
   * @returns {boolean} Returns `true` if `path` exists, else `false`.
   * @example
   *
   * var object = _.create({ 'a': _.create({ 'b': 2 }) });
   *
   * _.hasIn(object, 'a');
   * // => true
   *
   * _.hasIn(object, 'a.b');
   * // => true
   *
   * _.hasIn(object, ['a', 'b']);
   * // => true
   *
   * _.hasIn(object, 'b');
   * // => false
   */
  function hasIn(object, path) {
    return object != null && hasPath(object, path, baseHasIn);
  }

  /**
   * Creates an array of the own enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects. See the
   * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * for more details.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keys(new Foo);
   * // => ['a', 'b'] (iteration order is not guaranteed)
   *
   * _.keys('hi');
   * // => ['0', '1']
   */
  function keys(object) {
    return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
  }

  /**
   * This method returns the first argument it receives.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Util
   * @param {*} value Any value.
   * @returns {*} Returns `value`.
   * @example
   *
   * var object = { 'a': 1 };
   *
   * console.log(_.identity(object) === object);
   * // => true
   */
  function identity(value) {
    return value;
  }

  /**
   * Creates a function that returns the value at `path` of a given object.
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Util
   * @param {Array|string} path The path of the property to get.
   * @returns {Function} Returns the new accessor function.
   * @example
   *
   * var objects = [
   *   { 'a': { 'b': 2 } },
   *   { 'a': { 'b': 1 } }
   * ];
   *
   * _.map(objects, _.property('a.b'));
   * // => [2, 1]
   *
   * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
   * // => [1, 2]
   */
  function property(path) {
    return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
  }

  module.exports = findIndex;
});

var shallowDiffCoords = function shallowDiffCoords(coords1, coords2) {
  if (isEqual(coords1, coords2)) return true;

  var _coords1$toArray = coords1.toArray(),
      x1 = _coords1$toArray[0],
      y1 = _coords1$toArray[1];

  var _coords2$toArray = coords2.toArray(),
      x2 = _coords2$toArray[0],
      y2 = _coords2$toArray[1];

  var xLen = getCoordsMaxLen(x1, x2);
  x1 = x1.toFixed(xLen);
  x2 = x2.toFixed(xLen);
  var yLen = getCoordsMaxLen(y1, y2);
  y1 = y1.toFixed(yLen);
  y2 = y2.toFixed(yLen);
  return x1 === x2 && y1 === y2;
};

var getCoordsMaxLen = function getCoordsMaxLen(p1, p2) {
  var len1 = getDecimalsLen(p1);
  var len2 = getDecimalsLen(p2);
  var safeLen = Math.max(len1, len2) - 3;
  return Math.max(safeLen, 0);
};

var getDecimalsLen = function getDecimalsLen(num) {
  var str = num.toString();
  var decimals = str.split('.')[1];
  return decimals.length;
};

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

var options = {
  layers: [],
  mode: 'auto',
  distance: 10,
  shellPoints: 60,
  needCtrl: false
};

var cursorLayerName = INTERNAL_LAYER_PREFIX + 'cxiaof_autoadsorb';

var Autoadsorb = function (_maptalks$Class) {
  _inherits(Autoadsorb, _maptalks$Class);

  function Autoadsorb(options) {
    _classCallCheck(this, Autoadsorb);

    var _this = _possibleConstructorReturn(this, _maptalks$Class.call(this, options));

    _this._isEnable = false;
    _this._treePoints = geojsonRbush_1();
    _this._treeLines = geojsonRbush_1();
    return _this;
  }

  Autoadsorb.prototype.setMode = function setMode(mode) {
    this.options['mode'] = mode;
    this._updateGeosSet();
    return this;
  };

  Autoadsorb.prototype.getMode = function getMode() {
    return this.options['mode'];
  };

  Autoadsorb.prototype.setDistance = function setDistance(distance) {
    this.options['distance'] = distance;
    this._updateGeosSet();
    return this;
  };

  Autoadsorb.prototype.getDistance = function getDistance() {
    return this.options['distance'];
  };

  Autoadsorb.prototype.refreshTargets = function refreshTargets() {
    this._updateGeosSet();
    return this;
  };

  Autoadsorb.prototype.isEnable = function isEnable() {
    return this._isEnable;
  };

  Autoadsorb.prototype.bindDrawTool = function bindDrawTool(drawTool) {
    if (drawTool instanceof DrawTool) {
      if (!this._map) this._addTo(drawTool.getMap());
      this._drawTool = drawTool;
      drawTool.on('enable', this._enable, this);
      drawTool.on('disable remove', this._disable, this);
      if (drawTool.isEnabled()) this._enable();
    }
    return this;
  };

  Autoadsorb.prototype.bindGeometry = function bindGeometry(geometry) {
    if (geometry instanceof Geometry) {
      if (!this._map) this._addTo(drawTool.getMap());
      this._disableMapTool();
      this._geometry = geometry;
      this._geometryCoords = geometry.getCoordinates();
      geometry.on('editstart', this._enable, this);
      geometry.on('editend remove', this._disable, this);
      if (geometry.isEditing()) this._enable();
    }
    return this;
  };

  Autoadsorb.prototype.remove = function remove() {
    this._disable();
    if (this._cursorLayer) this._cursorLayer.remove();
    delete this._treePoints;
    delete this._treeLines;
    delete this._cursorLayer;
    delete this._assistLayers;
    delete this._mousePoint;
    delete this._geosSetPoint;
    delete this._geosSetLine;
    delete this._cursor;
    delete this._adsorbPoint;
    delete this._drawTool;
    delete this._map;
  };

  Autoadsorb.prototype._addTo = function _addTo(map) {
    this._map = map;
    this._newCursorLayer();
    this._saveAdsorbLayers();
  };

  Autoadsorb.prototype._newCursorLayer = function _newCursorLayer() {
    this._cursorLayer = new VectorLayer(cursorLayerName, {
      style: { symbol: this._getCursorSymbol() }
    });
    this._cursorLayer.addTo(this._map).bringToFront();
  };

  Autoadsorb.prototype._getCursorSymbol = function _getCursorSymbol(symbol) {
    return Object.assign({
      markerType: 'ellipse',
      markerFill: '#fff',
      markerLineColor: '#272822',
      markerLineWidth: 2,
      markerWidth: 10,
      markerHeight: 10,
      opacity: 0.4
    }, symbol);
  };

  Autoadsorb.prototype._saveAdsorbLayers = function _saveAdsorbLayers() {
    var _this2 = this;

    this._assistLayers = [];
    this.options['layers'].forEach(function (layer) {
      if (typeof layer === 'string') {
        layer = _this2._map.getLayer(layer);
      }
      if (layer instanceof VectorLayer) {
        _this2._assistLayers.push(layer);
      }
    });
  };

  Autoadsorb.prototype._enable = function _enable() {
    this._isEnable = true;
    if (this._cursorLayer) this._cursorLayer.show();
    this._updateGeosSet();
    this._registerMapEvents();
    this._geometry ? this._registerGeometryEvents() : this._registerDrawToolEvents();
  };

  Autoadsorb.prototype._updateGeosSet = function _updateGeosSet() {
    this._geosSetPoint = [];
    this._geosSetLine = [];

    var geos = this._getAllAssistGeos();
    if (['auto', 'vertux'].includes(this.options['mode'])) {
      this._geosSetPoint = this._parseToPoints(geos);
    }
    if (['auto', 'border'].includes(this.options['mode'])) {
      this._geosSetLine = this._parseToLines(geos);
    }

    this._updateRBushTree();
  };

  Autoadsorb.prototype._getAllAssistGeos = function _getAllAssistGeos() {
    var assistGeos = this._assistLayers.reduce(function (target, layer) {
      return target.concat(layer.getGeometries());
    }, []);
    if (this._geometry) assistGeos = lodash_difference(assistGeos, [this._geometry]);
    return assistGeos;
  };

  Autoadsorb.prototype._parseToPoints = function _parseToPoints(geos) {
    var _this3 = this;

    var points = [];
    geos.forEach(function (geo) {
      if (geo instanceof GeometryCollection) {
        points = points.concat(explode(geo.toGeoJSON()).features);
      } else {
        if (geo instanceof Circle || geo instanceof Ellipse) {
          geo = geo.copy();
          geo.setOptions(Object.assign(geo.options || {}, {
            numberOfShellPoints: _this3.options['shellPoints']
          }));
          points.push(_this3._getCenterFeature(geo));
        }
        points = points.concat(explode(geo.toGeoJSON()).features);
      }
    });
    return points;
  };

  Autoadsorb.prototype._getCenterFeature = function _getCenterFeature(geo) {
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: geo.getCenter().toArray() },
      properties: {}
    };
  };

  Autoadsorb.prototype._parseToLines = function _parseToLines(geos) {
    var _this4 = this;

    var lines = [];
    geos = geos.filter(function (geo) {
      return !(geo instanceof Marker || geo instanceof MultiPoint);
    });
    geos.forEach(function (geo) {
      if (geo instanceof LineString) {
        lines.push(geo.toGeoJSON());
      } else if (geo instanceof MultiLineString) {
        lines = lines.concat(flatten(geo.toGeoJSON()).features);
      } else {
        if (geo instanceof Circle || geo instanceof Ellipse) {
          geo = geo.copy();
          geo.setOptions(Object.assign(geo.options || {}, {
            numberOfShellPoints: _this4.options['shellPoints']
          }));
        }
        lines = lines.concat(_this4._polygonToLine(geo.toGeoJSON()));
      }
    });
    return this._splitLines(lines);
  };

  Autoadsorb.prototype._polygonToLine = function _polygonToLine(feature) {
    var result = polygonToLine(feature);
    if (result.type === 'Feature') return flatten(result).features;
    return result.features.reduce(function (prev, cur) {
      return prev.concat(flatten(cur).features);
    }, []);
  };

  Autoadsorb.prototype._splitLines = function _splitLines(lines) {
    return lines.reduce(function (target, line) {
      var coords = line.geometry.coordinates;
      for (var i = 0; i < coords.length - 1; i++) {
        var coordinates = [coords[i], coords[i + 1]];
        target.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coordinates },
          properties: {}
        });
      }
      return target;
    }, []);
  };

  Autoadsorb.prototype._updateRBushTree = function _updateRBushTree() {
    this._treePoints.clear();
    this._treePoints.load({
      type: 'FeatureCollection',
      features: this._geosSetPoint
    });
    this._treeLines.clear();
    this._treeLines.load({
      type: 'FeatureCollection',
      features: this._geosSetLine
    });
  };

  Autoadsorb.prototype._registerMapEvents = function _registerMapEvents() {
    this._needFindGeometry = !this._geometry;
    this._map.on('mousedown', this._mapMousedown, this);
    this._map.on('mouseup', this._mapMouseup, this);
    this._map.on('mousemove', this._mapMousemove, this);
  };

  Autoadsorb.prototype._mapMousedown = function _mapMousedown() {
    if (this._geometry) this._needFindGeometry = true;
  };

  Autoadsorb.prototype._mapMouseup = function _mapMouseup() {
    if (this._geometry) this._needFindGeometry = false;
  };

  Autoadsorb.prototype._mapMousemove = function _mapMousemove(_ref) {
    var coordinate = _ref.coordinate,
        domEvent = _ref.domEvent;

    this._mousePoint = coordinate;

    if (this._cursor) {
      this._cursor.setCoordinates(coordinate);
    } else {
      this._cursor = new Marker(coordinate);
      this._cursor.addTo(this._cursorLayer);
    }

    delete this._adsorbPoint;
    if (this.options['needCtrl'] === domEvent.ctrlKey) {
      this._updateAdsorbPoint(coordinate);
    }
  };

  Autoadsorb.prototype._updateAdsorbPoint = function _updateAdsorbPoint(coordinate) {
    if (!this._needFindGeometry) {
      this._cursor.setSymbol(this._getCursorSymbol());
      return;
    }

    var availGeos = this._findGeometry(coordinate);
    if (availGeos.length > 0) {
      this._adsorbPoint = this._getAdsorbPoint(availGeos);
    }
    if (this._adsorbPoint) {
      var _adsorbPoint = this._adsorbPoint,
          x = _adsorbPoint.x,
          y = _adsorbPoint.y;

      this._cursor.setCoordinates([x, y]);
    } else {
      this._cursor.setSymbol(this._getCursorSymbol());
    }
  };

  Autoadsorb.prototype._findGeometry = function _findGeometry(coordinate) {
    var features = [];
    if (this._geosSetPoint.length > 0) {
      var geos = this._findAvailGeos(this._treePoints, coordinate);
      features = features.concat(geos);
    }
    if (this._geosSetLine.length > 0) {
      var _geos = this._findAvailGeos(this._treeLines, coordinate);
      features = features.concat(_geos);
    }
    return features;
  };

  Autoadsorb.prototype._findAvailGeos = function _findAvailGeos(tree, coordinate) {
    var inspectExtent = this._createInspectExtent(coordinate);
    var availGeos = tree.search(inspectExtent);
    return availGeos.features;
  };

  Autoadsorb.prototype._createInspectExtent = function _createInspectExtent(coordinate) {
    var radius = this._map.pixelToDistance(0, this.options['distance']);
    var circle = new Circle(coordinate, radius, {
      properties: {},
      numberOfShellPoints: this.options['shellPoints']
    });
    return circle.toGeoJSON();
  };

  Autoadsorb.prototype._getAdsorbPoint = function _getAdsorbPoint(features) {
    var nearestFeature = void 0;
    var mousePoint = [this._mousePoint.x, this._mousePoint.y];
    var points = features.filter(function (feature) {
      return feature.geometry.type === 'Point';
    });
    if (points.length > 0) {
      nearestFeature = this._getNearestPoint(mousePoint, points);
      this._cursor.setSymbol(this._getCursorSymbol({
        markerFill: '#f5871f',
        markerLineColor: '#0078a8',
        opacity: 1
      }));
    } else {
      var lines = features.filter(function (feature) {
        return feature.geometry.type === 'LineString';
      });
      nearestFeature = this._getNearestPointOnLine(mousePoint, lines);
      this._cursor.setSymbol(this._getCursorSymbol({ markerLineColor: '#0078a8', opacity: 1 }));
    }
    var _nearestFeature$geome = nearestFeature.geometry.coordinates,
        x = _nearestFeature$geome[0],
        y = _nearestFeature$geome[1];

    return { x: x, y: y };
  };

  Autoadsorb.prototype._getNearestPoint = function _getNearestPoint(mousePoint, features) {
    return nearestPoint(mousePoint, { type: 'FeatureCollection', features: features });
  };

  Autoadsorb.prototype._getNearestPointOnLine = function _getNearestPointOnLine(mousePoint, features) {
    var multiLines = combine({ type: 'FeatureCollection', features: features });
    return nearestPointOnLine(multiLines, mousePoint);
  };

  Autoadsorb.prototype._registerGeometryEvents = function _registerGeometryEvents() {
    this._dragCenterHandle = null;
    this._geometry.on('handledragend', this._checkCenter, this);
    this._geometry.on('shapechange', this._setShadowCoordinates, this);
    this._geometry.on('editrecord', this._resetShadowCenter, this);
  };

  Autoadsorb.prototype._checkCenter = function _checkCenter() {
    this._dragCenterHandle = !this._shapechange;
  };

  Autoadsorb.prototype._setShadowCoordinates = function _setShadowCoordinates(e) {
    this._shapechange = true;
    if (!this._adsorbPoint) return;
    var geometry = e.target;
    if (geometry instanceof Circle) {
      this._setShadowCircle(geometry);
    } else if (geometry instanceof Ellipse) {
      this._setShadowEllipse(geometry);
    } else {
      if (this._draggingCenter()) return;
      if (geometry instanceof LineString) {
        this._setShadowLineString(geometry);
      } else {
        this._setShadowPolygon(geometry);
      }
    }
  };

  Autoadsorb.prototype._draggingCenter = function _draggingCenter() {
    return !(this._dragCenterHandle === null || Util.isNil(this._dragCenterHandle));
  };

  Autoadsorb.prototype._setShadowCircle = function _setShadowCircle(geo) {
    var radius = this._calcCircleRadius(geo);
    geo._editor._shadow.setRadius(radius);
  };

  Autoadsorb.prototype._calcCircleRadius = function _calcCircleRadius(geo) {
    var coords = geo.getCoordinates();
    return this._map.getProjection().measureLength([coords, this._adsorbPoint]);
  };

  Autoadsorb.prototype._setShadowEllipse = function _setShadowEllipse(geo) {
    var _calcEllipseSize2 = this._calcEllipseSize(geo),
        width = _calcEllipseSize2[0],
        height = _calcEllipseSize2[1];

    geo._editor._shadow.setWidth(width).setHeight(height);
  };

  Autoadsorb.prototype._calcEllipseSize = function _calcEllipseSize(geo) {
    var coords = geo.getCoordinates();
    var _adsorbPoint2 = this._adsorbPoint,
        x = _adsorbPoint2.x,
        y = _adsorbPoint2.y;

    var width = this._map.getProjection().measureLength([coords, { x: x, y: coords.y }]);
    var height = this._map.getProjection().measureLength([coords, { x: coords.x, y: y }]);
    return [width * 2, height * 2];
  };

  Autoadsorb.prototype._setShadowLineString = function _setShadowLineString(geo) {
    var coords = geo.getCoordinates();
    var coordsOld = this._geometryCoords;
    var diffs = lodash_differencewith(coords, coordsOld, shallowDiffCoords);
    if (diffs.length === 0) return;
    var coordsIndex = lodash_findindex(coords, diffs[0]);
    coords[coordsIndex] = this._adsorbPoint;
    geo._editor._shadow.setCoordinates(coords);
  };

  Autoadsorb.prototype._setShadowPolygon = function _setShadowPolygon(geo) {
    var coords = geo.getCoordinates();
    if (coords.length > 1) return this._setShadowPolygonWithHoles(geo);
    var _geometryCoords = this._geometryCoords,
        coordsOld0 = _geometryCoords[0];

    var coords0 = coords[0];
    var diffs = lodash_differencewith(coords0, coordsOld0, shallowDiffCoords);
    if (diffs.length === 0) return;
    var coordsIndex = lodash_findindex(coords0, diffs[0]);
    coords[0][coordsIndex] = this._adsorbPoint;
    if (coordsIndex === 0) coords[0][coords0.length - 1] = this._adsorbPoint;
    geo._editor._shadow.setCoordinates(coords);
  };

  Autoadsorb.prototype._setShadowPolygonWithHoles = function _setShadowPolygonWithHoles(geo) {
    console.log(geo);
  };

  Autoadsorb.prototype._resetShadowCenter = function _resetShadowCenter(e) {
    delete this._shapechange;
    var geometry = e.target;
    if (this._adsorbPoint) {
      if (geometry instanceof Marker) {
        geometry.setCoordinates(this._adsorbPoint);
      } else {
        if (this._dragCenterHandle) {
          var _geometry$_editor$_sh;

          var center = geometry.getCenter();
          var point = this._adsorbPoint;
          var offset = [point.x - center.x, point.y - center.y];
          geometry.translate.apply(geometry, offset);
          (_geometry$_editor$_sh = geometry._editor._shadow).translate.apply(_geometry$_editor$_sh, offset);
        }
      }
    }
    this._geometryCoords = geometry.getCoordinates();
    delete this._dragCenterHandle;
  };

  Autoadsorb.prototype._registerDrawToolEvents = function _registerDrawToolEvents() {
    this._drawTool.on('drawstart drawvertex', this._resetCoordsAndPoint, this);
    this._drawTool.on('mousemove drawend', this._resetCoordinates, this);
  };

  Autoadsorb.prototype._resetCoordsAndPoint = function _resetCoordsAndPoint(e) {
    this._resetCoordinates(e);
    this._resetClickPoint(e);
  };

  Autoadsorb.prototype._resetCoordinates = function _resetCoordinates(e) {
    if (!this._adsorbPoint) return;
    var _e$target = e.target,
        mode = _e$target.options.mode,
        geometry = _e$target._geometry;

    switch (mode) {
      case 'Point':
        geometry.setCoordinates(this._adsorbPoint);
        break;
      case 'Rectangle':
        this._resetRectangle(geometry, e);
        break;
      case 'Circle':
        e.type === 'drawstart' ? geometry.setCoordinates(this._adsorbPoint) : this._resetCircle(geometry);
        break;
      case 'Ellipse':
        e.type === 'drawstart' ? geometry.setCoordinates(this._adsorbPoint) : this._resetEllipse(geometry);
        break;
      default:
        this._resetCommon(geometry);
        break;
    }
  };

  Autoadsorb.prototype._resetRectangle = function _resetRectangle(geo, e) {
    var coords = geo.getCoordinates();
    var _adsorbPoint3 = this._adsorbPoint,
        x = _adsorbPoint3.x,
        y = _adsorbPoint3.y;

    if (coords[0].length === 0) {
      var point = this._map.coordinateToPoint(this._adsorbPoint);
      e.geometry._firstClick = this._map._pointToPrj(point);
    } else {
      coords[0][1].x = x;
      coords[0][2].x = x;
      coords[0][2].y = y;
      coords[0][3].y = y;
      geo.setCoordinates(coords);
    }
  };

  Autoadsorb.prototype._resetCircle = function _resetCircle(geo) {
    var radius = this._calcCircleRadius(geo);
    geo.setRadius(radius);
  };

  Autoadsorb.prototype._resetEllipse = function _resetEllipse(geo) {
    var _calcEllipseSize3 = this._calcEllipseSize(geo),
        width = _calcEllipseSize3[0],
        height = _calcEllipseSize3[1];

    geo.setWidth(width).setHeight(height)._updateCache();
  };

  Autoadsorb.prototype._resetCommon = function _resetCommon(geo) {
    var coords = geo.getCoordinates();
    coords.pop();
    coords.push(this._adsorbPoint);
    geo.setCoordinates(coords);
  };

  Autoadsorb.prototype._resetClickPoint = function _resetClickPoint(e) {
    if (!this._adsorbPoint) return;
    var clickCoords = e.target._clickCoords;
    var point = this._map.coordToPoint(this._adsorbPoint);
    clickCoords.pop();
    clickCoords.push(this._map._pointToPrj(point));
  };

  Autoadsorb.prototype._disable = function _disable() {
    this._isEnable = false;
    if (this._cursorLayer) this._cursorLayer.hide();
    this._offMapEvents();
    this._geometry ? this._offGeometryEvents() : this._offDrawToolEvents();
    this._resetGeosSet();
    delete this._geometry;
  };

  Autoadsorb.prototype._offMapEvents = function _offMapEvents() {
    delete this._needFindGeometry;
    this._map.off('mousedown', this._mapMousedown, this);
    this._map.off('mousemove', this._mapMousemove, this);
    this._map.off('mouseup', this._mapMouseup, this);
  };

  Autoadsorb.prototype._offGeometryEvents = function _offGeometryEvents() {
    this._geometry.off('handledragend', this._checkCenter, this);
    this._geometry.off('shapechange', this._setShadowCoordinates, this);
    this._geometry.off('editrecord', this._resetShadowCenter, this);
  };

  Autoadsorb.prototype._offDrawToolEvents = function _offDrawToolEvents() {
    this._drawTool.off('drawstart drawvertex', this._resetCoordsAndPoint, this);
    this._drawTool.off('mousemove drawend', this._resetCoordinates, this);
  };

  Autoadsorb.prototype._resetGeosSet = function _resetGeosSet() {
    this._geosSetPoint = [];
    this._geosSetLine = [];
  };

  Autoadsorb.prototype._disableMapTool = function _disableMapTool() {
    if (this._map._map_tool) this._map._map_tool.disable();
  };

  return Autoadsorb;
}(Class);

Autoadsorb.mergeOptions(options);

export { Autoadsorb };

typeof console !== 'undefined' && console.log('maptalks.autoadsorb v0.4.0, requires maptalks@>=0.46.0.');
