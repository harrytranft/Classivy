import React, { useEffect } from 'react';
import { AppScope } from '../../app/AppContext';

export const useLudoEffects = (app: AppScope) => {
  const {
    activeLudoClassName, ludoActiveStudent, setLudoActiveStudent, setLudoMonsterStuck,
    setLudoPositions, setLudoSteps, students
  } = app;

  useEffect(() => {
    if (students && students.length > 0) {
      const posMap: Record<string, number> = {};
      const stepsMap: Record<string, number> = {};
      const stuckMap: Record<string, boolean> = {};

      students.forEach(s => {
        posMap[s.id] = s.ludoTile || 0;
        stepsMap[s.id] = s.ludoSteps || 0;
        stuckMap[s.id] = !!s.ludoMonsterStuck;
      });

      setLudoPositions(posMap);
      setLudoSteps(stepsMap);
      setLudoMonsterStuck(stuckMap);
    }
  }, [students]);

  useEffect(() => {
    if (ludoActiveStudent && ludoActiveStudent.className !== activeLudoClassName) {
      setLudoActiveStudent(null);
    }
  }, [activeLudoClassName, ludoActiveStudent]);
};
