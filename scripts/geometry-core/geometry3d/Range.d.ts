/** @module CartesianGeometry */
import { BeJSONFunctions } from "../Geometry";
import { Point2d, Vector2d } from "./Point2dVector2d";
import { Point3d, Vector3d } from "./Point3dVector3d";
import { Transform } from "./Transform";
import { Range1dProps, Range2dProps, Range3dProps, LowAndHighXYZ, LowAndHighXY, XAndY, XYAndZ } from "./XYZProps";
import { GrowableXYZArray } from "./GrowableXYZArray";
export declare abstract class RangeBase {
    protected static readonly _EXTREME_POSITIVE: number;
    protected static readonly _EXTREME_NEGATIVE: number;
    /** @return 0 if high<= low, otherwise `1/(high-low)` for use in fractionalizing */
    protected static npcScaleFactor(low: number, high: number): number;
    static isExtremeValue(x: number): boolean;
    static isExtremePoint3d(xyz: Point3d): boolean;
    static isExtremePoint2d(xy: Point2d): boolean;
    /**
     * * Both low,high pairs have order expectations:  The condition `high > low` means null interval.
     * * If there is interval overlap, the distance is zero.
     * @returns The min absolute distance from any point of `[lowA,highA]' to any point of `[lowB,highB]'.
     * @param lowA low of interval A
     * @param highA high of interval A
     * @param lowB low of interval B
     * @param highB high of interval B
     */
    static rangeToRangeAbsoluteDistance(lowA: number, highA: number, lowB: number, highB: number): number;
    static coordinateToRangeAbsoluteDistance(x: number, low: number, high: number): number;
    /**
     * move low and high points by scaleFactor around the center point.
     * @param scaleFactor scale factor applied to low, high distance from center.
     */
    abstract scaleAboutCenterInPlace(scaleFactor: number): void;
    /**
     * move all limits by a fixed amount.
     * * positive delta expands the range size
     * * negative delta reduces the range size
     * * if any dimension reduces below zero size, the whole range becomes null
     * @param delta shift to apply.
     */
    abstract expandInPlace(delta: number): void;
}
export declare class Range3d extends RangeBase implements LowAndHighXYZ, BeJSONFunctions {
    low: Point3d;
    high: Point3d;
    /** Set this transform to values that indicate it has no contents. */
    setNull(): void;
    freeze(): void;
    static toFloat64Array(val: LowAndHighXYZ): Float64Array;
    toFloat64Array(): Float64Array;
    /**
     * Construct a Range3d from an array of double-precision values
     * @param f64 the array, which should contain exactly 6 values in this order: lowx, lowy, lowz, highx, highy, highz
     * @return a new Range3d object
     */
    static fromFloat64Array(f64: Float64Array): Range3d;
    /**
     * Construct a Range3d from an un-typed array. This mostly useful when interpreting ECSQL query results of the 'blob' type, where you know that that result is a Range3d.
     * @param buffer untyped array
     * @return a new Range3d object
     */
    static fromArrayBuffer(buffer: ArrayBuffer): Range3d;
    constructor(lowx?: number, lowy?: number, lowz?: number, highx?: number, highy?: number, highz?: number);
    /** Returns true if this and other have equal low and high point x,y,z parts */
    isAlmostEqual(other: Range3d): boolean;
    /** copy low and high values from other. */
    setFrom(other: Range3d): void;
    static createFrom(other: Range3d, result?: Range3d): Range3d;
    setFromJSON(json?: Range3dProps): void;
    /** Return a JSON object */
    toJSON(): Range3dProps;
    static fromJSON(json?: Range3dProps): Range3d;
    private setDirect;
    clone(result?: Range3d): Range3d;
    /** Return a range initialized to have no content. */
    static createNull(result?: Range3d): Range3d;
    /** Extend (modify in place) so that the range is large enough to include the supplied points. */
    extend(...point: Point3d[]): void;
    /** Return a range large enough to include the supplied points. If no points are given, the range is a null range */
    static create(...point: Point3d[]): Range3d;
    /** create a Range3d enclosing the transformed points. */
    static createTransformed(transform: Transform, ...point: Point3d[]): Range3d;
    /** create a Range3d enclosing the transformed points. */
    static createTransformedArray(transform: Transform, points: Point3d[]): Range3d;
    /** create a Range3d enclosing the points after inverse transform. */
    static createInverseTransformedArray(transform: Transform, points: Point3d[]): Range3d;
    /** Set the range to be a single point supplied as x,y,z values */
    setXYZ(x: number, y: number, z: number): void;
    /** Create a single point range */
    static createXYZ(x: number, y: number, z: number, result?: Range3d): Range3d;
    /** Create a box with 2 pairs of xyz candidates. Theses are compared and shuffled as needed for the box. */
    static createXYZXYZ(xA: number, yA: number, zA: number, xB: number, yB: number, zB: number, result?: Range3d): Range3d;
    /** Create a box with 2 pairs of xyz candidates. If any direction has order flip, create null. */
    static createXYZXYZOrCorrectToNull(xA: number, yA: number, zA: number, xB: number, yB: number, zB: number, result?: Range3d): Range3d;
    /** Creates a 3d range from a 2d range's low and high members, setting the corresponding z values to the value given. */
    static createRange2d(range: Range2d, z?: number, result?: Range3d): Range3d;
    /** Create a range around an array of points. */
    static createArray(points: Point3d[], result?: Range3d): Range3d;
    /** extend a range around an array of points (optionally transformed) */
    extendArray(points: Point3d[] | GrowableXYZArray, transform?: Transform): void;
    /** extend a range around an array of points (optionally transformed) */
    extendInverseTransformedArray(points: Point3d[] | GrowableXYZArray, transform: Transform): void;
    /** multiply the point x,y,z by transform and use the coordinate to extend this range.
     */
    extendTransformedXYZ(transform: Transform, x: number, y: number, z: number): void;
    /** multiply the point x,y,z,w by transform and use the coordinate to extend this range.
     */
    extendTransformedXYZW(transform: Transform, x: number, y: number, z: number, w: number): void;
    /** multiply the point x,y,z by transform and use the coordinate to extend this range.
     */
    extendInverseTransformedXYZ(transform: Transform, x: number, y: number, z: number): boolean;
    /** Extend the range by the two transforms applied to xyz */
    extendTransformTransformedXYZ(transformA: Transform, transformB: Transform, x: number, y: number, z: number): void;
    /** Test if the box has high<low for any of x,y,z, condition. Note that a range around a single point is NOT null. */
    readonly isNull: boolean;
    /** Test if  data has high<low for any of x,y,z, condition. Note that a range around a single point is NOT null. */
    static isNull(data: LowAndHighXYZ): boolean;
    /** Test of the range contains a single point. */
    readonly isSinglePoint: boolean;
    /**  Return the length of the box in the x direction */
    xLength(): number;
    /**  Return the length of the box in the y direction */
    yLength(): number;
    /**  Return the length of the box in the z direction */
    zLength(): number;
    /**  Return the largest of the x,y, z lengths of the range. */
    maxLength(): number;
    /** return the diagonal vector. There is no check for isNull -- if the range isNull(), the vector will have very large negative coordinates. */
    diagonal(result?: Vector3d): Vector3d;
    /**  Return the diagonal vector. There is no check for isNull -- if the range isNull(), the vector will have very large negative coordinates. */
    diagonalFractionToPoint(fraction: number, result?: Point3d): Point3d;
    /**  Return a point given by fractional positions on the XYZ axes. This is done with no check for isNull !!! */
    fractionToPoint(fractionX: number, fractionY: number, fractionZ: number, result?: Point3d): Point3d;
    /**  Return a point given by fractional positions on the XYZ axes.
     *  Returns undefined if the range is null.
     */
    localXYZToWorld(fractionX: number, fractionY: number, fractionZ: number, result?: Point3d): Point3d | undefined;
    /** Return a point given by fractional positions on the XYZ axes.
     * * Returns undefined if the range is null.
     */
    localToWorld(xyz: XYAndZ, result?: Point3d): Point3d | undefined;
    /** Replace fractional coordinates by world coordinates.
     * @returns false if null range.
     */
    localToWorldArrayInPlace(points: Point3d[]): boolean;
    /** Return fractional coordinates of point within the range.
     * * returns undefined if the range is null.
     * * returns undefined if any direction (x,y,z) has zero length
     */
    worldToLocal(point: Point3d, result?: Point3d): Point3d | undefined;
    /** Return fractional coordinates of point within the range.
     * * returns undefined if the range is null.
     * * returns undefined if any direction (x,y,z) has zero length
     */
    worldToLocalArrayInPlace(point: Point3d[]): boolean;
    /** Return an array with the 8 corners on order wth "x varies fastest, then y, then z" */
    corners(): Point3d[];
    /** Return the largest absolute value among any coordinates in the box corners. */
    maxAbs(): number;
    /** returns true if the x direction size is nearly zero */
    readonly isAlmostZeroX: boolean;
    /** returns true if the y direction size is nearly zero */
    readonly isAlmostZeroY: boolean;
    /** returns true if the z direction size is nearly zero */
    readonly isAlmostZeroZ: boolean;
    /** Test if a point given as x,y,z is within the range. */
    containsXYZ(x: number, y: number, z: number): boolean;
    /** Test if a point is within the range. */
    containsPoint(point: Point3d): boolean;
    /** Test if the x,y coordinates of a point are within the range. */
    containsPointXY(point: Point3d): boolean;
    /** Test of other range is within this range */
    containsRange(other: Range3d): boolean;
    /** Test if there is any intersection with other range */
    intersectsRange(other: Range3d): boolean;
    /** Test if there is any intersection with other range */
    intersectsRangeXY(other: Range3d): boolean;
    /** Return 0 if the point is within the range, otherwise the distance to the closest face or corner */
    distanceToPoint(point: XYAndZ): number;
    /** returns 0 if the ranges have any overlap, otherwise the shortest absolute distance from one to the other. */
    distanceToRange(other: Range3d): number;
    /** Expand this range by distances a (possibly signed) in all directions */
    extendXYZ(x: number, y: number, z: number): void;
    /** Expand this range by distances a (weighted and possibly signed) in all directions */
    extendXYZW(x: number, y: number, z: number, w: number): void;
    /** Expand this range to include a point. */
    extendPoint(point: Point3d): void;
    /** Expand this range to include a transformed point. */
    extendTransformedPoint(transform: Transform, point: Point3d): void;
    /** Expand this range to include a range. */
    extendRange(other: LowAndHighXYZ): void;
    /** Return the intersection of ranges. */
    intersect(other: Range3d, result?: Range3d): Range3d;
    /** Return the union of ranges. */
    union(other: Range3d, result?: Range3d): Range3d;
    /**
     * move low and high points by scaleFactor around the center point.
     * @param scaleFactor scale factor applied to low, high distance from center.
     */
    scaleAboutCenterInPlace(scaleFactor: number): void;
    /**
     * move all limits by a fixed amount.
     * * positive delta expands the range size
     * * negative delta reduces the range size
     * * if any dimension reduces below zero size, the whole range becomes null
     * @param delta shift to apply.
     */
    expandInPlace(delta: number): void;
    /** Create a local to world transform from this range. */
    getLocalToWorldTransform(result?: Transform): Transform;
    /**
     * Creates an NPC to world transformation to go from 000...111 to the globally aligned cube with diagonally opposite corners that are the
     * min and max of this range. The diagonal component for any degenerate direction is 1.
     */
    getNpcToWorldRangeTransform(result?: Transform): Transform;
}
export declare class Range1d extends RangeBase {
    low: number;
    high: number;
    setNull(): void;
    private setDirect;
    private constructor();
    /** Returns true if this and other have equal low and high parts */
    isAlmostEqual(other: Range1d): boolean;
    /** copy contents from other Range1d. */
    setFrom(other: Range1d): void;
    /** Convert from a JSON object of one of these forms:
     *
     * *  Any array of numbers: `[value,value, value]`
     * *  An object with low and high as properties: `{low:lowValue, high: highValue}`
     */
    setFromJSON(json: Range1dProps): void;
    static fromJSON(json?: Range1dProps): Range1d;
    /** Convert to a JSON object of form
     * ```
     *    [lowValue,highValue]
     * ```
     */
    toJSON(): Range1dProps;
    private set_direct;
    /** return a new Range1d with contents of this.
     * @param result optional result.
     */
    clone(result?: Range1d): Range1d;
    /** return a new Range1d with contents of this.
     * @param result optional result.
     */
    static createFrom(other: Range1d, result?: Range1d): Range1d;
    /** Create a range with no content.
     * @param result optional result.
     */
    static createNull(result?: Range1d): Range1d;
    /**
     * Set this range to be a single value.
     * @param x value to use as both low and high.
     */
    setX(x: number): void;
    /** Create a single point box */
    static createX(x: number, result?: Range1d): Range1d;
    /** Create a box from two values. Values are reversed if needed
     * @param xA first value
     * @param xB second value
     */
    static createXX(xA: number, xB: number, result?: Range1d): Range1d;
    /** Create a box from two values, but null range if the values are reversed
     * @param xA first value
     * @param xB second value
     */
    static createXXOrCorrectToNull(xA: number, xB: number, result?: Range1d): Range1d;
    /** Create a range containing all the values in an array.
     * @param values array of points to be contained in the range.
     * @param result optional result.
     */
    static createArray(values: Float64Array | number[], result?: Range1d): Range1d;
    /** extend to include an array of values */
    extendArray(values: Float64Array | number[]): void;
    /** extend to include `values` at indices `beginIndex <= i < endIndex]`
     * @param values array of values
     * @param beginIndex first index to include
     * @param numValue nubmer of values to access
     */
    extendArraySubset(values: Float64Array | number[], beginIndex: number, numValue: number): void;
    /** Test if the box has high<low Note that a range around a single point is NOT null. */
    readonly isNull: boolean;
    /** Test of the range contains a single point. */
    readonly isSinglePoint: boolean;
    /** Return the length of the range in the x direction */
    length(): number;
    /** return a point given by fractional positions within the range. This is done with no check for isNull !!! */
    fractionToPoint(fraction: number): number;
    /** Return the largest absolute value among the box limits. */
    maxAbs(): number;
    /** Test if the x direction size is nearly zero */
    readonly isAlmostZeroLength: boolean;
    /** Test if a number is within the range. */
    containsX(x: number): boolean;
    /** Test of other range is within this range */
    containsRange(other: Range1d): boolean;
    /** Test if there is any intersection with other range */
    intersectsRange(other: Range1d): boolean;
    /** returns 0 if the ranges have any overlap, otherwise the shortest absolute distance from one to the other. */
    distanceToRange(other: Range1d): number;
    /** Return 0 if the point is within the range, otherwise the (unsigned) distance to the closest face or corner */
    distanceToX(x: number): number;
    /** Expand this range by a single coordinate */
    extendX(x: number): void;
    /** Expand this range to include a range. */
    extendRange(other: Range1d): void;
    /** Return the intersection of ranges. */
    intersect(other: Range1d, result?: Range1d): Range1d;
    /** Return the union of ranges. */
    /** Return the intersection of ranges. */
    union(other: Range1d, result?: Range1d): Range1d;
    /**
     * move low and high points by scaleFactor around the center point.
     * @param scaleFactor scale factor applied to low, high distance from center.
     */
    scaleAboutCenterInPlace(scaleFactor: number): void;
    /**
     * move all limits by a fixed amount.
     * * positive delta expands the range size
     * * negative delta reduces the range size
     * * if any dimension reduces below zero size, the whole range becomes null
     * @param delta shift to apply.
     */
    expandInPlace(delta: number): void;
}
export declare class Range2d extends RangeBase implements LowAndHighXY {
    low: Point2d;
    high: Point2d;
    setNull(): void;
    static toFloat64Array(val: LowAndHighXY): Float64Array;
    toFloat64Array(): Float64Array;
    /**
     * Construct a Range2d from an array of double-precision values
     * @param f64 the array, which should contain exactly 4 values in this order: lowx, lowy, highx, highy
     * @return a new Range2d object
     */
    static fromFloat64Array(f64: Float64Array): Range3d;
    /**
     * Construct a Range2d from an un-typed array. This mostly useful when interpreting ECSQL query results of the 'blob' type, where you know that that result is a Range3d.
     * @param buffer untyped array
     * @return a new Range2d object
     */
    static fromArrayBuffer(buffer: ArrayBuffer): Range3d;
    constructor(lowx?: number, lowy?: number, highx?: number, highy?: number);
    isAlmostEqual(other: Range2d): boolean;
    setFrom(other: LowAndHighXY): void;
    static createFrom(other: LowAndHighXY, result?: Range2d): Range2d;
    /** treat any array of numbers as numbers to be inserted !!! */
    setFromJSON(json: Range2dProps): void;
    freeze(): void;
    toJSON(): Range2dProps;
    static fromJSON(json?: Range2dProps): Range2d;
    private setDirect;
    /** return a clone of this range (or copy to optional result) */
    clone(result?: Range2d): Range2d;
    /** create a range with no content. */
    static createNull(result?: Range2d): Range2d;
    /** Set low and hight to a single xy value. */
    setXY(x: number, y: number): void;
    /** Create a single point box */
    static createXY(x: number, y: number, result?: Range2d): Range2d;
    /** Create a box with 2 pairs of xy candidates. Theses are compared and shuffled as needed for the box. */
    static createXYXY(xA: number, yA: number, xB: number, yB: number, result?: Range2d): Range2d;
    /** Create a box with 2 pairs of xy candidates. If any direction has order flip, create null. */
    static createXYXYOrCorrectToNull(xA: number, yA: number, xB: number, yB: number, result?: Range2d): Range2d;
    /** Create a range around an array of points. */
    static createArray(points: Point2d[], result?: Range2d): Range2d;
    /** Test if the box has high<low for any of x,y, condition. Note that a range around a single point is NOT null. */
    readonly isNull: boolean;
    /** Test if the box has high strictly less than low for any of x,y, condition. Note that a range around a single point is NOT null. */
    static isNull(range: LowAndHighXY): boolean;
    /** Test of the range contains a single point. */
    readonly isSinglePoint: boolean;
    /** Length of the box in the x direction */
    xLength(): number;
    /** Length of the box in the y direction */
    yLength(): number;
    /** return the diagonal vector. There is no check for isNull -- if the range isNull(), the vector will have very large negative coordinates. */
    diagonal(result?: Vector2d): Vector2d;
    /** return the diagonal vector. There is no check for isNull -- if the range isNull(), the vector will have very large negative coordinates. */
    diagonalFractionToPoint(fraction: number, result?: Point2d): Point2d;
    /** return a point given by fractional positions on the XY axes. This is done with no check for isNull !!! */
    fractionToPoint(fractionX: number, fractionY: number, result?: Point2d): Point2d;
    /** Largest absolute value among any coordinates in the box corners. */
    maxAbs(): number;
    /** Test if the x direction size is nearly zero */
    readonly isAlmostZeroX: boolean;
    /** Test if the y direction size is nearly zero */
    readonly isAlmostZeroY: boolean;
    /** Test if a point given as x,y is within the range. */
    containsXY(x: number, y: number): boolean;
    /** Test if a point is within the range. */
    containsPoint(point: XAndY): boolean;
    /** Test of other range is within this range */
    containsRange(other: LowAndHighXY): boolean;
    /** Test if there is any intersection with other range */
    intersectsRange(other: LowAndHighXY): boolean;
    /** Return 0 if the point is within the range, otherwise the distance to the closest face or corner */
    distanceToPoint(point: XAndY): number;
    /** Return 0 if the point is within the range, otherwise the distance to the closest face or corner */
    distanceToRange(other: LowAndHighXY): number;
    /** Expand this range by distances a (possibly signed) in all directions */
    extendXY(x: number, y: number): void;
    /** Expand this range to include a point. */
    extendPoint(point: XAndY): void;
    /** Expand this range to include a range. */
    extendRange(other: LowAndHighXY): void;
    /** Return the intersection of ranges. */
    intersect(other: LowAndHighXY, result?: Range2d): Range2d;
    /** Return the union of ranges. */
    union(other: LowAndHighXY, result?: Range2d): Range2d;
    /**
     * move low and high points by scaleFactor around the center point.
     * @param scaleFactor scale factor applied to low, high distance from center.
     */
    scaleAboutCenterInPlace(scaleFactor: number): void;
    /**
     * move all limits by a fixed amount.
     * * positive delta expands the range size
     * * negative delta reduces the range size
     * * if any dimension reduces below zero size, the whole range becomes null
     * @param delta shift to apply.
     */
    expandInPlace(delta: number): void;
}
//# sourceMappingURL=Range.d.ts.map