import React, { useState, useMemo } from 'react';
import { ResponsiveSunburst } from '@nivo/sunburst';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GeographyProfile, getRegionFromLocation, getRegionColors, getLocationName } from '@/types/geography';

interface SunburstNode {
  id: string;
  name: string;
  value?: number;
  color?: string;
  children?: SunburstNode[];
}

interface SunburstChartProps {
  stateBreakdown: Record<string, number>;
  roleBreakdown: Record<string, number>;
  stateRoleData?: Record<string, Record<string, number>>;
  onRegionFilter?: (region: string) => void;
  onStateFilter?: (stateCode: string) => void;
  className?: string;
  profile?: GeographyProfile;
}

function getStateColor(regionColor: string, index: number, total: number): string {
  const lightness = 50 + (index / total) * 20;
  const match = regionColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (match) return `hsl(${match[1]}, ${match[2]}%, ${lightness}%)`;
  return regionColor;
}

function getRoleColor(baseColor: string, index: number, total: number): string {
  const lightness = 40 + (index / total) * 35;
  const match = baseColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (match) return `hsl(${match[1]}, ${parseInt(match[2]) - 10}%, ${lightness}%)`;
  return baseColor;
}

export function SunburstChart({ 
  stateBreakdown, roleBreakdown, stateRoleData,
  onRegionFilter, onStateFilter, className, profile
}: SunburstChartProps) {
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const [activeNode, setActiveNode] = useState<SunburstNode | null>(null);

  const regionColors = useMemo(() => profile ? getRegionColors(profile) : {}, [profile]);
  const regions = useMemo(() => profile ? profile.regions : {}, [profile]);
  const regionNames = useMemo(() => Object.keys(regions), [regions]);

  const sunburstData = useMemo((): SunburstNode => {
    const regionChildren: SunburstNode[] = regionNames.map(region => {
      const regionLocations = regions[region] || [];
      const locationsWithData = regionLocations.filter(loc => stateBreakdown[loc] && stateBreakdown[loc] > 0);
      
      if (locationsWithData.length === 0) {
        return { id: region, name: region, value: 0, color: regionColors[region], children: [] };
      }

      const stateChildren: SunburstNode[] = locationsWithData.map((locCode, stateIndex) => {
        const stateValue = stateBreakdown[locCode] || 0;
        const stateName = profile ? getLocationName(locCode, profile) : locCode;
        const stateColor = getStateColor(regionColors[region] || 'hsl(200, 70%, 50%)', stateIndex, locationsWithData.length);

        let roleChildren: SunburstNode[] = [];
        if (stateRoleData && stateRoleData[locCode]) {
          const stateRoles = stateRoleData[locCode];
          const topRoles = Object.entries(stateRoles).sort((a, b) => b[1] - a[1]).slice(0, 5);
          roleChildren = topRoles.map(([role, count], roleIndex) => ({
            id: `${locCode}-${role}`,
            name: role.length > 20 ? role.slice(0, 20) + '...' : role,
            value: count,
            color: getRoleColor(stateColor, roleIndex, topRoles.length)
          }));
        } else {
          const topRoles = Object.entries(roleBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 5);
          const totalRoles = topRoles.reduce((sum, [, count]) => sum + count, 0);
          roleChildren = topRoles.map(([role, count], roleIndex) => ({
            id: `${locCode}-${role}`,
            name: role.length > 20 ? role.slice(0, 20) + '...' : role,
            value: Math.round((count / totalRoles) * stateValue),
            color: getRoleColor(stateColor, roleIndex, topRoles.length)
          }));
        }

        return {
          id: locCode, name: stateName, color: stateColor,
          children: roleChildren.length > 0 ? roleChildren : undefined,
          value: roleChildren.length === 0 ? stateValue : undefined
        };
      });

      return { id: region, name: region, color: regionColors[region], children: stateChildren };
    });

    return {
      id: 'root', name: `All ${profile?.regionLabel || 'Regions'}`,
      color: 'hsl(var(--primary))',
      children: regionChildren.filter(r => (r.children && r.children.length > 0) || (r.value && r.value > 0))
    };
  }, [stateBreakdown, roleBreakdown, stateRoleData, profile, regions, regionNames, regionColors]);

  const currentData = useMemo(() => {
    if (drillPath.length === 0) return sunburstData;
    let node = sunburstData;
    for (const pathId of drillPath) {
      const child = node.children?.find(c => c.id === pathId);
      if (child) node = { id: child.id, name: child.name, color: child.color, children: child.children };
    }
    return node;
  }, [sunburstData, drillPath]);

  const handleClick = (node: any) => {
    if (node.data.children && node.data.children.length > 0) {
      setDrillPath([...drillPath, node.data.id]);
      setActiveNode(node.data);
    }
    const nodeId = node.data.id as string;
    if (regionNames.includes(nodeId)) {
      onRegionFilter?.(nodeId);
    } else if (profile?.locationMap[nodeId]) {
      onStateFilter?.(nodeId);
    }
  };

  const getBreadcrumb = () => {
    const path = [`All ${profile?.regionLabel || 'Regions'}`];
    let node = sunburstData;
    for (const pathId of drillPath) {
      const child = node.children?.find(c => c.id === pathId);
      if (child) { path.push(child.name); node = child; }
    }
    return path;
  };

  const breadcrumb = getBreadcrumb();
  const hasData = currentData.children && currentData.children.length > 0;

  return (
    <Card className={cn('chart-container', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold text-foreground">
            Hierarchical Drill-Down: {profile?.regionLabel || 'Region'} → {profile?.locationLabel || 'Location'} → Roles
          </CardTitle>
          {drillPath.length > 0 && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setDrillPath(drillPath.slice(0, -1))} className="h-7 px-2">
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setDrillPath([]); setActiveNode(null); }} className="h-7 px-2">
                <Home className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
          {breadcrumb.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="mx-1">›</span>}
              <span
                className={cn(index === breadcrumb.length - 1 ? 'text-foreground font-medium' : 'hover:text-foreground cursor-pointer')}
                onClick={() => { if (index < breadcrumb.length - 1) setDrillPath(drillPath.slice(0, index)); }}
              >{crumb}</span>
            </React.Fragment>
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {hasData ? (
          <div className="h-[400px]">
            <ResponsiveSunburst
              data={currentData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              id="id" value="value" cornerRadius={4} borderWidth={2}
              borderColor={{ theme: 'background' }}
              colors={(node) => node.data.color || 'hsl(var(--primary))'}
              childColor={{ from: 'color', modifiers: [['brighter', 0.2]] }}
              enableArcLabels={true} arcLabelsSkipAngle={12}
              arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
              onClick={handleClick}
              tooltip={({ id, value, color, data }) => (
                <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    <span className="font-medium text-sm">{data.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">{value?.toLocaleString()} people</div>
                  {data.children && data.children.length > 0 && (
                    <div className="text-xs text-primary mt-1">Click to drill down</div>
                  )}
                </div>
              )}
              motionConfig="gentle" transitionMode="pushIn"
            />
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No data available for the selected filters
          </div>
        )}
        {drillPath.length === 0 && hasData && (
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {regionNames.map(region => (
              <div key={region} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: regionColors[region] }} />
                <span className="text-xs text-muted-foreground">{region}</span>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground text-center mt-3">
          Click on any segment to drill down & filter • Use Back to navigate up
        </p>
      </CardContent>
    </Card>
  );
}
