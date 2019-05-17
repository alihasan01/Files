"use strict";
/*---------------------------------------------------------------------------------------------
* Copyright (c) 2018 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
/** @module Bspline */
// import { Point2d } from "../Geometry2d";
/* tslint:disable:variable-name jsdoc-format no-empty no-console*/
const Point3dVector3d_1 = require("../geometry3d/Point3dVector3d");
const Geometry_1 = require("../Geometry");
/** Bspline knots and poles for 1d-to-Nd. */
class BSpline1dNd {
    get degree() { return this.knots.degree; }
    get order() { return this.knots.degree + 1; }
    get numSpan() { return this.numPoles - this.knots.degree; }
    get numPoles() { return this.packedData.length / this.poleLength; }
    getPoint3dPole(i, result) { return Point3dVector3d_1.Point3d.createFromPacked(this.packedData, i, result); }
    /**
     * initialize arrays for given spline dimensions.
     * @param numPoles number of poles
     * @param poleLength number of coordinates per pole (e.g.. 3 for 3D unweighted, 4 for 3d weighted, 2 for 2d unweighted, 3 for 2d weigthed)
     * @param order number of poles in support for a section of the bspline
     */
    constructor(numPoles, poleLength, order, knots) {
        this.knots = knots;
        this.packedData = new Float64Array(numPoles * poleLength);
        this.poleLength = poleLength;
        this.basisBuffer = new Float64Array(order);
        this.poleBuffer = new Float64Array(poleLength);
        this.basisBuffer1 = new Float64Array(order);
        this.basisBuffer2 = new Float64Array(order);
        this.poleBuffer1 = new Float64Array(poleLength);
        this.poleBuffer2 = new Float64Array(poleLength);
    }
    static create(numPoles, poleLength, order, knots) {
        return new BSpline1dNd(numPoles, poleLength, order, knots);
    }
    spanFractionToKnot(span, localFraction) {
        return this.knots.spanFractionToKnot(span, localFraction);
    }
    // ASSUME f is sized for {order} basis funtions !!!
    evaluateBasisFunctionsInSpan(spanIndex, spanFraction, f, df, ddf) {
        if (spanIndex < 0)
            spanIndex = 0;
        if (spanIndex >= this.numSpan)
            spanIndex = this.numSpan - 1;
        const knotIndex0 = spanIndex + this.degree - 1;
        const globalKnot = this.knots.baseKnotFractionToKnot(knotIndex0, spanFraction);
        return df ?
            this.knots.evaluateBasisFunctions1(knotIndex0, globalKnot, f, df, ddf) :
            this.knots.evaluateBasisFunctions(knotIndex0, globalKnot, f);
    }
    evaluateBuffersInSpan(spanIndex, spanFraction) {
        this.evaluateBasisFunctionsInSpan(spanIndex, spanFraction, this.basisBuffer);
        this.sumPoleBufferForSpan(spanIndex);
    }
    evaluateBuffersInSpan1(spanIndex, spanFraction) {
        this.evaluateBasisFunctionsInSpan(spanIndex, spanFraction, this.basisBuffer, this.basisBuffer1);
        this.sumPoleBufferForSpan(spanIndex);
        this.sumPoleBuffer1ForSpan(spanIndex);
    }
    /** sum poles by the weights in the basisBuffer, using poles for given span */
    sumPoleBufferForSpan(spanIndex) {
        this.poleBuffer.fill(0);
        let k = spanIndex * this.poleLength;
        for (const f of this.basisBuffer) {
            for (let j = 0; j < this.poleLength; j++) {
                this.poleBuffer[j] += f * this.packedData[k++];
            }
        }
    }
    /** sum poles by the weights in the basisBuffer, using poles for given span */
    sumPoleBuffer1ForSpan(spanIndex) {
        this.poleBuffer1.fill(0);
        let k = spanIndex * this.poleLength;
        for (const f of this.basisBuffer1) {
            for (let j = 0; j < this.poleLength; j++) {
                this.poleBuffer1[j] += f * this.packedData[k++];
            }
        }
    }
    /** sum poles by the weights in the basisBuffer, using poles for given span */
    sumPoleBuffer2ForSpan(spanIndex) {
        this.poleBuffer2.fill(0);
        let k = spanIndex * this.poleLength;
        for (const f of this.basisBuffer2) {
            for (let j = 0; j < this.poleLength; j++) {
                this.poleBuffer2[j] += f * this.packedData[k++];
            }
        }
    }
    evaluateBuffersAtKnot(u, numDerivative = 0) {
        const knotIndex0 = this.knots.knotToLeftKnotIndex(u);
        if (numDerivative < 1) {
            this.knots.evaluateBasisFunctions(knotIndex0, u, this.basisBuffer);
            this.sumPoleBufferForSpan(knotIndex0 - this.degree + 1);
        }
        else if (numDerivative === 1) {
            this.knots.evaluateBasisFunctions1(knotIndex0, u, this.basisBuffer, this.basisBuffer1);
            this.sumPoleBufferForSpan(knotIndex0 - this.degree + 1);
            this.sumPoleBuffer1ForSpan(knotIndex0 - this.degree + 1);
        }
        else {
            this.knots.evaluateBasisFunctions1(knotIndex0, u, this.basisBuffer, this.basisBuffer1, this.basisBuffer2);
            this.sumPoleBufferForSpan(knotIndex0 - this.degree + 1);
            this.sumPoleBuffer1ForSpan(knotIndex0 - this.degree + 1);
            this.sumPoleBuffer2ForSpan(knotIndex0 - this.degree + 1);
        }
    }
    reverseInPlace() {
        // reverse poles in blocks ...
        const b = this.poleLength;
        const data = this.packedData;
        for (let i0 = 0, j0 = b * (this.numPoles - 1); i0 < j0; i0 += b, j0 -= b) {
            let t = 0;
            for (let i = 0; i < b; i++) {
                t = data[i0 + i];
                data[i0 + i] = data[j0 + i];
                data[j0 + i] = t;
            }
        }
        this.knots.reflectKnots();
    }
    /**
     * Test if the leading and trailing polygon coordinates are replicated in the manner of a "closed" bspline polygon which has been expanded
     * to act as a normal bspline.
     * @returns true if `degree` leading and trailing polygon blocks match
     */
    testCloseablePolygon() {
        const degree = this.degree;
        const blockSize = this.poleLength;
        const indexDelta = (this.numPoles - this.degree) * blockSize;
        const data = this.packedData;
        const numValuesToTest = degree * blockSize;
        for (let i0 = 0; i0 < numValuesToTest; i0++) {
            if (!Geometry_1.Geometry.isSameCoordinate(data[i0], data[i0 + indexDelta]))
                return false;
        }
        return true;
    }
}
exports.BSpline1dNd = BSpline1dNd;
//# sourceMappingURL=BSpline1dNd.js.map