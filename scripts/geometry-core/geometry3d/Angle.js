"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*---------------------------------------------------------------------------------------------
* Copyright (c) 2018 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
const Geometry_1 = require("../Geometry");
/**
 * Carries the numeric value of an angle.
 * * The numeric value is private, and callers should not know or care whether it is in degrees or radians.
 * * The various access method are named so that callers can specify whether untyped numbers passed in or out are degrees or radians.
 */
class Angle {
    constructor(radians = 0, degrees) { this._radians = radians; this._degrees = degrees; }
    clone() { return new Angle(this._radians, this._degrees); }
    /**
     * Return a new Angle object for angle given in degrees.
     * @param degrees angle in degrees
     */
    static createDegrees(degrees) { return new Angle(Angle.degreesToRadians(degrees), degrees); }
    /**
     * Return a (new) Angle object for a value given in radians.
     * @param radians angle in radians
     */
    static createRadians(radians) { return new Angle(radians); }
    /**
     * Set this angle to a value given in radians.
     * @param radians angle given in radians
     */
    setRadians(radians) { this._radians = radians; this._degrees = undefined; }
    /**
     * Set this angle to a value given in degrees.
     * @param degrees angle given in degrees.
     */
    setDegrees(degrees) { this._radians = Angle.degreesToRadians(degrees); this._degrees = degrees; }
    /** Create an angle for a full circle. */
    static create360() { return new Angle(Math.PI * 2.0, 360.0); }
    /**
     * @return a (strongly typed) Angle whose tangent is `numerator/denominator`, using the signs of both in determining the (otherwise ambiguous)
     * quadrant.
     * @param numerator numerator for tangent
     * @param denominator denominator for tangent
     */
    static createAtan2(numerator, denominator) { return new Angle(Math.atan2(numerator, denominator)); }
    /**
     * Copy all contents of `other` to this Angle.
     * @param other source data
     */
    setFrom(other) { this._radians = other._radians; this._degrees = other._degrees; }
    /**
     * Create an Angle from a JSON object
     * @param json object from JSON.parse. If a number, value is in *DEGREES*
     * @param defaultValRadians if json is undefined, default value in radians.
     * @return a new Angle
     */
    static fromJSON(json, defaultValRadians) {
        const val = new Angle();
        val.setFromJSON(json, defaultValRadians);
        return val;
    }
    /**
     * set an Angle from a JSON object
     * * A simple number is degrees.
     * * specified `json.degrees` or `json._degrees` is degree value.
     * * specified `son.radians` or `json._radians` is radians value.
     * @param json object from JSON.parse. If a number, value is in *DEGREES*
     * @param defaultValRadians if json is undefined, default value in radians.
     */
    setFromJSON(json, defaultValRadians) {
        this._radians = defaultValRadians ? defaultValRadians : 0;
        if (!json)
            return;
        if (typeof json === "number") {
            this.setDegrees(json);
        }
        else if (typeof json.degrees === "number") {
            this.setDegrees(json.degrees);
        }
        else if (typeof json._degrees === "number") {
            this.setDegrees(json._degrees);
        }
        else if (typeof json.radians === "number") {
            this.setRadians(json.radians);
        }
        else if (typeof json._radians === "number") {
            this.setRadians(json._radians);
        }
    }
    /** Convert an Angle to a JSON object as a number in degrees */
    toJSON() { return this.degrees; }
    toJSONRadians() { return { radians: this.radians }; }
    /** @returns Return the angle measured in radians. */
    get radians() { return this._radians; }
    /** @returns Return the angle measured in degrees. */
    get degrees() { return this._degrees !== undefined ? this._degrees : Angle.radiansToDegrees(this._radians); }
    /**
     * Convert an angle in degrees to radians.
     * @param degrees angle in degrees
     */
    static degreesToRadians(degrees) { return degrees * Math.PI / 180; }
    /**
     * Convert an angle in radians to degrees.
     * @param degrees angle in radians
     */
    static radiansToDegrees(radians) {
        if (radians < 0)
            return -Angle.radiansToDegrees(-radians);
        // Now radians is positive ...
        const pi = Math.PI;
        const factor = 180.0 / pi;
        if (radians <= 0.25 * pi)
            return factor * radians;
        if (radians < 0.75 * pi)
            return 90.0 + 180 * ((radians - 0.5 * pi) / pi);
        if (radians <= 1.25 * pi)
            return 180.0 + 180 * ((radians - pi) / pi);
        if (radians <= 1.75 * pi)
            return 270.0 + 180 * ((radians - 1.5 * pi) / pi);
        // all larger radians reference from 360 degrees (2PI)
        return 360.0 + 180 * ((radians - 2.0 * pi) / pi);
    }
    /**
     * @returns Return the cosine of this Angle object's angle.
     */
    cos() { return Math.cos(this._radians); }
    /**
     * @returns Return the sine of this Angle object's angle.
     */
    sin() { return Math.sin(this._radians); }
    /**
     * @returns Return the tangent of this Angle object's angle.
     */
    tan() { return Math.tan(this._radians); }
    static isFullCircleRadians(radians) { return Math.abs(radians) >= Geometry_1.Geometry.fullCircleRadiansMinusSmallAngle; }
    get isFullCircle() { return Angle.isFullCircleRadians(this._radians); }
    /** Adjust a radians value so it is positive in 0..360 */
    static adjustDegrees0To360(degrees) {
        if (degrees >= 0) {
            const period = 360.0;
            if (degrees < period)
                return degrees;
            const numPeriods = Math.floor(degrees / period);
            return degrees - numPeriods * period;
        }
        // negative angle ...
        const radians1 = Angle.adjustDegrees0To360(-degrees);
        return 360.0 - radians1;
    }
    /** Adjust a radians value so it is positive in -180..180 */
    static adjustDegreesSigned180(degrees) {
        if (Math.abs(degrees) <= 180.0)
            return degrees;
        if (degrees >= 0) {
            const period = 360.0;
            const numPeriods = 1 + Math.floor((degrees - 180.0) / period);
            return degrees - numPeriods * period;
        }
        // negative angle ...
        return -Angle.adjustDegreesSigned180(-degrees);
    }
    /** Adjust a radians value so it is positive in 0..2Pi */
    static adjustRadians0To2Pi(radians) {
        if (radians >= 0) {
            const period = Math.PI * 2.0;
            if (radians < period)
                return radians;
            const numPeriods = Math.floor(radians / period);
            return radians - numPeriods * period;
        }
        // negative angle ...
        const radians1 = Angle.adjustRadians0To2Pi(-radians);
        return Math.PI * 2.0 - radians1;
    }
    /** Adjust a radians value so it is positive in -PI..PI */
    static adjustRadiansMinusPiPlusPi(radians) {
        if (Math.abs(radians) <= Math.PI)
            return radians;
        if (radians >= 0) {
            const period = Math.PI * 2.0;
            const numPeriods = 1 + Math.floor((radians - Math.PI) / period);
            return radians - numPeriods * period;
        }
        // negative angle ...
        return -Angle.adjustRadiansMinusPiPlusPi(-radians);
    }
    static zero() { return new Angle(0); }
    get isExactZero() { return this.radians === 0; }
    get isAlmostZero() { return Math.abs(this.radians) < Geometry_1.Geometry.smallAngleRadians; }
    /** Create an angle object with degrees adjusted into 0..360. */
    static createDegreesAdjustPositive(degrees) { return Angle.createDegrees(Angle.adjustDegrees0To360(degrees)); }
    /** Create an angle object with degrees adjusted into -180..180. */
    static createDegreesAdjustSigned180(degrees) { return Angle.createDegrees(Angle.adjustDegreesSigned180(degrees)); }
    /**
     * Test if two radians values are equivalent, allowing shift by full circle (i.e. by a multiple of `2*PI`)
     * @param radiansA first radians value
     * @param radiansB second radians value
     */
    static isAlmostEqualRadiansAllowPeriodShift(radiansA, radiansB) {
        // try to get simple conclusions with un-shifted radians ...
        const delta = Math.abs(radiansA - radiansB);
        if (delta <= Geometry_1.Geometry.smallAngleRadians)
            return true;
        const period = Math.PI * 2.0;
        if (Math.abs(delta - period) <= Geometry_1.Geometry.smallAngleRadians)
            return true;
        const numPeriod = Math.round(delta / period);
        const delta1 = delta - numPeriod * period;
        return Math.abs(delta1) <= Geometry_1.Geometry.smallAngleRadians;
    }
    /**
     * Test if this angle and other are equivalent, allowing shift by full circle (i.e. by a multiple of 360 degrees)
     */
    isAlmostEqualAllowPeriodShift(other) {
        return Angle.isAlmostEqualRadiansAllowPeriodShift(this._radians, other._radians);
    }
    /**
     * Test if two this angle and other are almost equal, NOT allowing shift by full circle multiples of 360 degrees.
     */
    isAlmostEqualNoPeriodShift(other) { return Math.abs(this._radians - other._radians) < Geometry_1.Geometry.smallAngleRadians; }
    /**
     * Test if two angle (in radians)  almost equal, NOT allowing shift by full circle multiples of `2 * PI`.
     * * (Same test as isAlmostEqualRadiansNoPeriodShift)
     */
    isAlmostEqual(other) { return this.isAlmostEqualNoPeriodShift(other); }
    /**
     * Test if two angle (in radians)  almost equal, NOT allowing shift by full circle multiples of `2 * PI`.
     */
    static isAlmostEqualRadiansNoPeriodShift(radiansA, radiansB) { return Math.abs(radiansA - radiansB) < Geometry_1.Geometry.smallAngleRadians; }
    /**
     * Test if dot product values indicate non-zero length perpendicular vectors.
     * @param dotUU dot product of vectorU with itself
     * @param dotVV dot product of vectorV with itself
     * @param dotUV dot product of vectorU with vectorV
     */
    static isPerpendicularDotSet(dotUU, dotVV, dotUV) {
        return dotUU > Geometry_1.Geometry.smallMetricDistanceSquared
            && dotVV > Geometry_1.Geometry.smallMetricDistanceSquared
            && dotUV * dotUV <= Geometry_1.Geometry.smallAngleRadiansSquared * dotUU * dotVV;
    }
    /**
     * Return cosine, sine, and radians for the half angle of a cosine,sine pair.
     * @param rCos2A cosine value (scaled by radius) for initial angle.
     * @param rSin2A sine value (scaled by radius) for final angle.
     */
    static trigValuesToHalfAngleTrigValues(rCos2A, rSin2A) {
        const r = Geometry_1.Geometry.hypotenuseXY(rCos2A, rSin2A);
        if (r < Geometry_1.Geometry.smallMetricDistance) {
            return { c: 1.0, s: 0.0, radians: 0.0 };
        }
        else {
            /* If the caller really gave you sine and cosine values, r should be 1.  However,*/
            /* to allow scaled values -- e.g. the x and y components of any vector -- we normalize*/
            /* right here.  This adds an extra sqrt and 2 divides to the whole process, but improves*/
            /* both the usefulness and robustness of the computation.*/
            let cosA = 1.0;
            let sinA = 0.0;
            const cos2A = rCos2A / r;
            const sin2A = rSin2A / r;
            if (cos2A >= 0.0) {
                /* Original angle in NE and SE quadrants.  Half angle in same quadrant */
                cosA = Math.sqrt(0.5 * (1.0 + cos2A));
                sinA = sin2A / (2.0 * (cosA));
            }
            else {
                if (sin2A > 0.0) {
                    /* Original angle in NW quadrant. Half angle in NE quadrant */
                    sinA = Math.sqrt(0.5 * (1.0 - cos2A));
                }
                else {
                    /* Original angle in SW quadrant. Half angle in SE quadrant*/
                    /* cosA comes out positive because both sines are negative. */
                    sinA = -Math.sqrt(0.5 * (1.0 - cos2A));
                }
                cosA = sin2A / (2.0 * (sinA));
            }
            return { c: cosA, s: sinA, radians: Math.atan2(sinA, cosA) };
        }
    }
    /** If value is close to -1, -0.5, 0, 0.5, 1, adjust it to the exact value. */
    static cleanupTrigValue(value, tolerance = 1.0e-15) {
        const absValue = Math.abs(value);
        if (absValue <= tolerance)
            return 0;
        let a = Math.abs(absValue - 0.5);
        if (a <= tolerance)
            return value < 0.0 ? -0.5 : 0.5;
        a = Math.abs(absValue - 1.0);
        if (a <= tolerance)
            return value < 0.0 ? -1.0 : 1.0;
        return value;
    }
    /**
     * Return the half angle cosine, sine, and radians for given dot products between vectors.
     * @param dotUU dot product of vectorU with itself
     * @param dotVV dot product of vectorV with itself
     * @param dotUV dot product of vectorU with vectorV
     */
    static dotProductsToHalfAngleTrigValues(dotUU, dotVV, dotUV, favorZero = true) {
        const rcos = dotUU - dotVV;
        const rsin = 2.0 * dotUV;
        if (favorZero && Math.abs(rsin) < Geometry_1.Geometry.smallAngleRadians * (Math.abs(dotUU) + Math.abs(dotVV)))
            return { c: 1.0, s: 0.0, radians: 0.0 };
        return Angle.trigValuesToHalfAngleTrigValues(rcos, rsin);
    }
    /**
     * * The returned angle is between 0 and PI
     * @return the angle between two vectors, with the vectors given as xyz components
     * @param ux x component of vector u
     * @param uy y component of vector u
     * @param uz z component of vector u
     * @param vx x component of vector v
     * @param vy y component of vector v
     * @param vz z component of vector v
     */
    static radiansBetweenVectorsXYZ(ux, uy, uz, vx, vy, vz) {
        //  const uu = ux * ux + uy * uy + uz * uz;
        const uDotV = ux * vx + uy * vy + uz * vz; // magU magV cos(theta)
        //    const vv = vx * vx + vy * vy + vz * vz;
        return Math.atan2(Geometry_1.Geometry.crossProductMagnitude(ux, uy, uz, vx, vy, vz), uDotV);
    }
}
Angle.piOver4Radians = 7.85398163397448280000e-001;
Angle.piOver2Radians = 1.57079632679489660000e+000;
Angle.piRadians = 3.14159265358979310000e+000;
Angle.pi2Radians = 6.28318530717958620000e+000;
Angle.degreesPerRadian = (45.0 / Angle.piOver4Radians);
Angle.radiansPerDegree = (Angle.piOver4Radians / 45.0);
Angle.piOver12Radians = 0.26179938779914943653855361527329;
exports.Angle = Angle;
//# sourceMappingURL=Angle.js.map