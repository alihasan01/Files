/** @module CartesianGeometry */
import { AxisOrder } from "../Geometry";
import { Angle } from "./Angle";
import { Matrix3d } from "./Matrix3d";
/** OrderedRotationAngles represents a non-trivial rotation using three simple axis rotation angles, and an order in which to apply them. */
export declare class OrderedRotationAngles {
    private _x;
    private _y;
    private _z;
    private _order;
    private static _sTreatVectorsAsColumns;
    private constructor();
    readonly order: AxisOrder;
    readonly xAngle: Angle;
    readonly yAngle: Angle;
    readonly zAngle: Angle;
    readonly xDegrees: number;
    readonly xRadians: number;
    readonly yDegrees: number;
    readonly yRadians: number;
    readonly zDegrees: number;
    readonly zRadians: number;
    static treatVectorsAsColumns: boolean;
    /** Create an OrderedRotationAngles from three angles and an ordering in which to apply them when rotating.
     * @param xRotation rotation around x
     * @param yRotation rotation around y
     * @param zRotation rotation around z
     * @param axisOrder right to left order of axis names identifies the order that rotations are applied to xyz data.
     */
    static createAngles(xRotation: Angle, yRotation: Angle, zRotation: Angle, order: AxisOrder, result?: OrderedRotationAngles): OrderedRotationAngles;
    /** Create an OrderedRotationAngles from three angles (in radians) and an ordering in which to apply them when rotating. */
    static createRadians(xRadians: number, yRadians: number, zRadians: number, order: AxisOrder, result?: OrderedRotationAngles): OrderedRotationAngles;
    /** Create an OrderedRotationAngles from three angles (in degrees) and an ordering in which to apply them when rotating. */
    static createDegrees(xDegrees: number, yDegrees: number, zDegrees: number, order: AxisOrder, result?: OrderedRotationAngles): OrderedRotationAngles;
    /** Create an OrderedRotationAngles from a 3x3 rotational matrix, given the ordering of axis rotations that the matrix derives from. */
    static createFromMatrix3d(matrix: Matrix3d, order: AxisOrder, result?: OrderedRotationAngles): OrderedRotationAngles;
    /** Create a 3x3 rotational matrix from this OrderedRotationAngles. */
    toMatrix3d(result?: Matrix3d): Matrix3d;
}
//# sourceMappingURL=OrderedRotationAngles.d.ts.map