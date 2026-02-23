import React from 'react';
import SectorPage from '@/components/SectorPage';

const TalentUsers = () => (
  <SectorPage
    sector="talent_users"
    sectorLabel="Talent Users"
    sectorColor="hsl(var(--chart-teal))"
    sectorGradient="from-teal-500/10 to-teal-600/5"
    emptyIcon="users"
    emptyTitle="No Talent User data yet"
    emptyDescription="Upload an Excel file with talent/workforce data — roles, locations, industries, and more."
  />
);

export default TalentUsers;
