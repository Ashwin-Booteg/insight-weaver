import React from 'react';
import SectorPage from '@/components/SectorPage';

const ProductionCompanies = () => (
  <SectorPage
    sector="production_companies"
    sectorLabel="Production Companies"
    sectorColor="hsl(var(--chart-blue))"
    sectorGradient="from-blue-500/10 to-blue-600/5"
    emptyIcon="factory"
    emptyTitle="No Production Company data yet"
    emptyDescription="Upload an Excel file with production company data — company names, locations, headcounts, and more."
  />
);

export default ProductionCompanies;
