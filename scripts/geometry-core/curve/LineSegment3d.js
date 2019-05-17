"use strict";
/*---------------------------------------------------------------------------------------------
* Copyright (c) 2018 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
/** @module Curve */
const Geometry_1 = require("../Geometry");
const BezierPolynomials_1 = require("../numerics/BezierPolynomials");
const Point3dVector3d_1 = require("../geometry3d/Point3dVector3d");
const Ray3d_1 = require("../geometry3d/Ray3d");
const Plane3dByOriginAndVectors_1 = require("../geometry3d/Plane3dByOriginAndVectors");
const CurvePrimitive_1 = require("./CurvePrimitive");
const CurveLocationDetail_1 = require("./CurveLocationDetail");
const LineString3d_1 = require("./LineString3d");
/* tslint:disable:variable-name no-empty*/
/**
 * A LineSegment3d is:
 *
 * * A 3d line segment represented by
 *
 * ** startPoint
 * ** endPoint
 * parameterized with fraction 0 at the start and fraction 1 at the end, i.e. either of these equivalent forms:
 *
 * **  `X(f) = startPoint + f * (endPoint - startPoint)`
 * ** `X(f) = (1-f)*startPoint  + f * endPoint`
 */
class LineSegment3d extends CurvePrimitive_1.CurvePrimitive {
    isSameGeometryClass(other) { return other instanceof LineSegment3d; }
    get point0Ref() { return this._point0; }
    get point1Ref() { return this._point1; }
    /**
     * A LineSegment3d extends along its infinite line.
     */
    get isExtensibleFractionSpace() { return true; }
    /**
     * CAPTURE point references as a `LineSegment3d`
     * @param point0
     * @param point1
     */
    constructor(point0, point1) { super(); this._point0 = point0; this._point1 = point1; }
    /** Set the start and endpoints by capturing input references. */
    setRefs(point0, point1) { this._point0 = point0; this._point1 = point1; }
    /** Set the start and endponits by cloning the input parameters. */
    set(point0, point1) { this._point0 = point0.clone(); this._point1 = point1.clone(); }
    /** copy (clone) data from other */
    setFrom(other) { this._point0.setFrom(other._point0); this._point1.setFrom(other._point1); }
    /** @returns Return a (clone of) the start point. */
    startPoint(result) {
        if (result) {
            result.setFrom(this._point0);
            return result;
        }
        return this._point0.clone();
    }
    /** @returns Return a (clone of) the end point. */
    endPoint(result) {
        if (result) {
            result.setFrom(this._point1);
            return result;
        }
        return this._point1.clone();
    }
    /** @returns Return the point at fractional position along the line segment. */
    fractionToPointAndDerivative(fraction, result) {
        result = result ? result : Ray3d_1.Ray3d.createZero();
        result.direction.setStartEnd(this._point0, this._point1);
        this._point0.interpolate(fraction, this._point1, result.origin);
        return result;
    }
    /** Construct a plane with
     * * origin at the fractional position along the line segment
     * * x axis is the first derivative, i.e. along the line segment
     * * y axis is the second derivative, i.e. 000
     */
    fractionToPointAnd2Derivatives(fraction, result) {
        result = result ? result : Plane3dByOriginAndVectors_1.Plane3dByOriginAndVectors.createXYPlane();
        result.vectorU.setStartEnd(this._point0, this._point1);
        result.vectorV.set(0, 0, 0);
        this._point0.interpolate(fraction, this._point1, result.origin);
        return result;
    }
    /** Clone the LineSegment3d */
    clone() { return LineSegment3d.create(this._point0, this._point1); }
    /** Clone and apply transform to the clone. */
    cloneTransformed(transform) {
        const c = this.clone();
        c.tryTransformInPlace(transform);
        return c;
    }
    /** Create with start and end points.  The ponit contents are cloned into the LineSegment3d. */
    static create(point0, point1, result) {
        if (result) {
            result.set(point0, point1); // and this will clone them !!
            return result;
        }
        return new LineSegment3d(point0.clone(), point1.clone());
    }
    /** create a LineSegment3d from xy coordinates of start and end, with common z.
     * @param x0 start point x coordinate.
     * @param y0 start point y coordinate.
     * @param x1 end point x coordinate.
     * @param y1 end point y coordinate.
     * @param z z coordinate to use for both points.
     * @param result optional existing LineSegment to be reinitiazlized.
     */
    static createXYXY(x0, y0, x1, y1, z = 0, result) {
        if (result) {
            result._point0.set(x0, y0, z);
            result._point1.set(x1, y1, z);
            return result;
        }
        return new LineSegment3d(Point3dVector3d_1.Point3d.create(x0, y0, z), Point3dVector3d_1.Point3d.create(x1, y1, z));
    }
    /** create a LineSegment3d from xy coordinates of start and end, with common z.
     * @param x0 start point x coordinate.
     * @param y0 start point y coordinate.
     * @param x1 end point x coordinate.
     * @param y1 end point y coordinate.
     * @param z z coordinate to use for both points.
     * @param result optional existing LineSegment to be reinitiazlized.
     */
    static createXYZXYZ(x0, y0, z0, x1, y1, z1, result) {
        if (result) {
            result._point0.set(x0, y0, z0);
            result._point1.set(x1, y1, z1);
            return result;
        }
        return new LineSegment3d(Point3dVector3d_1.Point3d.create(x0, y0, z0), Point3dVector3d_1.Point3d.create(x1, y1, z1));
    }
    /** @returns Return the point at fractional position along the line segment. */
    fractionToPoint(fraction, result) { return this._point0.interpolate(fraction, this._point1, result); }
    curveLength() { return this._point0.distance(this._point1); }
    curveLengthBetweenFractions(fraction0, fraction1) {
        return Math.abs(fraction1 - fraction0) * this._point0.distance(this._point1);
    }
    quickLength() { return this.curveLength(); }
    /**
     * @param spacePoint point in space
     * @param extend if false, only return points within the bounded line segment. If true, allow the point to be on the unbounded line that contains the bounded segment.
     * @returns Returns a curve location detail with both xyz and fractional coordinates of the closest point.
     */
    closestPoint(spacePoint, extend, result) {
        let fraction = spacePoint.fractionOfProjectionToLine(this._point0, this._point1, 0.0);
        if (!extend) {
            if (fraction > 1.0)
                fraction = 1.0;
            else if (fraction < 0.0)
                fraction = 0.0;
        }
        result = CurveLocationDetail_1.CurveLocationDetail.create(this, result);
        // remark: This can be done by result.setFP (fraction, thePoint, undefined, a)
        //   but that creates a temporary point.
        result.fraction = fraction;
        this._point0.interpolate(fraction, this._point1, result.point);
        result.vectorInCurveLocationDetail = undefined;
        result.a = result.point.distance(spacePoint);
        return result;
    }
    /** swap the endpoint references. */
    reverseInPlace() {
        const a = this._point0;
        this._point0 = this._point1;
        this._point1 = a;
    }
    tryTransformInPlace(transform) {
        this._point0 = transform.multiplyPoint3d(this._point0, this._point0);
        this._point1 = transform.multiplyPoint3d(this._point1, this._point1);
        return true;
    }
    isInPlane(plane) {
        return Geometry_1.Geometry.isSmallMetricDistance(plane.altitude(this._point0))
            && Geometry_1.Geometry.isSmallMetricDistance(plane.altitude(this._point1));
    }
    appendPlaneIntersectionPoints(plane, result) {
        const h0 = plane.altitude(this._point0);
        const h1 = plane.altitude(this._point1);
        const fraction = BezierPolynomials_1.Order2Bezier.solveCoffs(h0, h1);
        let numIntersection = 0;
        if (fraction !== undefined) {
            numIntersection++;
            result.push(CurveLocationDetail_1.CurveLocationDetail.createCurveFractionPoint(this, fraction, this.fractionToPoint(fraction)));
        }
        return numIntersection;
    }
    /**
     * Extend a range to include the (optionally transformed) line segment
     * @param range range to extend
     * @param transform optional transform to apply to the end points
     */
    extendRange(range, transform) {
        if (transform) {
            range.extendTransformedPoint(transform, this._point0);
            range.extendTransformedPoint(transform, this._point1);
        }
        else {
            range.extendPoint(this._point0);
            range.extendPoint(this._point1);
        }
    }
    /**
     * Construct a line from either of these json forms:
     *
     * * object with named start and end:
     * `{startPoint: pointValue, endPoint: pointValue}`
     * * array of two point values:
     * `[pointValue, pointValue]`
     * The point values are any values accepted by the Point3d method setFromJSON.
     * @param json data to parse.
     */
    setFromJSON(json) {
        if (!json) {
            this._point0.set(0, 0, 0);
            this._point1.set(1, 0, 0);
            return;
        }
        else if (json.startPoint && json.endPoint) { // {startPoint:JSONPOINT, endPoint:JSONPOINT}
            this._point0.setFromJSON(json.startPoint);
            this._point1.setFromJSON(json.endPoint);
        }
        else if (Array.isArray(json)
            && json.length > 1) { // [JSONPOINT, JSONPOINT]
            this._point0.setFromJSON(json[0]);
            this._point1.setFromJSON(json[1]);
        }
    }
    /** A simple line segment's fraction and distance are proportional. */
    getFractionToDistanceScale() { return this.curveLength(); }
    /**
     * Place the lineSegment3d start and points in a json object
     * @return {*} [[x,y,z],[x,y,z]]
     */
    toJSON() { return [this._point0.toJSON(), this._point1.toJSON()]; }
    static fromJSON(json) {
        const result = new LineSegment3d(Point3dVector3d_1.Point3d.createZero(), Point3dVector3d_1.Point3d.create());
        result.setFromJSON(json);
        return result;
    }
    isAlmostEqual(other) {
        if (other instanceof LineSegment3d) {
            const ls = other;
            return this._point0.isAlmostEqual(ls._point0) && this._point1.isAlmostEqual(ls._point1);
        }
        return false;
    }
    /** Emit strokes to caller-supplied linestring */
    emitStrokes(dest, options) {
        dest.appendStrokePoint(this._point0);
        if (options) {
            let numStroke = 1;
            if (options.maxEdgeLength)
                numStroke = options.applyMaxEdgeLength(numStroke, this.curveLength());
            numStroke = options.applyMinStrokesPerPrimitive(numStroke);
            dest.appendFractionalStrokePoints(this, numStroke, 0.0, 1.0, false);
        }
        dest.appendStrokePoint(this._point1);
    }
    /** Emit strokes to caller-supplied handler */
    emitStrokableParts(handler, options) {
        handler.startCurvePrimitive(this);
        const tangent = this._point0.vectorTo(this._point1);
        let numStroke = 1;
        if (options) {
            if (options.maxEdgeLength)
                numStroke = options.applyMaxEdgeLength(numStroke, tangent.magnitude());
            numStroke = options.applyMinStrokesPerPrimitive(numStroke);
        }
        handler.announceSegmentInterval(this, this._point0, this._point1, numStroke, 0.0, 1.0);
        handler.endCurvePrimitive(this);
    }
    dispatchToGeometryHandler(handler) {
        return handler.handleLineSegment3d(this);
    }
    /**
     * Find intervals of this curveprimitve that are interior to a clipper
     * @param clipper clip structure (e.g. clip planes)
     * @param announce function to be called announcing fractional intervals"  ` announce(fraction0, fraction1, curvePrimitive)`
     */
    announceClipIntervals(clipper, announce) {
        return clipper.announceClippedSegmentIntervals(0.0, 1.0, this._point0, this._point1, announce ? (fraction0, fraction1) => announce(fraction0, fraction1, this) : undefined);
    }
    /** Return (if possible) a curve primitive which is a portion of this curve.
     * @param fractionA [in] start fraction
     * @param fractionB [in] end fraction
     */
    clonePartialCurve(fractionA, fractionB) {
        return LineString3d_1.LineString3d.create(this.fractionToPoint(fractionA), this.fractionToPoint(fractionB));
    }
}
exports.LineSegment3d = LineSegment3d;
//# sourceMappingURL=LineSegment3d.js.map