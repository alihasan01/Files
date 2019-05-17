/** @module Utility */
/**
 * @docs-package-description
 * The geometry-core package contains classes for working with CAD geometry:  points, vectors, curves, surfaces, and analytic solids
 */
/**
 * @docs-group-description CartesianGeometry
 * Points, Vectors, Planes, and Transformations for x,y,z geometry.
 * * Fundamental cartesian geometry objects:
 * * * Point2d, Point3d -- points with x,y,z coordinates
 * * * Vector2d, Vector3d -- vectors with x,y,z coordinates
 * * * Matrix3d -- 3x3 matrix
 * * * * commonly used for pure rotations
 * * * * scale and skew entries are also allowed.
 * * * Transform -- an origin and axes.
 * * * Range1d, Range2d, Range3d -- subsets of 1d, 2d, and 3d space bounded by low and high values.
 * * * Ray3d -- a ray defined by origin and direction vector
 * * * Plane3dByOriginAndUnitNormal -- a plane defined by an origin and a single vector which is perpendicular to the plane
 * * * plane3dByOriginAndVectors -- a plane defined by an origin and two vectors in the plane.
 * * Angles
 * * * Angle -- a strongly typed angle object whose method names make it clear whether input and outputs are degrees or radians.
 * * * AngleSweep -- an angular interval
 * * * YawPitchAndRollAngles -- 3 angles that define a rotated coordinate system.
 * * Utility classes
 * * * FrameBuilder -- construction of coordinate frames from mixed data sources.
 * * * ClipPlane -- a single plane
 * * * ConvexClipPlaneSet -- an array of planes bounding a convex volume
 * * * ClipPlaneSet -- an array of ConvexClipPlaneSet, defining the union of their volumes
 * * * Constant -- various numeric values exported as readonly constants
 */
/**
 * @docs-group-description ArraysAndInterfaces
 * These classes support array operations and inheritance-based algorithms.
 * * Arrays
 * * * GrowableArray -- A carrier for a Float64Array, with methods that hide reallocation of the underlying array as contents are added.
 * * * Point2dArray, Point3dArray, Point4dArray, Vector3dArray -- miscellaneous operations on arrays of 2d and 3d points.
 * * Interfaces
 * * * GeometryHandler -- a double-dispatch protocol used for efficient implementation of algorithms that work on many geometry types.
 *
 */
/**
 * @docs-group-description Bspline
 * A bspline curve or surface is used for curved freeform geometry defined by controls points (sometimes called poles).
 * * BSplineCurve --  a curve in XYZ coordinates
 * * BSplineSurfaceXYZ -- a surface with XYZ
 * * BsplineSurfaceXYZW -- a surface with weighted (rational) XYZ coordinates
 * * KnotVector -- vector of breakpoints in bspline definitions.
 */
/**
 * @docs-group-description Curve
 * Curves in the GeometryQuery hierarchy: LineSegment3d, LineString3d, Arc3d, TransitionSpiral3d
 * * CurvePrimitive -- base class for parametric curves
 * * * LineSegment3d -- a (bounded) portion of an unbounded line
 * * * Arc3d -- a circular or elliptic arc
 * * * LineString3d -- a sequence of points joined by line segments
 * * * TransitionSpiral -- controlled transition between curvatures
 * * Support classes
 * * PointString3d -- a sequence of isolated points
 * * StrokeOptions -- tolerances to describe stroking accuracy
 * * RecursiveCurveProcessor, RecursiveCurveProcessorWithStack -- algorithmic support for trees with CurvePrimitives at the leaf level.
 */
/**
 * @docs-group-description Numerics
 * The Numerics classes have geometric and numeric methods used during large algorithms in other classes.
 */
/**
 * @docs-group-description Polyface
 * A Polyface is a mesh structure with arrays of points that are shared among multiple incident facets.
 */
/**
 * @docs-group-description Serialization
 * These classes are related to serialization of geometry classes.
 * * IModelJson.Reader, IModelJson.Writer -- Conversion of in-memory geometry objects to json objects for persistence and transmission.
 */
/**
 * @docs-group-description Solid
 * Analytic Solids in the GeometryQuery hierarchy: Box, Sphere, Cone, TorusPipe, LinearSweep, RotationalSweep, RuledSweep
 * * Box -- a box solid.  This is usually rectangular on all faces, but can in one directly like a view frustum
 * * Sphere -- a sphere
 * * Cone -- a cone or cylinder
 * * TorusPipe -- a pipe elbow
 * * LinearSweep -- a linear sweep of a base contour
 * * RotationalSweep -- a rotational sweep of a base contour
 * * RuledSweep -- two or more similarly structured contours joined by linear rule lines.
 */
/**
 * @docs-group-description Utility
 * These modules and classes are outside the geometric structure
 * * geometry-core.ts -- gathers and exports class, so callers can import from geometry-core without knowning which classes
 *        are in which files.
 */
/**
 * @docs-group-description Topology
 * The Topology classes provide adjacency structures used in triangulations.
 */
export * from "./geometry3d/Point2dVector2d";
export * from "./geometry3d/Point3dVector3d";
export * from "./geometry3d/XYZProps";
export * from "./geometry3d/PointHelpers";
export * from "./geometry3d/Transform";
export * from "./geometry3d/Matrix3d";
export * from "./geometry3d/Range";
export * from "./geometry3d/GrowableFloat64Array";
export * from "./geometry3d/GrowableXYZArray";
export * from "./geometry3d/GrowableBlockedArray";
export * from "./geometry3d/FrameBuilder";
export * from "./geometry3d/GeometryHandler";
export * from "./geometry3d/IndexedXYZCollection";
export * from "./geometry3d/OrderedRotationAngles";
export * from "./geometry3d/Ray3d";
export * from "./geometry3d/Plane3dByOriginAndUnitNormal";
export * from "./geometry3d/Plane3dByOriginAndVectors";
export * from "./Geometry";
export * from "./geometry3d/Angle";
export * from "./geometry3d/YawPitchRollAngles";
export * from "./geometry3d/AngleSweep";
export * from "./Constant";
export * from "./clipping/ClipPlane";
export * from "./clipping/ConvexClipPlaneSet";
export * from "./clipping/UnionOfConvexClipPlaneSets";
export * from "./clipping/ClipPrimitive";
export * from "./clipping/ClipVector";
export * from "./clipping/ClipUtils";
export * from "./numerics/ConvexPolygon2d";
export * from "./geometry4d/PlaneByOriginAndVectors4d";
export * from "./geometry4d/Point4d";
export * from "./geometry4d/Matrix4d";
export * from "./geometry4d/Map4d";
export * from "./geometry4d/MomentData";
export * from "./numerics/BezierPolynomials";
export * from "./numerics/Newton";
export * from "./numerics/Complex";
export * from "./numerics/Polynomials";
export * from "./numerics/Quadrature";
export * from "./numerics/Range1dArray";
export * from "./numerics/TriDiagonalSystem";
export * from "./curve/Arc3d";
export * from "./curve/ConstructCurveBetweenCurves";
export * from "./curve/CurveCollection";
export * from "./curve/CurveChain";
export * from "./curve/Loop";
export * from "./curve/ParityRegion";
export * from "./curve/Path";
export * from "./curve/UnionRegion";
export * from "./curve/CurveCurveIntersectXY";
export * from "./curve/CurvePrimitive";
export * from "./curve/CurveLocationDetail";
export * from "./curve/CoordinateXYZ";
export * from "./curve/GeometryQuery";
export * from "./curve/CurveProcessor";
export * from "./curve/LineSegment3d";
export * from "./curve/LineString3d";
export * from "./curve/PointString3d";
export * from "./curve/StrokeOptions";
export * from "./curve/TransitionSpiral";
export * from "./solid/Box";
export * from "./solid/Cone";
export * from "./solid/LinearSweep";
export * from "./solid/RotationalSweep";
export * from "./solid/RuledSweep";
export * from "./solid/SolidPrimitive";
export * from "./solid/Sphere";
export * from "./solid/SweepContour";
export * from "./solid/TorusPipe";
export * from "./bspline/Bezier1dNd";
export * from "./bspline/BezierCurveBase";
export * from "./bspline/BezierCurve3d";
export * from "./bspline/BezierCurve3dH";
export * from "./bspline/BSplineCurve";
export * from "./bspline/BSpline1dNd";
export * from "./bspline/BSplineCurve3dH";
export * from "./bspline/BSplineSurface";
export * from "./bspline/KnotVector";
export * from "./polyface/BoxTopology";
export * from "./polyface/PolyfaceData";
export * from "./polyface/Polyface";
export * from "./polyface/PolyfaceBuilder";
export * from "./polyface/PolyfaceQuery";
export * from "./topology/Graph";
export * from "./topology/Triangulation";
export * from "./serialization/IModelJsonSchema";
export * from "./serialization/DeepCompare";
//# sourceMappingURL=geometry-core.d.ts.map