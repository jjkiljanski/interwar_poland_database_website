import { useState } from 'react';
import { DatasetTreeNode } from '../types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Search, ChevronRight, Database } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from './ui/breadcrumb';
import { useLanguage } from '../lib/i18n';

interface DatasetSelectorProps {
  treeData: DatasetTreeNode[];
  onSelectDataset: (datasetId: string, path: string[]) => void;
  selectedDatasetId?: string;
}

export function DatasetSelector({ treeData, onSelectDataset, selectedDatasetId }: DatasetSelectorProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [breadcrumbPath, setBreadcrumbPath] = useState<string[]>([]);

  const filterTree = (nodes: DatasetTreeNode[], query: string): DatasetTreeNode[] => {
    if (!query) return nodes;
    
    return nodes.reduce((acc, node) => {
      const nameMatches = node.name.toLowerCase().includes(query.toLowerCase());
      const filteredChildren = node.children ? filterTree(node.children, query) : [];
      
      if (nameMatches || filteredChildren.length > 0) {
        acc.push({
          ...node,
          children: filteredChildren.length > 0 ? filteredChildren : node.children,
        });
      }
      
      return acc;
    }, [] as DatasetTreeNode[]);
  };

  const handleDatasetClick = (node: DatasetTreeNode, path: string[]) => {
    if (node.datasetId) {
      const fullPath = [...path, node.name];
      setBreadcrumbPath(fullPath);
      onSelectDataset(node.datasetId, fullPath);
    }
  };

  const renderTreeNode = (node: DatasetTreeNode, path: string[] = [], level: number = 0): JSX.Element => {
    const currentPath = [...path, node.name];
    const isLeaf = !!node.datasetId;
    const isSelected = node.datasetId === selectedDatasetId;

    if (isLeaf) {
      return (
        <Button
          key={node.id}
          variant={isSelected ? 'secondary' : 'ghost'}
          className="w-full justify-start text-left mb-1"
          onClick={() => handleDatasetClick(node, path)}
        >
          <Database className="mr-2 h-4 w-4 flex-shrink-0" />
          <span className="truncate">{node.name}</span>
        </Button>
      );
    }

    if (node.children && node.children.length > 0) {
      return (
        <AccordionItem key={node.id} value={node.id} className="border-none">
          <AccordionTrigger className="py-2 hover:no-underline hover:bg-gray-100 px-2 rounded">
            <div className="flex items-center gap-2">
              <ChevronRight className="h-4 w-4" />
              <span>{node.name}</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pl-4 pt-1">
            {node.children.map(child => renderTreeNode(child, currentPath, level + 1))}
          </AccordionContent>
        </AccordionItem>
      );
    }

    return <div key={node.id}></div>;
  };

  const filteredTree = filterTree(treeData, searchQuery);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="mb-4">{t('selector.title')}</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('selector.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {breadcrumbPath.length > 0 && (
        <div className="px-4 py-2 border-b bg-gray-50">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbPath.map((item, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    <BreadcrumbLink className="max-w-20 truncate md:max-w-none">
                      {item}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4">
          {filteredTree.length > 0 ? (
            <Accordion type="multiple" className="w-full">
              {filteredTree.map(node => renderTreeNode(node))}
            </Accordion>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t('selector.noResults')} "{searchQuery}"
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
