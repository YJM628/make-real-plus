/**
 * Unit tests for rgbToHex utility function
 * Feature: floating-edit-panel-refactor
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { rgbToHex } from '../../utils/color/rgbToHex';

describe('rgbToHex', () => {
  describe('rgb() format (Requirement 4.2)', () => {
    it('should convert rgb(0, 0, 0) to #000000', () => {
      expect(rgbToHex('rgb(0, 0, 0)')).toBe('#000000');
    });

    it('should convert rgb(255, 255, 255) to #ffffff', () => {
      expect(rgbToHex('rgb(255, 255, 255)')).toBe('#ffffff');
    });

    it('should convert rgb(255, 0, 0) to #ff0000', () => {
      expect(rgbToHex('rgb(255, 0, 0)')).toBe('#ff0000');
    });

    it('should convert rgb(0, 128, 255) to #0080ff', () => {
      expect(rgbToHex('rgb(0, 128, 255)')).toBe('#0080ff');
    });

    it('should pad single-digit hex values with leading zero', () => {
      expect(rgbToHex('rgb(1, 2, 3)')).toBe('#010203');
    });
  });

  describe('rgba() format (Requirement 4.3)', () => {
    it('should convert rgba(255, 0, 0, 1) to #ff0000, ignoring alpha', () => {
      expect(rgbToHex('rgba(255, 0, 0, 1)')).toBe('#ff0000');
    });

    it('should convert rgba(0, 128, 255, 0.5) to #0080ff, ignoring alpha', () => {
      expect(rgbToHex('rgba(0, 128, 255, 0.5)')).toBe('#0080ff');
    });

    it('should convert rgba(0, 0, 0, 0) to #000000, ignoring zero alpha', () => {
      expect(rgbToHex('rgba(0, 0, 0, 0)')).toBe('#000000');
    });

    it('should handle rgba with alpha value 0.75', () => {
      expect(rgbToHex('rgba(100, 200, 50, 0.75)')).toBe('#64c832');
    });
  });

  describe('hex format passthrough (Requirement 4.4)', () => {
    it('should return #ff0000 as-is', () => {
      expect(rgbToHex('#ff0000')).toBe('#ff0000');
    });

    it('should return #000000 as-is', () => {
      expect(rgbToHex('#000000')).toBe('#000000');
    });

    it('should return shorthand hex #fff as-is', () => {
      expect(rgbToHex('#fff')).toBe('#fff');
    });

    it('should return 8-digit hex with alpha as-is', () => {
      expect(rgbToHex('#ff000080')).toBe('#ff000080');
    });
  });

  describe('unrecognized format default (Requirement 4.5)', () => {
    it('should return #000000 for empty string', () => {
      expect(rgbToHex('')).toBe('#000000');
    });

    it('should return #000000 for named color "red"', () => {
      expect(rgbToHex('red')).toBe('#000000');
    });

    it('should return #000000 for hsl format', () => {
      expect(rgbToHex('hsl(0, 100%, 50%)')).toBe('#000000');
    });

    it('should return #000000 for random text', () => {
      expect(rgbToHex('not-a-color')).toBe('#000000');
    });
  });
});
