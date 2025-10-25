export interface DatasetMetadata {
  id: string;
  name: string;
  source: string;
  sourceLink: string;
  date: string;
  description: string;
  unit?: string;
  category?: string;
  methodology?: string;
  notes?: string;
  [key: string]: any;
}

export interface DatasetTreeNode {
  id: string;
  name: string;
  children?: DatasetTreeNode[];
  datasetId?: string; // Only leaf nodes have this
  level: number;
}

export interface DistrictData {
  districtId: string;
  districtName: string;
  value: number;
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    id: string;
    name: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any;
  };
}

export interface GeoJSONData {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}
