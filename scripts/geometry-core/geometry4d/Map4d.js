"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Transform_1 = require("../geometry3d/Transform");
const Matrix3d_1 = require("../geometry3d/Matrix3d");
const Matrix4d_1 = require("./Matrix4d");
/** Map4 carries two Matrix4d which are inverses of each other.
 */
class Map4d {
    constructor(matrix0, matrix1) {
        this._matrix0 = matrix0;
        this._matrix1 = matrix1;
    }
    /** @returns Return a reference to (not copy of) the "forward" Matrix4d */
    get transform0() { return this._matrix0; }
    /** @returns Return a reference to (not copy of) the "reverse" Matrix4d */
    get transform1() { return this._matrix1; }
    /** Create a Map4d, capturing the references to the two matrices. */
    static createRefs(matrix0, matrix1) {
        return new Map4d(matrix0, matrix1);
    }
    /** Create an identity map. */
    static createIdentity() { return new Map4d(Matrix4d_1.Matrix4d.createIdentity(), Matrix4d_1.Matrix4d.createIdentity()); }
    /** Create a Map4d with given transform pair.
     * @returns undefined if the transforms are not inverses of each other.
     */
    static createTransform(transform0, transform1) {
        if (transform1 === undefined) {
            transform1 = transform0.inverse();
            if (transform1 === undefined)
                return undefined;
        }
        else {
            const product = transform0.multiplyTransformTransform(transform1);
            if (!product.isIdentity)
                return undefined;
        }
        return new Map4d(Matrix4d_1.Matrix4d.createTransform(transform0), Matrix4d_1.Matrix4d.createTransform(transform1));
    }
    /**
     * Create a mapping the scales and translates (no rotation) between boxes.
     * @param lowA low point of box A
     * @param highA high point of box A
     * @param lowB low point of box B
     * @param highB high point of box B
     */
    static createBoxMap(lowA, highA, lowB, highB, result) {
        const t0 = Matrix4d_1.Matrix4d.createBoxToBox(lowA, highA, lowB, highB, result ? result.transform0 : undefined);
        const t1 = Matrix4d_1.Matrix4d.createBoxToBox(lowB, highB, lowA, highA, result ? result.transform1 : undefined);
        if (t0 && t1) {
            if (result)
                return result;
            return new Map4d(t0, t1);
        }
        return undefined;
    }
    /** Copy contents from another Map4d */
    setFrom(other) { this._matrix0.setFrom(other._matrix0), this._matrix1.setFrom(other._matrix1); }
    /** @returns Return a clone of this Map4d */
    clone() { return new Map4d(this._matrix0.clone(), this._matrix1.clone()); }
    /** Reinitialize this Map4d as an identity. */
    setIdentity() { this._matrix0.setIdentity(); this._matrix1.setIdentity(); }
    /** Set this map4d from a json object that the two Matrix4d values as properties named matrix0 and matrix1 */
    setFromJSON(json) {
        if (json.matrix0 && json.matrix1) {
            this._matrix0.setFromJSON(json.matrix0);
            this._matrix1.setFromJSON(json.matrix1);
        }
        else
            this.setIdentity();
    }
    /** Create a map4d from a json object that the two Matrix4d values as properties named matrix0 and matrix1 */
    static fromJSON(json) {
        const result = new Map4d(Matrix4d_1.Matrix4d.createIdentity(), Matrix4d_1.Matrix4d.createIdentity());
        result.setFromJSON(json);
        return result;
    }
    /** @returns a json object `{matrix0: value0, matrix1: value1}` */
    toJSON() { return { matrix0: this._matrix0.toJSON(), matrix1: this._matrix1.toJSON() }; }
    isAlmostEqual(other) {
        return this._matrix0.isAlmostEqual(other._matrix0) && this._matrix1.isAlmostEqual(other._matrix1);
    }
    /** Create a map between a frustum and world coordinates.
     * @param origin lower left of frustum
     * @param uVector Vector from lower left rear to lower right rear
     * @param vVector Vector from lower left rear to upper left rear
     * @param wVector Vector from lower left rear to lower left front, i.e. lower left rear towards eye.
     * @param fraction front size divided by rear size.
     */
    static createVectorFrustum(origin, uVector, vVector, wVector, fraction) {
        fraction = Math.max(fraction, 1.0e-8);
        const slabToWorld = Transform_1.Transform.createOriginAndMatrix(origin, Matrix3d_1.Matrix3d.createColumns(uVector, vVector, wVector));
        const worldToSlab = slabToWorld.inverse();
        if (!worldToSlab)
            return undefined;
        const worldToSlabMap = new Map4d(Matrix4d_1.Matrix4d.createTransform(worldToSlab), Matrix4d_1.Matrix4d.createTransform(slabToWorld));
        const slabToNPCMap = new Map4d(Matrix4d_1.Matrix4d.createRowValues(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, fraction, 0, 0, 0, fraction - 1.0, 1), Matrix4d_1.Matrix4d.createRowValues(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1.0 / fraction, 0, 0, 0, (1.0 - fraction) / fraction, 1));
        const result = slabToNPCMap.multiplyMapMap(worldToSlabMap);
        /*
        let numIdentity = 0;
        const productA = worldToSlabMap.matrix0.multiplyMatrixMatrix(worldToSlabMap.matrix1);
        if (productA.isIdentity())
          numIdentity++;
        const productB = slabToNPCMap.matrix0.multiplyMatrixMatrix(slabToNPCMap.matrix1);
        if (productB.isIdentity())
          numIdentity++;
        const product = result.matrix0.multiplyMatrixMatrix(result.matrix1);
        if (product.isIdentity())
          numIdentity++;
        if (numIdentity === 3)
            return result;
          */
        return result;
    }
    multiplyMapMap(other) {
        return new Map4d(this._matrix0.multiplyMatrixMatrix(other._matrix0), other._matrix1.multiplyMatrixMatrix(this._matrix1));
    }
    reverseInPlace() {
        const temp = this._matrix0;
        this._matrix0 = this._matrix1;
        this._matrix1 = temp;
    }
    /** return a Map4d whose transform0 is
     * other.transform0 * this.transform0 * other.transform1
     */
    sandwich0This1(other) {
        return new Map4d(other._matrix0.multiplyMatrixMatrix(this._matrix0.multiplyMatrixMatrix(other._matrix1)), other._matrix0.multiplyMatrixMatrix(this._matrix1.multiplyMatrixMatrix(other._matrix1)));
    }
    /** return a Map4d whose transform0 is
     * other.transform1 * this.transform0 * other.transform0
     */
    sandwich1This0(other) {
        return new Map4d(other._matrix1.multiplyMatrixMatrix(this._matrix0.multiplyMatrixMatrix(other._matrix0)), other._matrix1.multiplyMatrixMatrix(this._matrix1.multiplyMatrixMatrix(other._matrix0)));
    }
} // Map4d
exports.Map4d = Map4d;
//# sourceMappingURL=Map4d.js.map