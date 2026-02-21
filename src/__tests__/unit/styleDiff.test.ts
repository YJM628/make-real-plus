/**
 * Unit tests for getStyleDiff utility function
 * Feature: floating-edit-panel-refactor
 * Requirements: 5.2, 5.3, 5.4
 */

import { getStyleDiff } from '../../utils/dom/styleDiff';

describe('getStyleDiff', () => {
  describe('detecting changed properties (Requirement 5.2)', () => {
    it('should include a property whose value differs between initial and current', () => {
      const initial = { color: '#000000', fontSize: '16px' };
      const current = { color: '#ff0000', fontSize: '16px' };

      expect(getStyleDiff(initial, current)).toEqual({ color: '#ff0000' });
    });

    it('should include multiple changed properties', () => {
      const initial = { color: '#000', fontSize: '14px', padding: '8px' };
      const current = { color: '#fff', fontSize: '18px', padding: '8px' };

      expect(getStyleDiff(initial, current)).toEqual({
        color: '#fff',
        fontSize: '18px',
      });
    });

    it('should include a property present in current but missing in initial', () => {
      const initial = { color: '#000' };
      const current = { color: '#000', margin: '10px' };

      expect(getStyleDiff(initial, current)).toEqual({ margin: '10px' });
    });
  });

  describe('returning empty object when no changes (Requirement 5.3)', () => {
    it('should return empty object when initial and current are identical', () => {
      const styles = { color: '#000', fontSize: '16px', padding: '8px' };

      expect(getStyleDiff(styles, { ...styles })).toEqual({});
    });

    it('should return empty object when both are empty', () => {
      expect(getStyleDiff({}, {})).toEqual({});
    });
  });

  describe('automatic detection of new properties (Requirement 5.4)', () => {
    it('should detect changes in any arbitrary property without modification', () => {
      const initial = {
        color: '#000',
        fontSize: '16px',
        borderRadius: '4px',
        opacity: '1',
      };
      const current = {
        color: '#000',
        fontSize: '16px',
        borderRadius: '8px',
        opacity: '0.5',
      };

      expect(getStyleDiff(initial, current)).toEqual({
        borderRadius: '8px',
        opacity: '0.5',
      });
    });

    it('should handle newly added style properties automatically', () => {
      const initial = { color: '#000' };
      const current = { color: '#000', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' };

      expect(getStyleDiff(initial, current)).toEqual({
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      });
    });
  });
});
