import React, { useState } from 'react';
import { ClaimAllRewardSummary } from '../../types/app';

// State màn Lớp học: lọc, tìm kiếm, sắp xếp, chọn nhiều. (Màn hiện tại nằm trên URL, xem useScreenRoute.)
export const useClassState = () => {
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<'name' | 'points-desc' | 'points-asc'>('points-desc');
  const [filterClass, setFilterClass] = useState<string>('Tất cả');
  const [hoveredStudentCardId, setHoveredStudentCardId] = useState<string | null>(null);
  const [claimAllRewardSummary, setClaimAllRewardSummary] = useState<ClaimAllRewardSummary[] | null>(null);

  return {
    selectedStudentIds, setSelectedStudentIds,
    isMultiSelectMode, setIsMultiSelectMode, searchQuery, setSearchQuery, sortType,
    setSortType, filterClass, setFilterClass, hoveredStudentCardId, setHoveredStudentCardId,
    claimAllRewardSummary, setClaimAllRewardSummary
  };
};
