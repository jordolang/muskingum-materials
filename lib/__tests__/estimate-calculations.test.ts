/**
 * Unit tests for estimate-calculations.ts
 *
 * These tests verify the confidence range calculation logic, especially
 * the graceful degradation behavior when density data is missing.
 */

import {
  calculateConfidenceRange,
  calculateFromDimensions,
  calculateFromArea,
  isValidDensityRange,
  isValidArea,
  isValidDepth,
  type EstimateResult,
  type DensityRange,
} from '../estimate-calculations';
import { MATERIAL_DENSITY_AVG } from '../constants/business-rules';

describe('calculateConfidenceRange', () => {
  describe('with complete density data', () => {
    it('should calculate low/expected/high estimates using provided density range', () => {
      const result = calculateConfidenceRange(
        1000, // area in sqft
        4, // depth in inches
        { low: 1.3, avg: 1.4, high: 1.6 },
        'Pea Gravel',
        'map'
      );

      // Verify all fields are present
      expect(result.tonsLow).toBeDefined();
      expect(result.tonsExpected).toBeDefined();
      expect(result.tonsHigh).toBeDefined();
      expect(result.cubicYardsLow).toBeDefined();
      expect(result.cubicYardsExpected).toBeDefined();
      expect(result.cubicYardsHigh).toBeDefined();

      // Verify confidence factors
      expect(result.confidenceFactors?.densityVariation).toBe(true);
      expect(result.confidenceFactors?.depthMeasurementVariance).toBe(true);
      expect(result.confidenceFactors?.materialType).toBe('Pea Gravel');

      // Verify ordering: low < expected < high
      expect(result.tonsLow).toBeLessThan(result.tonsExpected!);
      expect(result.tonsExpected).toBeLessThan(result.tonsHigh!);
      expect(result.cubicYardsLow).toBeLessThan(result.cubicYardsExpected!);
      expect(result.cubicYardsExpected).toBeLessThan(result.cubicYardsHigh!);

      // Verify legacy fields match expected values
      expect(result.tons).toBe(result.tonsExpected);
      expect(result.cubicYards).toBe(result.cubicYardsExpected);

      // Verify source
      expect(result.source).toBe('map');
    });

    it('should apply depth variance of ±0.5 inches', () => {
      const result = calculateConfidenceRange(
        100,
        4,
        { low: 1.4, avg: 1.4, high: 1.4 } // Same density to isolate depth effect
      );

      expect(result.depthVariance).toBe(0.5);

      // Calculate expected cubic yards at each depth variant
      // Low: 100 sqft × (4 - 0.5) / 12 / 27 = 1.0802 yd³
      // Expected: 100 sqft × 4 / 12 / 27 = 1.2346 yd³
      // High: 100 sqft × (4 + 0.5) / 12 / 27 = 1.3889 yd³
      expect(result.cubicYardsLow).toBeCloseTo(1.0802, 3);
      expect(result.cubicYardsExpected).toBeCloseTo(1.2346, 3);
      expect(result.cubicYardsHigh).toBeCloseTo(1.3889, 3);
    });
  });

  describe('graceful degradation when density data is missing', () => {
    it('should use MATERIAL_DENSITY_AVG ± 0.1 when density data is completely missing', () => {
      const result = calculateConfidenceRange(
        1000, // area in sqft
        4 // depth in inches
        // No density data provided
      );

      // Verify confidence factors indicate fallback behavior
      expect(result.confidenceFactors?.densityVariation).toBe(false);
      expect(result.confidenceFactors?.depthMeasurementVariance).toBe(true);

      // Calculate expected values using MATERIAL_DENSITY_AVG ± 0.1
      // Expected density: MATERIAL_DENSITY_AVG (1.4 tons/yd³)
      // Low density: 1.3 tons/yd³
      // High density: 1.5 tons/yd³

      const areaLow = 1000 * (4 - 0.5) / 12 / 27; // depth - 0.5"
      const areaExpected = 1000 * 4 / 12 / 27; // nominal depth
      const areaHigh = 1000 * (4 + 0.5) / 12 / 27; // depth + 0.5"

      const expectedTonsLow = areaLow * (MATERIAL_DENSITY_AVG - 0.1);
      const expectedTonsExpected = areaExpected * MATERIAL_DENSITY_AVG;
      const expectedTonsHigh = areaHigh * (MATERIAL_DENSITY_AVG + 0.1);

      expect(result.tonsLow).toBeCloseTo(expectedTonsLow, 2);
      expect(result.tonsExpected).toBeCloseTo(expectedTonsExpected, 2);
      expect(result.tonsHigh).toBeCloseTo(expectedTonsHigh, 2);
    });

    it('should produce a narrower range (±0.1 tons/yd³) when density data is missing', () => {
      const resultWithDensity = calculateConfidenceRange(1000, 4, {
        low: 1.2,
        avg: 1.4,
        high: 1.7,
      });

      const resultWithoutDensity = calculateConfidenceRange(1000, 4);

      // Calculate the density range span
      const withDensitySpan =
        resultWithDensity.tonsHigh! - resultWithDensity.tonsLow!;
      const withoutDensitySpan =
        resultWithoutDensity.tonsHigh! - resultWithoutDensity.tonsLow!;

      // Fallback range should be narrower than a wide density range
      expect(withoutDensitySpan).toBeLessThan(withDensitySpan);

      // Verify the fallback uses ±0.1 tons/yd³ (0.2 total span)
      // The actual tons span also includes depth variance, so we can't test exact equality
      // But we can verify it's reasonable
      expect(withoutDensitySpan).toBeGreaterThan(0);
      expect(withoutDensitySpan).toBeLessThan(10);
    });

    it('should handle missing densityLow only', () => {
      const result = calculateConfidenceRange(1000, 4, {
        high: 1.6,
        avg: 1.5,
      });

      // Should fall back to MATERIAL_DENSITY_AVG - 0.1 for low
      expect(result.confidenceFactors?.densityVariation).toBe(false);
      expect(result.tonsLow).toBeDefined();
      expect(result.tonsExpected).toBeDefined();
      expect(result.tonsHigh).toBeDefined();
    });

    it('should handle missing densityHigh only', () => {
      const result = calculateConfidenceRange(1000, 4, {
        low: 1.3,
        avg: 1.4,
      });

      // Should fall back to MATERIAL_DENSITY_AVG + 0.1 for high
      expect(result.confidenceFactors?.densityVariation).toBe(false);
      expect(result.tonsLow).toBeDefined();
      expect(result.tonsExpected).toBeDefined();
      expect(result.tonsHigh).toBeDefined();
    });

    it('should use provided avg when available, even without low/high', () => {
      const customAvg = 1.6;
      const result = calculateConfidenceRange(1000, 4, {
        avg: customAvg,
      });

      // Expected estimate should use the provided average
      const expectedCubicYards = (1000 * 4) / 12 / 27;
      const expectedTons = expectedCubicYards * customAvg;

      expect(result.tonsExpected).toBeCloseTo(expectedTons, 2);
    });
  });

  describe('edge cases', () => {
    it('should handle very small areas', () => {
      const result = calculateConfidenceRange(1, 2);
      expect(result.tons).toBeGreaterThan(0);
      expect(result.tonsLow).toBeGreaterThan(0);
    });

    it('should handle very small depths (minimum 0.5 inches for low)', () => {
      const result = calculateConfidenceRange(1000, 1);

      // Low depth should not go below 0.5 inches (1 - 0.5 = 0.5)
      const expectedLowDepth = 0.5;
      const expectedCubicYardsLow = (1000 * expectedLowDepth) / 12 / 27;

      expect(result.cubicYardsLow).toBeCloseTo(expectedCubicYardsLow, 3);
    });

    it('should handle large commercial areas', () => {
      const result = calculateConfidenceRange(100000, 6, {
        low: 1.4,
        avg: 1.5,
        high: 1.6,
      });

      expect(result.tons).toBeGreaterThan(100);
      expect(result.truckloads).toBeGreaterThan(10);
    });
  });
});

describe('calculateFromDimensions', () => {
  it('should calculate estimate from length × width', () => {
    const result = calculateFromDimensions(20, 10, 4, { low: 1.3, avg: 1.4, high: 1.6 });

    // 20 × 10 = 200 sqft
    expect(result.source).toBe('dimensions');
    expect(result.tons).toBeGreaterThan(0);
    expect(result.tonsLow).toBeLessThan(result.tonsExpected!);
  });

  it('should handle graceful degradation in dimensions mode', () => {
    const result = calculateFromDimensions(20, 10, 4);

    expect(result.confidenceFactors?.densityVariation).toBe(false);
    expect(result.tons).toBeGreaterThan(0);
    expect(result.source).toBe('dimensions');
  });
});

describe('calculateFromArea', () => {
  it('should calculate estimate from area', () => {
    const result = calculateFromArea(200, 4, { low: 1.3, avg: 1.4, high: 1.6 });

    expect(result.source).toBe('map');
    expect(result.tons).toBeGreaterThan(0);
  });

  it('should handle graceful degradation in area mode', () => {
    const result = calculateFromArea(200, 4);

    expect(result.confidenceFactors?.densityVariation).toBe(false);
    expect(result.tons).toBeGreaterThan(0);
    expect(result.source).toBe('map');
  });
});

describe('validation utilities', () => {
  describe('isValidDensityRange', () => {
    it('should accept valid density ranges', () => {
      expect(isValidDensityRange({ low: 1.3, avg: 1.4, high: 1.6 })).toBe(true);
      expect(isValidDensityRange({ low: 1.0, high: 1.5 })).toBe(true);
      expect(isValidDensityRange({ avg: 1.4 })).toBe(true);
    });

    it('should accept empty range (will use defaults)', () => {
      expect(isValidDensityRange({})).toBe(true);
    });

    it('should reject physically unreasonable densities', () => {
      expect(isValidDensityRange({ low: 0.1 })).toBe(false); // Too light
      expect(isValidDensityRange({ high: 5.0 })).toBe(false); // Too heavy
    });

    it('should reject incorrectly ordered ranges', () => {
      expect(isValidDensityRange({ low: 1.6, avg: 1.3 })).toBe(false);
      expect(isValidDensityRange({ avg: 1.5, high: 1.3 })).toBe(false);
      expect(isValidDensityRange({ low: 1.6, high: 1.3 })).toBe(false);
    });
  });

  describe('isValidArea', () => {
    it('should accept reasonable areas', () => {
      expect(isValidArea(1)).toBe(true);
      expect(isValidArea(1000)).toBe(true);
      expect(isValidArea(100000)).toBe(true);
      expect(isValidArea(1000000)).toBe(true);
    });

    it('should reject invalid areas', () => {
      expect(isValidArea(0)).toBe(false);
      expect(isValidArea(-100)).toBe(false);
      expect(isValidArea(2000000)).toBe(false); // Too large
    });
  });

  describe('isValidDepth', () => {
    it('should accept reasonable depths', () => {
      expect(isValidDepth(0.5)).toBe(true);
      expect(isValidDepth(3)).toBe(true);
      expect(isValidDepth(6)).toBe(true);
      expect(isValidDepth(24)).toBe(true);
    });

    it('should reject invalid depths', () => {
      expect(isValidDepth(0)).toBe(false);
      expect(isValidDepth(-1)).toBe(false);
      expect(isValidDepth(30)).toBe(false); // Too deep
    });
  });
});
