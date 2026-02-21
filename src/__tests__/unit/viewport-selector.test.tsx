/**
 * Unit tests for ViewportSelector component
 * Feature: ai-html-visual-editor
 * Requirements: 18.1, 18.3, 18.5
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ViewportSelector } from '../../components/viewport/ViewportSelector';
import type { ViewportConfig } from '../../types';

describe('ViewportSelector Component', () => {
  describe('Rendering', () => {
    it('should render with desktop viewport', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
        />
      );

      expect(screen.getByLabelText('Viewport:')).toBeInTheDocument();
      expect(screen.getByDisplayValue(/Desktop/)).toBeInTheDocument();
    });

    it('should render with tablet viewport', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="tablet"
          onViewportChange={onViewportChange}
        />
      );

      expect(screen.getByDisplayValue(/Tablet/)).toBeInTheDocument();
    });

    it('should render with mobile viewport', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="mobile"
          onViewportChange={onViewportChange}
        />
      );

      expect(screen.getByDisplayValue(/Mobile/)).toBeInTheDocument();
    });

    it('should render with custom viewport', () => {
      const onViewportChange = jest.fn();
      const custom: ViewportConfig = { width: 1024, height: 768 };
      render(
        <ViewportSelector
          currentViewport={custom}
          onViewportChange={onViewportChange}
        />
      );

      expect(screen.getByDisplayValue('Custom Size')).toBeInTheDocument();
    });

    it('should display current viewport size when showSize is true', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
          showSize={true}
        />
      );

      expect(screen.getByText(/Desktop: 1920 × 1080/)).toBeInTheDocument();
    });

    it('should not display viewport size when showSize is false', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
          showSize={false}
        />
      );

      expect(screen.queryByText(/Desktop: 1920 × 1080/)).not.toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const onViewportChange = jest.fn();
      const { container } = render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
          className="custom-class"
        />
      );

      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('Preset Viewport Selection', () => {
    it('should call onViewportChange when switching to tablet', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
        />
      );

      const select = screen.getByLabelText('Viewport:');
      fireEvent.change(select, { target: { value: 'tablet' } });

      expect(onViewportChange).toHaveBeenCalledWith('tablet');
    });

    it('should call onViewportChange when switching to mobile', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
        />
      );

      const select = screen.getByLabelText('Viewport:');
      fireEvent.change(select, { target: { value: 'mobile' } });

      expect(onViewportChange).toHaveBeenCalledWith('mobile');
    });

    it('should call onViewportChange when switching to desktop', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="tablet"
          onViewportChange={onViewportChange}
        />
      );

      const select = screen.getByLabelText('Viewport:');
      fireEvent.change(select, { target: { value: 'desktop' } });

      expect(onViewportChange).toHaveBeenCalledWith('desktop');
    });
  });

  describe('Custom Viewport Input', () => {
    it('should show custom input fields when selecting custom', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
        />
      );

      const select = screen.getByLabelText('Viewport:');
      fireEvent.change(select, { target: { value: 'custom' } });

      expect(screen.getByLabelText('Width (px):')).toBeInTheDocument();
      expect(screen.getByLabelText('Height (px):')).toBeInTheDocument();
      expect(screen.getByText('Apply')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should populate custom inputs with current dimensions', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
        />
      );

      const select = screen.getByLabelText('Viewport:');
      fireEvent.change(select, { target: { value: 'custom' } });

      const widthInput = screen.getByLabelText('Width (px):') as HTMLInputElement;
      const heightInput = screen.getByLabelText('Height (px):') as HTMLInputElement;

      expect(widthInput.value).toBe('1920');
      expect(heightInput.value).toBe('1080');
    });

    it('should call onViewportChange with valid custom dimensions', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
        />
      );

      const select = screen.getByLabelText('Viewport:');
      fireEvent.change(select, { target: { value: 'custom' } });

      const widthInput = screen.getByLabelText('Width (px):');
      const heightInput = screen.getByLabelText('Height (px):');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(widthInput, { target: { value: '1024' } });
      fireEvent.change(heightInput, { target: { value: '768' } });
      fireEvent.click(applyButton);

      expect(onViewportChange).toHaveBeenCalledWith({ width: 1024, height: 768 });
    });

    it('should show error for invalid width', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
        />
      );

      const select = screen.getByLabelText('Viewport:');
      fireEvent.change(select, { target: { value: 'custom' } });

      const widthInput = screen.getByLabelText('Width (px):');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(widthInput, { target: { value: '100' } });
      fireEvent.click(applyButton);

      expect(screen.getByText('Width must be at least 320px')).toBeInTheDocument();
      expect(onViewportChange).not.toHaveBeenCalled();
    });

    it('should show error for invalid height', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
        />
      );

      const select = screen.getByLabelText('Viewport:');
      fireEvent.change(select, { target: { value: 'custom' } });

      const heightInput = screen.getByLabelText('Height (px):');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(heightInput, { target: { value: '100' } });
      fireEvent.click(applyButton);

      expect(screen.getByText('Height must be at least 240px')).toBeInTheDocument();
      expect(onViewportChange).not.toHaveBeenCalled();
    });

    it('should hide custom input when cancel is clicked', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
        />
      );

      const select = screen.getByLabelText('Viewport:');
      fireEvent.change(select, { target: { value: 'custom' } });

      expect(screen.getByLabelText('Width (px):')).toBeInTheDocument();

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByLabelText('Width (px):')).not.toBeInTheDocument();
      expect(onViewportChange).not.toHaveBeenCalled();
    });

    it('should clear error when cancel is clicked', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
        />
      );

      const select = screen.getByLabelText('Viewport:');
      fireEvent.change(select, { target: { value: 'custom' } });

      const widthInput = screen.getByLabelText('Width (px):');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(widthInput, { target: { value: '100' } });
      fireEvent.click(applyButton);

      expect(screen.getByText('Width must be at least 320px')).toBeInTheDocument();

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.queryByText('Width must be at least 320px')).not.toBeInTheDocument();
    });

    it('should hide custom input after successful apply', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
        />
      );

      const select = screen.getByLabelText('Viewport:');
      fireEvent.change(select, { target: { value: 'custom' } });

      const widthInput = screen.getByLabelText('Width (px):');
      const heightInput = screen.getByLabelText('Height (px):');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(widthInput, { target: { value: '1024' } });
      fireEvent.change(heightInput, { target: { value: '768' } });
      fireEvent.click(applyButton);

      expect(screen.queryByLabelText('Width (px):')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle minimum valid dimensions (320x240)', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
        />
      );

      const select = screen.getByLabelText('Viewport:');
      fireEvent.change(select, { target: { value: 'custom' } });

      const widthInput = screen.getByLabelText('Width (px):');
      const heightInput = screen.getByLabelText('Height (px):');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(widthInput, { target: { value: '320' } });
      fireEvent.change(heightInput, { target: { value: '240' } });
      fireEvent.click(applyButton);

      expect(onViewportChange).toHaveBeenCalledWith({ width: 320, height: 240 });
    });

    it('should handle maximum valid dimensions (7680x4320)', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
        />
      );

      const select = screen.getByLabelText('Viewport:');
      fireEvent.change(select, { target: { value: 'custom' } });

      const widthInput = screen.getByLabelText('Width (px):');
      const heightInput = screen.getByLabelText('Height (px):');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(widthInput, { target: { value: '7680' } });
      fireEvent.change(heightInput, { target: { value: '4320' } });
      fireEvent.click(applyButton);

      expect(onViewportChange).toHaveBeenCalledWith({ width: 7680, height: 4320 });
    });

    it('should handle non-numeric input', () => {
      const onViewportChange = jest.fn();
      render(
        <ViewportSelector
          currentViewport="desktop"
          onViewportChange={onViewportChange}
        />
      );

      const select = screen.getByLabelText('Viewport:');
      fireEvent.change(select, { target: { value: 'custom' } });

      const widthInput = screen.getByLabelText('Width (px):');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(widthInput, { target: { value: 'abc' } });
      fireEvent.click(applyButton);

      expect(screen.getByText('Width must be a positive number')).toBeInTheDocument();
      expect(onViewportChange).not.toHaveBeenCalled();
    });
  });
});
