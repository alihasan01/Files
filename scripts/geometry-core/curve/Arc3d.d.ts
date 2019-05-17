/** @module Curve */
import { BeJSONFunctions, PlaneAltitudeEvaluator } from "../Geometry";
import { AngleSweep } from "../geometry3d/AngleSweep";
import { Angle } from "../geometry3d/Angle";
import { XYAndZ } from "../geometry3d/XYZProps";
import { Point3d, Vector3d } from "../geometry3d/Point3dVector3d";
import { Range3d } from "../geometry3d/Range";
import { Transform } from "../geometry3d/Transform";
import { Matrix3d } from "../geometry3d/Matrix3d";
import { Plane3dByOriginAndUnitNormal } from "../geometry3d/Plane3dByOriginAndUnitNormal";
import { Ray3d } from "../geometry3d/Ray3d";
import { Plane3dByOriginAndVectors } from "../geometry3d/Plane3dByOriginAndVectors";
import { GeometryHandler, IStrokeHandler } from "../geometry3d/GeometryHandler";
import { CurvePrimitive, AnnounceNumberNumberCurvePrimitive } from "./CurvePrimitive";
import { GeometryQuery } from "./GeometryQuery";
import { CurveLocationDetail } from "./CurveLocationDetail";
import { StrokeOptions } from "./StrokeOptions";
import { Clipper } from "../clipping/ClipUtils";
import { LineString3d } from "./LineString3d";
import { Matrix4d } from "../geometry4d/Matrix4d";
import { Point4d } from "../geometry4d/Point4d";
/**
 * Circular or elliptic arc.
 *
 * * The angle to point equation is:
 *
 * **  `X = center + cos(theta) * vector0 + sin(theta) * vector90`
 * * When the two vectors are perpendicular and have equal length, it is a true circle.
 * * Non-perpendicular vectors are always elliptic.
 * *  vectors of unequal length are always elliptic.
 * * To create an ellipse in the common "major and minor axis" form of an ellipse:
 * ** vector0 is the vector from the center to the major axis extreme.
 * ** vector90 is the vector from the center to the minor axis extreme.
 * ** note the constructing the vectors to the extreme points makes them perpendicular.
 * *  The method toScaledMatrix3d () can be called to convert the unrestricted vector0,vector90 to perpendicular form.
 * * The unrestricted form is much easier to work with for common calculations -- stroking, projection to 2d, intersection with plane.
 */
export declare class Arc3d extends CurvePrimitive implements BeJSONFunctions {
    isSameGeometryClass(other: GeometryQuery): boolean;
    private _center;
    private _matrix;
    private _sweep;
    private static _workPointA;
    private static _workPointB;
    /**
     * read property for (clone of) center
     */
    readonly center: Point3d;
    /**
     * read property for (clone of) vector0
     */
    readonly vector0: Vector3d;
    /**
     * read property for (clone of) vector90
     */
    readonly vector90: Vector3d;
    /**
     * read property for (clone of) matrix of vector0, vector90, unit normal
     */
    readonly matrix: Matrix3d;
    sweep: AngleSweep;
    /**
     * An Arc3d extends along its complete elliptic arc
     */
    readonly isExtensibleFractionSpace: boolean;
    private constructor();
    cloneTransformed(transform: Transform): CurvePrimitive;
    setRefs(center: Point3d, matrix: Matrix3d, sweep: AngleSweep): void;
    set(center: Point3d, matrix: Matrix3d, sweep: AngleSweep | undefined): void;
    setFrom(other: Arc3d): void;
    clone(): Arc3d;
    static createRefs(center: Point3d, matrix: Matrix3d, sweep: AngleSweep, result?: Arc3d): Arc3d;
    static createScaledXYColumns(center: Point3d, matrix: Matrix3d, radius0: number, radius90: number, sweep: AngleSweep, result?: Arc3d): Arc3d;
    static create(center: Point3d, vector0: Vector3d, vector90: Vector3d, sweep?: AngleSweep, result?: Arc3d): Arc3d;
    /**
     * Return a quick estimate of the eccentricity of the ellipse.
     * * The estimator is the cross magnitude of the product of vectors U and V, divided by square of the larger magnitude
     * * for typical Arc3d with perpendicular UV, this is exactly the small axis divided by large.
     * * note that the eccentricity is AT MOST ONE.
     */
    quickEccentricity(): number;
    /** Create a circular arc defined by start point, any intermediate point, and end point.
     * If the points are colinear, assemble them into a linestring.
     */
    static createCircularStartMiddleEnd(pointA: XYAndZ, pointB: XYAndZ, pointC: XYAndZ, result?: Arc3d): Arc3d | LineString3d | undefined;
    /** The arc has simple proportional arc length if and only if it is a circular arc. */
    getFractionToDistanceScale(): number | undefined;
    fractionToPoint(fraction: number, result?: Point3d): Point3d;
    fractionToPointAndDerivative(fraction: number, result?: Ray3d): Ray3d;
    /** Construct a plane with
     * * origin at the fractional position along the arc
     * * x axis is the first derivative, i.e. tangent along the arc
     * * y axis is the second derivative, i.e. in the plane and on the center side of the tangent.
     * If the arc is circular, the second derivative is directly towards the center
     */
    fractionToPointAnd2Derivatives(fraction: number, result?: Plane3dByOriginAndVectors): Plane3dByOriginAndVectors;
    radiansToPointAndDerivative(radians: number, result?: Ray3d): Ray3d;
    angleToPointAndDerivative(theta: Angle, result?: Ray3d): Ray3d;
    startPoint(result?: Point3d): Point3d;
    endPoint(result?: Point3d): Point3d;
    /** * If this is a circular arc, return the simple length derived from radius and sweep.
     * * Otherwise (i.e. if this elliptical) fall through to CurvePrimitive base implementation which
     *     Uses quadrature.
     */
    curveLength(): number;
    static readonly quadratureGuassCount = 5;
    /** In quadrature for arc length, use this interval (divided by quickEccentricity) */
    static readonly quadratureIntervalAngleDegrees = 10;
    /** * If this is a circular arc, return the simple length derived from radius and sweep.
     * * Otherwise (i.e. if this elliptical) fall through CurvePrimitive integrator.
     */
    curveLengthBetweenFractions(fraction0: number, fraction1: number): number;
    /**
     * Return an approximate (but easy to compute) arc length.
     * The estimate is:
     * * Form 8 chords on full circle, proportionally fewer for partials.  (But 2 extras if less than half circle.)
     * * sum the chord lengths
     * * For a circle, we know this crude approximation has to be increased by a factor (theta/(2 sin (theta/2)))
     * * Apply that factor.
     * * Experiments confirm that this is within 3 percent for a variety of eccentricities and arc sweeps.
     */
    quickLength(): number;
    /**
     * * See extended comments on `CurvePrimitive.moveSignedDistanceFromFraction`
     * * A zero length line generates `CurveSearchStatus.error`
     * * Nonzero length line generates `CurveSearchStatus.success` or `CurveSearchStatus.stoppedAtBoundary`
     */
    moveSignedDistanceFromFraction(startFraction: number, signedDistance: number, allowExtension: false, result?: CurveLocationDetail): CurveLocationDetail;
    allPerpendicularAngles(spacePoint: Point3d, _extend?: boolean, _endpoints?: boolean): number[];
    closestPoint(spacePoint: Point3d, extend: boolean, result?: CurveLocationDetail): CurveLocationDetail;
    reverseInPlace(): void;
    tryTransformInPlace(transform: Transform): boolean;
    isInPlane(plane: Plane3dByOriginAndUnitNormal): boolean;
    readonly isCircular: boolean;
    /** If the arc is circular, return its radius.  Otherwise return undefined */
    circularRadius(): number | undefined;
    /** Return the larger of the two defining vectors. */
    maxVectorLength(): number;
    appendPlaneIntersectionPoints(plane: PlaneAltitudeEvaluator, result: CurveLocationDetail[]): number;
    extendRange(range: Range3d): void;
    static createUnitCircle(): Arc3d;
    /**
     * @param center center of arc
     * @param radius radius of arc
     * @param sweep sweep limits.  defaults to full circle.
     */
    static createXY(center: Point3d, radius: number, sweep?: AngleSweep): Arc3d;
    static createXYEllipse(center: Point3d, radiusA: number, radiusB: number, sweep?: AngleSweep): Arc3d;
    setVector0Vector90(vector0: Vector3d, vector90: Vector3d): void;
    toScaledMatrix3d(): {
        center: Point3d;
        axes: Matrix3d;
        r0: number;
        r90: number;
        sweep: AngleSweep;
    };
    /** Return the arc definition with center, two vectors, and angle sweep;
     */
    toVectors(): {
        center: Point3d;
        vector0: Vector3d;
        vector90: Vector3d;
        sweep: AngleSweep;
    };
    /** Return the arc definition with center, two vectors, and angle sweep, optionally transformed.
     */
    toTransformedVectors(transform?: Transform): {
        center: Point3d;
        vector0: Vector3d;
        vector90: Vector3d;
        sweep: AngleSweep;
    };
    /** Return the arc definition with center, two vectors, and angle sweep, transformed to 4d points.
     */
    toTransformedPoint4d(matrix: Matrix4d): {
        center: Point4d;
        vector0: Point4d;
        vector90: Point4d;
        sweep: AngleSweep;
    };
    setFromJSON(json?: any): void;
    /**
     * Convert to a JSON object.
     * @return {*} [center:  [], vector0:[], vector90:[], sweep []}
     */
    toJSON(): any;
    isAlmostEqual(otherGeometry: GeometryQuery): boolean;
    /** Emit strokes to caller-supplied linestring */
    emitStrokes(dest: LineString3d, options?: StrokeOptions): void;
    /** Emit strokes to caller-supplied handler */
    emitStrokableParts(handler: IStrokeHandler, options?: StrokeOptions): void;
    dispatchToGeometryHandler(handler: GeometryHandler): any;
    /** Return (if possible) an arc which is a portion of this curve.
     * @param fractionA [in] start fraction
     * @param fractionB [in] end fraction
     */
    clonePartialCurve(fractionA: number, fractionB: number): CurvePrimitive | undefined;
    /**
     * Find intervals of this curveprimitve that are interior to a clipper
     * @param clipper clip structure (e.g.clip planes)
     * @param announce(optional) function to be called announcing fractional intervals"  ` announce(fraction0, fraction1, curvePrimitive)`
     * @returns true if any "in" segments are announced.
     */
    announceClipIntervals(clipper: Clipper, announce?: AnnounceNumberNumberCurvePrimitive): boolean;
}
//# sourceMappingURL=Arc3d.d.ts.map