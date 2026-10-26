import React, { useState } from 'react';
import { ClaimAllRewardSummary, Screen } from '../../types/app';

// State màn Lớp học: màn hiện tại, lọc, tìm kiếm, sắp xếp, chọn nhiều.
export const useClassState = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('class');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<'name' | 'points-desc' | 'points-asc'>('points-desc');
  const [filterClass, setFilterClass] = useState<string>('Tất cả');
  const [hoveredStudentCardId, setHoveredStudentCardId] = useState<string | null>(null);
  const [claimAllRewardSummary, setClaimAllRewardSummary] = useState<ClaimAllRewardSummary[] | null>(null);

  return {
    currentScreen, setCurrentScreen, selectedStudentIds, setSelectedStudentIds,
    isMultiSelectMode, setIsMultiSelectMode, searchQuery, setSearchQuery, sortType,
    setSortType, filterClass, setFilterClass, hoveredStudentCardId, setHoveredStudentCardId,
    claimAllRewardSummary, setClaimAllRewardSummary
  };
};
