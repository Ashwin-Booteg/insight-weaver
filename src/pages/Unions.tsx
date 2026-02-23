import React from 'react';
import SectorPage from '@/components/SectorPage';

const Unions = () => (
  <SectorPage
    sector="unions"
    sectorLabel="Unions"
    sectorColor="hsl(var(--chart-amber))"
    sectorGradient="from-amber-500/10 to-amber-600/5"
    emptyIcon="users"
    emptyTitle="No Union data yet"
    emptyDescription="Upload an Excel file with union membership data — locals, member counts, jurisdictions, and more."
  />
);

export default Unions;
