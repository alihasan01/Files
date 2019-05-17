"use strict";
/*---------------------------------------------------------------------------------------------
* Copyright (c) 2018 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
/** @module Bspline */
// import { Point2d } from "../Geometry2d";
/* tslint:disable:variable-name jsdoc-format no-empty no-console*/
const Geometry_1 = require("../Geometry");
const PointHelpers_1 = require("../geometry3d/PointHelpers");
/**
 * Array of non-decreasing numbers acting as a knot array for bsplines.
 *
 * * Essential identity: numKnots = numPoles + order = numPoles + degree - 1
 * * Various bspline libraries have confusion over how many "end knots" are needed. "Many" libraries (including Microstation)
 *     incorrectly demand "order" knots at each end for clamping.   But only "order - 1" are really needed.
 * * This class uses the "order-1" convention.
 * * This class provides queries to convert among spanIndex and knotIndex
 * * A span is a single interval of the knots.
 * * The left knot of span {k} is knot {k+degree-1}
 * * This class provides queries to convert among spanFraction, fraction of knot range, and knot
 * * core computations (evaluateBasisFucntions) have leftKnotIndex and global knot value as inputs.  Caller's need to
 * know their primary values (global knot, spanFraction).
 */
class KnotVector {
    /**
     *
     * * If knots is a number array or Float64Array, the those values become the local knot array.
     * * If knots is a simple number, the local knot array is allocated to that size but left as zeros.
     * @param knots
     * @param degree
     */
    constructor(knots, degree) {
        this.degree = degree;
        this._possibleWrap = false;
        // default values to satisfy compiler -- real values hapn setupFixedValues or final else defers to user
        this._knot0 = 0.0;
        this._knot1 = 1.0;
        // satisfy the initialize checker ..
        if (Array.isArray(knots)) {
            this.knots = new Float64Array(knots.length);
            this.setKnots(knots);
            this.setupFixedValues();
        }
        else if (knots instanceof Float64Array) {
            this.knots = knots.slice();
            this.setupFixedValues();
        }
        else { // caller is responsible for filling array separately ...
            this.knots = new Float64Array(knots);
        }
    }
    get leftKnot() { return this._knot0; }
    get rightKnot() { return this._knot1; }
    get leftKnotIndex() { return this.degree - 1; }
    get rightKnotIndex() { return this.knots.length - this.degree; }
    get wrappable() { return this._possibleWrap; }
    set wrappable(value) { this._possibleWrap = value; }
    get numSpans() { return this.rightKnotIndex - this.leftKnotIndex; }
    /** copy degree and knots to a new KnotVector. */
    clone() { return new KnotVector(this.knots, this.degree); }
    setupFixedValues() {
        // These should be read-only . ..
        this._knot0 = this.knots[this.degree - 1];
        this._knot1 = this.knots[this.knots.length - this.degree];
    }
    /** @returns Return the total knot distance from beginning to end. */
    get knotLength01() { return this._knot1 - this._knot0; }
    /** @returns true if all numeric values have wraparound conditions for "closed" knotVector. */
    testClosable() {
        const leftKnotIndex = this.leftKnotIndex;
        const rightKnotIndex = this.rightKnotIndex;
        const period = this.rightKnot - this.leftKnot;
        const degree = this.degree;
        const indexDelta = rightKnotIndex - leftKnotIndex;
        for (let k0 = leftKnotIndex - degree + 1; k0 < leftKnotIndex + degree - 1; k0++) {
            const k1 = k0 + indexDelta;
            if (!Geometry_1.Geometry.isSameCoordinate(this.knots[k0] + period, this.knots[k1]))
                return false;
        }
        return true;
    }
    isAlmostEqual(other) {
        if (this.degree !== other.degree)
            return false;
        return PointHelpers_1.NumberArray.isAlmostEqual(this.knots, other.knots, KnotVector.knotTolerance);
    }
    setKnots(knots, skipFirstAndLast) {
        const numAllocate = skipFirstAndLast ? knots.length - 2 : knots.length;
        if (numAllocate !== this.knots.length)
            this.knots = new Float64Array(numAllocate);
        if (skipFirstAndLast) {
            for (let i = 1; i + 1 < knots.length; i++)
                this.knots[i - 1] = knots[i];
        }
        else {
            for (let i = 0; i < knots.length; i++)
                this.knots[i] = knots[i];
        }
        this.setupFixedValues();
    }
    /**
     * Create knot vector with {degree-1} replicated knots at start and end, and uniform knots between.
     * @param numPoles Number of poles
     * @param degree degree of polynomial
     * @param a0 left knot value for active interval
     * @param a1 right knot value for active interval
     */
    static createUniformClamped(numPoles, degree, a0, a1) {
        const knots = new KnotVector(numPoles + degree - 1, degree);
        let k = 0;
        for (let m = 0; m < degree; m++)
            knots.knots[k++] = a0;
        const du = 1.0 / (numPoles - degree);
        for (let i = 1; i + degree < numPoles; i++)
            knots.knots[k++] = a0 + i * du * (a1 - a0);
        for (let m = 0; m < degree; m++)
            knots.knots[k++] = a1;
        knots.setupFixedValues();
        return knots;
    }
    /**
     * Create knot vector with {degree-1} replicated knots at start and end, and uniform knots between.
     * @param  numInterval number of intervals in knot space.  (NOT POLE COUNT)
     * @param degree degree of polynomial
     * @param a0 left knot value for active interval
     * @param a1 right knot value for active interval
     */
    static createUniformWrapped(numInterval, degree, a0, a1) {
        const knots = new KnotVector(numInterval + 2 * degree - 1, degree);
        const du = 1.0 / numInterval;
        for (let i = 1 - degree, k = 0; i < numInterval + degree; i++, k++) {
            knots.knots[k] = Geometry_1.Geometry.interpolate(a0, i * du, a1);
        }
        knots.setupFixedValues();
        return knots;
    }
    /**
     * Create knot vector with given knot values and degree.
     * @param knotArray knot values
     * @param degree degree of polynomial
     * @param skipFirstAndLast true to skip class overclamped end knots.
     */
    static create(knotArray, degree, skipFirstAndLast) {
        const numAllocate = skipFirstAndLast ? knotArray.length - 2 : knotArray.length;
        const knots = new KnotVector(numAllocate, degree);
        knots.setKnots(knotArray, skipFirstAndLast);
        return knots;
    }
    /**
     * Return the average of degree consecutive knots begining at spanIndex.
     */
    grevilleKnot(spanIndex) {
        if (spanIndex < 0)
            return this.leftKnot;
        if (spanIndex > this.rightKnotIndex)
            return this.rightKnot;
        let sum = 0.0;
        for (let i = spanIndex; i < spanIndex + this.degree; i++)
            sum += this.knots[i];
        return sum / this.degree;
    }
    /** Return an array sized for a set of the basis function values. */
    createBasisArray() { return new Float64Array(this.degree + 1); }
    // public createTargetArray(numCoff: number): Float64Array { return new Float64Array(numCoff); }
    baseKnotFractionToKnot(knotIndex0, localFraction) {
        const knot0 = this.knots[knotIndex0];
        return knot0 + localFraction * (this.knots[knotIndex0 + 1] - knot0);
    }
    spanFractionToKnot(spanIndex, localFraction) {
        const k = this.spanIndexToLeftKnotIndex(spanIndex);
        return this.knots[k] + localFraction * (this.knots[k + 1] - this.knots[k]);
    }
    spanFractionToFraction(spanIndex, localFraction) {
        const knot = this.spanFractionToKnot(spanIndex, localFraction);
        return (knot - this.leftKnot) / (this.rightKnot - this.leftKnot);
    }
    fractionToKnot(fraction) {
        return Geometry_1.Geometry.interpolate(this.knots[this.degree - 1], fraction, this.knots[this.knots.length - this.degree]);
    }
    /**
     * Evaluate basis fucntions f[] at knot value u.
     *
     * @param u knot value for evaluation
     * @param f array of basis values.  ASSUMED PROPER LENGTH
     */
    evaluateBasisFunctions(knotIndex0, u, f) {
        f[0] = 1.0;
        if (this.degree < 1)
            return;
        // direct compute for linear part ...
        const u0 = this.knots[knotIndex0];
        const u1 = this.knots[knotIndex0 + 1];
        f[1] = (u - u0) / (u1 - u0);
        f[0] = 1.0 - f[1];
        if (this.degree < 2)
            return;
        for (let depth = 1; depth < this.degree; depth++) {
            let kLeft = knotIndex0 - depth;
            let kRight = kLeft + depth + 1;
            let gCarry = 0.0;
            for (let step = 0; step <= depth; step++) {
                const tLeft = this.knots[kLeft++];
                const tRight = this.knots[kRight++];
                const fraction = (u - tLeft) / (tRight - tLeft);
                const g1 = f[step] * fraction;
                const g0 = f[step] * (1.0 - fraction);
                f[step] = gCarry + g0;
                gCarry = g1;
            }
            f[depth + 1] = gCarry;
        }
    }
    /**
     * Evaluate basis fucntions f[] at knot value u.
     *
     * @param u knot value for evaluation
     * @param f array of basis values.  ASSUMED PROPER LENGTH
     */
    evaluateBasisFunctions1(knotIndex0, u, f, df, ddf) {
        f[0] = 1.0;
        df[0] = 0.0;
        if (this.degree < 1)
            return;
        // direct compute for linear part ...
        const u0 = this.knots[knotIndex0];
        const u1 = this.knots[knotIndex0 + 1];
        // ah = 1/(u1-u0)      is the derivative of fraction0
        // (-ah) is the derivative of fraction1.
        let ah = 1.0 / (u1 - u0);
        f[1] = (u - u0) * ah;
        f[0] = 1.0 - f[1];
        df[0] = -ah;
        df[1] = ah;
        if (ddf) { // first derivative started constant, second derivative started zero.
            ddf[0] = 0.0;
            ddf[1] = 0.0;
        }
        if (this.degree < 2)
            return;
        for (let depth = 1; depth < this.degree; depth++) {
            let kLeft = knotIndex0 - depth;
            let kRight = kLeft + depth + 1;
            let gCarry = 0.0;
            let dgCarry = 0.0;
            let ddgCarry = 0.0;
            // f, df, ddf, are each row vectors with product of `step` ilnear terms.
            // f is multiplied on the right by matrix V.  Each row has 2 nonzero entries (which sum to 1)  (0,0,1-fraction, fraction,0,0,0)
            //    Each row of the derivative dV is two entries (0,0, -1/h, 1/h,0,0,0)
            // Hence fnew = f * V
            //      dfnew = df * V + f * dV
            //      ddfnew = ddf * V + df*dV + df * dV + f * ddV
            // but ddV is zero so
            //      ddfnew = ddf * V + 2 * df * dV
            for (let step = 0; step <= depth; step++) {
                const tLeft = this.knots[kLeft++];
                const tRight = this.knots[kRight++];
                ah = 1.0 / (tRight - tLeft);
                const fraction = (u - tLeft) * ah;
                const fraction1 = 1.0 - fraction;
                const g1 = f[step] * fraction;
                const g0 = f[step] * fraction1;
                const dg1 = df[step] * fraction + f[step] * ah;
                const dg0 = df[step] * fraction1 - f[step] * ah;
                const dfSave = 2.0 * df[step] * ah;
                f[step] = gCarry + g0;
                df[step] = dgCarry + dg0;
                gCarry = g1;
                dgCarry = dg1;
                if (ddf) { // do the backward reference to df before rewriting df !!!
                    const ddg1 = ddf[step] * fraction + dfSave;
                    const ddg0 = ddf[step] * fraction1 - dfSave;
                    ddf[step] = ddgCarry + ddg0;
                    ddgCarry = ddg1;
                }
            }
            f[depth + 1] = gCarry;
            df[depth + 1] = dgCarry;
            if (ddf)
                ddf[depth + 1] = ddgCarry;
        }
    }
    knotToLeftKnotIndex(u) {
        // Anything to left is in the first span . .
        const firstLeftKnot = this.degree - 1;
        if (u < this.knots[firstLeftKnot + 1])
            return firstLeftKnot;
        // Anything to right is in the last span ...
        const lastLeftKnot = this.knots.length - this.degree - 1;
        if (u >= this.knots.length - this.degree)
            return this.knots[lastLeftKnot];
        // ugh ... linear search ...
        for (let i = firstLeftKnot + 1; i < lastLeftKnot; i++)
            if (u < this.knots[i + 1])
                return i; // testing against right side skips over multiple knot cases???
        return lastLeftKnot;
    }
    /**
     * Given a span index, return the index of the knot at its left.
     * @param spanIndex index of span
     */
    spanIndexToLeftKnotIndex(spanIndex) {
        const d = this.degree;
        if (spanIndex <= 0.0)
            return d - 1;
        return Math.min(spanIndex + d - 1, this.knots.length - d);
    }
    spanIndexToSpanLength(spanIndex) {
        const k = this.spanIndexToLeftKnotIndex(spanIndex);
        return this.knots[k + 1] - this.knots[k];
    }
    /**
     * Given a span index, test if it is withn range and has nonzero length.
     * * note that a false return does not imply there are no more spans.  This may be a double knot (zero length span) followed by more real spans
     * @param spanIndex index of span to test.
     */
    isIndexOfRealSpan(spanIndex) {
        if (spanIndex >= 0 && spanIndex < this.knots.length - this.degree)
            return !Geometry_1.Geometry.isSmallMetricDistance(this.spanIndexToSpanLength(spanIndex));
        return false;
    }
    reflectKnots() {
        const a = this.leftKnot;
        const b = this.rightKnot;
        const numKnots = this.knots.length;
        for (let i = 0; i < numKnots; i++)
            this.knots[i] = a + (b - this.knots[i]);
        this.knots.reverse();
    }
    /**
     * return a simple array form of the knots.  optionally replicate the first and last
     * in classic over-clamped manner
     */
    copyKnots(includeExtraEndKnot) {
        const wrap = this.wrappable && this.testClosable();
        const leftIndex = this.leftKnotIndex;
        const rightIndex = this.rightKnotIndex;
        const a0 = this.leftKnot;
        const a1 = this.rightKnot;
        const delta = a1 - a0;
        const degree = this.degree;
        const values = [];
        if (includeExtraEndKnot) {
            if (wrap) {
                values.push(this.knots[rightIndex - degree] - delta);
            }
            else {
                values.push(this.knots[0]);
            }
        }
        for (const u of this.knots)
            values.push(u);
        if (includeExtraEndKnot) {
            if (wrap) {
                values.push(this.knots[leftIndex + degree] + delta);
            }
            else
                values.push(values[values.length - 1]);
        }
        return values;
    }
}
KnotVector.knotTolerance = 1.0e-9;
exports.KnotVector = KnotVector;
//# sourceMappingURL=KnotVector.js.map