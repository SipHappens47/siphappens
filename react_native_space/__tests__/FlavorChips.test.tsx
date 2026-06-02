import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FlavorChips } from '../src/components/FlavorChips';
import { FlavorTag } from '../src/types';

describe('FlavorChips', () => {
  const mockTags: FlavorTag[] = [
    { id: '1', name: 'Smoky' },
    { id: '2', name: 'Sweet' },
    { id: '3', name: 'Spicy' },
  ];

  it('should render all flavor tags', () => {
    const { getByText } = render(
      <FlavorChips
        tags={mockTags}
        selectedIds={[]}
        onToggle={() => {}}
      />
    );

    expect(getByText('Smoky')).toBeTruthy();
    expect(getByText('Sweet')).toBeTruthy();
    expect(getByText('Spicy')).toBeTruthy();
  });

  it('should call onToggle when chip is pressed', () => {
    const onToggleMock = jest.fn();
    const { getByText } = render(
      <FlavorChips
        tags={mockTags}
        selectedIds={[]}
        onToggle={onToggleMock}
      />
    );

    fireEvent.press(getByText('Smoky'));

    expect(onToggleMock).toHaveBeenCalledWith('1');
  });

  it('should not call onToggle when editable is false', () => {
    const onToggleMock = jest.fn();
    const { getByText } = render(
      <FlavorChips
        tags={mockTags}
        selectedIds={[]}
        onToggle={onToggleMock}
        editable={false}
      />
    );

    fireEvent.press(getByText('Smoky'));

    expect(onToggleMock).not.toHaveBeenCalled();
  });

  it('should handle empty tags array', () => {
    const { queryByText } = render(
      <FlavorChips
        tags={[]}
        selectedIds={[]}
        onToggle={() => {}}
      />
    );

    expect(queryByText('Smoky')).toBeNull();
  });
});
